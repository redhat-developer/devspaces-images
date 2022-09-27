/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/base/common/lifecycle';
import { URI } from 'vs/base/common/uri';
import { localize } from 'vs/nls';
import { Action2, MenuId, registerAction2 } from 'vs/platform/actions/common/actions';
import { ContextKeyExpr, IContextKey, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { IFileService } from 'vs/platform/files/common/files';
import { IProductService } from 'vs/platform/product/common/productService';
import { IQuickInputService, IQuickPickItem, IQuickPickSeparator } from 'vs/platform/quickinput/common/quickInput';
import { IRequestService } from 'vs/platform/request/common/request';
import { IStorageService, IStorageValueChangeEvent, StorageScope, StorageTarget } from 'vs/platform/storage/common/storage';
import { createSyncHeaders, IAuthenticationProvider, IResourceRefHandle } from 'vs/platform/userDataSync/common/userDataSync';
import { UserDataSyncStoreClient } from 'vs/platform/userDataSync/common/userDataSyncStoreService';
import { AuthenticationSession, AuthenticationSessionsChangeEvent, IAuthenticationService } from 'vs/workbench/services/authentication/common/authentication';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { EDIT_SESSIONS_SIGNED_IN, EditSession, EDIT_SESSION_SYNC_CATEGORY, IEditSessionsStorageService, EDIT_SESSIONS_SIGNED_IN_KEY, IEditSessionsLogService } from 'vs/workbench/contrib/editSessions/common/editSessions';
import { IDialogService } from 'vs/platform/dialogs/common/dialogs';
import { generateUuid } from 'vs/base/common/uuid';
import { ICredentialsService } from 'vs/platform/credentials/common/credentials';
import { getCurrentAuthenticationSessionInfo } from 'vs/workbench/services/authentication/browser/authenticationService';
import { isWeb } from 'vs/base/common/platform';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { Codicon } from 'vs/base/common/codicons';
import { IUserDataSyncMachinesService, UserDataSyncMachinesService } from 'vs/platform/userDataSync/common/userDataSyncMachines';

type ExistingSession = IQuickPickItem & { session: AuthenticationSession & { providerId: string } };
type AuthenticationProviderOption = IQuickPickItem & { provider: IAuthenticationProvider };

const configureContinueOnPreference = { iconClass: Codicon.settingsGear.classNames, tooltip: localize('configure continue on', 'Configure this preference in settings') };
export class EditSessionsWorkbenchService extends Disposable implements IEditSessionsStorageService {

	_serviceBrand = undefined;

	private serverConfiguration = this.productService['editSessions.store'];
	private storeClient: EditSessionsStoreClient | undefined;
	private machineClient: IUserDataSyncMachinesService | undefined;

	#authenticationInfo: { sessionId: string; token: string; providerId: string } | undefined;
	private static CACHED_SESSION_STORAGE_KEY = 'editSessionAccountPreference';

	private initialized = false;
	private readonly signedInContext: IContextKey<boolean>;

	get isSignedIn() {
		return this.existingSessionId !== undefined;
	}

	constructor(
		@IFileService private readonly fileService: IFileService,
		@IStorageService private readonly storageService: IStorageService,
		@IQuickInputService private readonly quickInputService: IQuickInputService,
		@IAuthenticationService private readonly authenticationService: IAuthenticationService,
		@IExtensionService private readonly extensionService: IExtensionService,
		@IEnvironmentService private readonly environmentService: IEnvironmentService,
		@IEditSessionsLogService private readonly logService: IEditSessionsLogService,
		@IProductService private readonly productService: IProductService,
		@IContextKeyService private readonly contextKeyService: IContextKeyService,
		@IRequestService private readonly requestService: IRequestService,
		@IDialogService private readonly dialogService: IDialogService,
		@ICredentialsService private readonly credentialsService: ICredentialsService,
		@ICommandService private readonly commandService: ICommandService
	) {
		super();

		// If the user signs out of the current session, reset our cached auth state in memory and on disk
		this._register(this.authenticationService.onDidChangeSessions((e) => this.onDidChangeSessions(e.event)));

		// If another window changes the preferred session storage, reset our cached auth state in memory
		this._register(this.storageService.onDidChangeValue(e => this.onDidChangeStorage(e)));

		this.registerSignInAction();
		this.registerResetAuthenticationAction();

		this.signedInContext = EDIT_SESSIONS_SIGNED_IN.bindTo(this.contextKeyService);
		this.signedInContext.set(this.existingSessionId !== undefined);
	}

	/**
	 *
	 * @param editSession An object representing edit session state to be restored.
	 * @returns The ref of the stored edit session state.
	 */
	async write(editSession: EditSession): Promise<string> {
		await this.initialize(false);
		if (!this.initialized) {
			throw new Error('Please sign in to store your edit session.');
		}

		if (editSession.machine === undefined) {
			editSession.machine = await this.getOrCreateCurrentMachineId();
		}

		return this.storeClient!.writeResource('editSessions', JSON.stringify(editSession), null, undefined, createSyncHeaders(generateUuid()));
	}

	/**
	 * @param ref: A specific content ref to retrieve content for, if it exists.
	 * If undefined, this method will return the latest saved edit session, if any.
	 *
	 * @returns An object representing the requested or latest edit session state, if any.
	 */
	async read(ref: string | undefined): Promise<{ ref: string; editSession: EditSession } | undefined> {
		await this.initialize(false);
		if (!this.initialized) {
			throw new Error('Please sign in to apply your latest edit session.');
		}

		let content: string | undefined | null;
		const headers = createSyncHeaders(generateUuid());
		try {
			if (ref !== undefined) {
				content = await this.storeClient?.resolveResourceContent('editSessions', ref, undefined, headers);
			} else {
				const result = await this.storeClient?.readResource('editSessions', null, undefined, headers);
				content = result?.content;
				ref = result?.ref;
			}
		} catch (ex) {
			this.logService.error(ex);
		}

		// TODO@joyceerhl Validate session data, check schema version
		return (content !== undefined && content !== null && ref !== undefined) ? { ref: ref, editSession: JSON.parse(content) } : undefined;
	}

	async delete(ref: string | null) {
		await this.initialize(false);
		if (!this.initialized) {
			throw new Error(`Unable to delete edit session with ref ${ref}.`);
		}

		try {
			await this.storeClient?.deleteResource('editSessions', ref);
		} catch (ex) {
			this.logService.error(ex);
		}
	}

	async list(): Promise<IResourceRefHandle[]> {
		await this.initialize(false);
		if (!this.initialized) {
			throw new Error(`Unable to list edit sessions.`);
		}

		try {
			return this.storeClient?.getAllResourceRefs('editSessions') ?? [];
		} catch (ex) {
			this.logService.error(ex);
		}

		return [];
	}

	public async initialize(fromContinueOn: boolean) {
		if (this.initialized) {
			return true;
		}
		this.initialized = await this.doInitialize(fromContinueOn);
		this.signedInContext.set(this.initialized);
		return this.initialized;

	}

	/**
	 *
	 * Ensures that the store client is initialized,
	 * meaning that authentication is configured and it
	 * can be used to communicate with the remote storage service
	 */
	private async doInitialize(fromContinueOn: boolean): Promise<boolean> {
		// Wait for authentication extensions to be registered
		await this.extensionService.whenInstalledExtensionsRegistered();

		if (!this.serverConfiguration?.url) {
			throw new Error('Unable to initialize sessions sync as session sync preference is not configured in product.json.');
		}

		if (!this.storeClient) {
			this.storeClient = new EditSessionsStoreClient(URI.parse(this.serverConfiguration.url), this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService);
			this._register(this.storeClient.onTokenFailed(() => {
				this.logService.info('Clearing edit sessions authentication preference because of successive token failures.');
				this.clearAuthenticationPreference();
			}));
		}

		if (this.machineClient === undefined) {
			this.machineClient = new UserDataSyncMachinesService(this.environmentService, this.fileService, this.storageService, this.storeClient!, this.logService, this.productService);
		}

		// If we already have an existing auth session in memory, use that
		if (this.#authenticationInfo !== undefined) {
			return true;
		}

		const authenticationSession = await this.getAuthenticationSession(fromContinueOn);
		if (authenticationSession !== undefined) {
			this.#authenticationInfo = authenticationSession;
			this.storeClient.setAuthToken(authenticationSession.token, authenticationSession.providerId);
		}

		return authenticationSession !== undefined;
	}

	private cachedMachines: Map<string, string> | undefined;

	async getMachineById(machineId: string) {
		await this.initialize(false);

		if (!this.cachedMachines) {
			const machines = await this.machineClient!.getMachines();
			this.cachedMachines = machines.reduce((map, machine) => map.set(machine.id, machine.name), new Map<string, string>());
		}

		return this.cachedMachines.get(machineId);
	}

	private async getOrCreateCurrentMachineId(): Promise<string> {
		const currentMachineId = await this.machineClient!.getMachines().then((machines) => machines.find((m) => m.isCurrent)?.id);

		if (currentMachineId === undefined) {
			await this.machineClient!.addCurrentMachine();
			return await this.machineClient!.getMachines().then((machines) => machines.find((m) => m.isCurrent)!.id);
		}

		return currentMachineId;
	}

	private async getAuthenticationSession(fromContinueOn: boolean) {
		// If the user signed in previously and the session is still available, reuse that without prompting the user again
		if (this.existingSessionId) {
			this.logService.info(`Searching for existing authentication session with ID ${this.existingSessionId}`);
			const existingSession = await this.getExistingSession();
			if (existingSession) {
				this.logService.info(`Found existing authentication session with ID ${existingSession.session.id}`);
				return { sessionId: existingSession.session.id, token: existingSession.session.idToken ?? existingSession.session.accessToken, providerId: existingSession.session.providerId };
			}
		}

		// If settings sync is already enabled, avoid asking again to authenticate
		if (this.shouldAttemptEditSessionInit()) {
			this.logService.info(`Reusing user data sync enablement`);
			const authenticationSessionInfo = await getCurrentAuthenticationSessionInfo(this.credentialsService, this.productService);
			if (authenticationSessionInfo !== undefined) {
				this.logService.info(`Using current authentication session with ID ${authenticationSessionInfo.id}`);
				this.existingSessionId = authenticationSessionInfo.id;
				return { sessionId: authenticationSessionInfo.id, token: authenticationSessionInfo.accessToken, providerId: authenticationSessionInfo.providerId };
			}
		}

		// Ask the user to pick a preferred account
		const authenticationSession = await this.getAccountPreference(fromContinueOn);
		if (authenticationSession !== undefined) {
			this.existingSessionId = authenticationSession.id;
			return { sessionId: authenticationSession.id, token: authenticationSession.idToken ?? authenticationSession.accessToken, providerId: authenticationSession.providerId };
		}

		return undefined;
	}

	private shouldAttemptEditSessionInit(): boolean {
		return isWeb && this.storageService.isNew(StorageScope.APPLICATION) && this.storageService.isNew(StorageScope.WORKSPACE);
	}

	/**
	 *
	 * Prompts the user to pick an authentication option for storing and getting edit sessions.
	 */
	private async getAccountPreference(fromContinueOn: boolean): Promise<AuthenticationSession & { providerId: string } | undefined> {
		const quickpick = this.quickInputService.createQuickPick<ExistingSession | AuthenticationProviderOption | IQuickPickItem>();
		quickpick.title = localize('account preference', 'Turn on Edit Sessions to bring your working changes with you');
		quickpick.ok = false;
		quickpick.placeholder = localize('choose account placeholder', "Select an account to sign in");
		quickpick.ignoreFocusOut = true;
		quickpick.items = await this.createQuickpickItems(fromContinueOn);

		return new Promise((resolve, reject) => {
			quickpick.onDidHide((e) => {
				resolve(undefined);
				quickpick.dispose();
			});

			quickpick.onDidAccept(async (e) => {
				const selection = quickpick.selectedItems[0];
				const session = 'provider' in selection ? { ...await this.authenticationService.createSession(selection.provider.id, selection.provider.scopes), providerId: selection.provider.id } : ('session' in selection ? selection.session : undefined);
				resolve(session);
				quickpick.hide();
			});

			quickpick.onDidTriggerItemButton(async (e) => {
				if (e.button.tooltip === configureContinueOnPreference.tooltip) {
					await this.commandService.executeCommand('workbench.action.openSettings', 'workbench.experimental.editSessions.continueOn');
				}
			});

			quickpick.show();
		});
	}

	private async createQuickpickItems(fromContinueOn: boolean): Promise<(ExistingSession | AuthenticationProviderOption | IQuickPickSeparator | IQuickPickItem & { canceledAuthentication: boolean })[]> {
		const options: (ExistingSession | AuthenticationProviderOption | IQuickPickSeparator | IQuickPickItem & { canceledAuthentication: boolean })[] = [];

		options.push({ type: 'separator', label: localize('signed in', "Signed In") });

		const sessions = await this.getAllSessions();
		options.push(...sessions);

		options.push({ type: 'separator', label: localize('others', "Others") });

		for (const authenticationProvider of (await this.getAuthenticationProviders())) {
			const signedInForProvider = sessions.some(account => account.session.providerId === authenticationProvider.id);
			if (!signedInForProvider || this.authenticationService.supportsMultipleAccounts(authenticationProvider.id)) {
				const providerName = this.authenticationService.getLabel(authenticationProvider.id);
				options.push({ label: localize('sign in using account', "Sign in with {0}", providerName), provider: authenticationProvider });
			}
		}

		if (fromContinueOn) {
			return options.concat([{ type: 'separator' }, {
				label: localize('continue without', 'Continue without my working changes'),
				canceledAuthentication: true,
				buttons: [configureContinueOnPreference]
			}]);
		}

		return options;
	}

	/**
	 *
	 * Returns all authentication sessions available from {@link getAuthenticationProviders}.
	 */
	private async getAllSessions() {
		const authenticationProviders = await this.getAuthenticationProviders();
		const accounts = new Map<string, ExistingSession>();
		let currentSession: ExistingSession | undefined;

		for (const provider of authenticationProviders) {
			const sessions = await this.authenticationService.getSessions(provider.id, provider.scopes);

			for (const session of sessions) {
				const item = {
					label: session.account.label,
					description: this.authenticationService.getLabel(provider.id),
					session: { ...session, providerId: provider.id }
				};
				accounts.set(item.session.account.id, item);
				if (this.existingSessionId === session.id) {
					currentSession = item;
				}
			}
		}

		if (currentSession !== undefined) {
			accounts.set(currentSession.session.account.id, currentSession);
		}

		return [...accounts.values()];
	}

	/**
	 *
	 * Returns all authentication providers which can be used to authenticate
	 * to the remote storage service, based on product.json configuration
	 * and registered authentication providers.
	 */
	private async getAuthenticationProviders() {
		if (!this.serverConfiguration) {
			throw new Error('Unable to get configured authentication providers as session sync preference is not configured in product.json.');
		}

		// Get the list of authentication providers configured in product.json
		const authenticationProviders = this.serverConfiguration.authenticationProviders;
		const configuredAuthenticationProviders = Object.keys(authenticationProviders).reduce<IAuthenticationProvider[]>((result, id) => {
			result.push({ id, scopes: authenticationProviders[id].scopes });
			return result;
		}, []);

		// Filter out anything that isn't currently available through the authenticationService
		const availableAuthenticationProviders = this.authenticationService.declaredProviders;

		return configuredAuthenticationProviders.filter(({ id }) => availableAuthenticationProviders.some(provider => provider.id === id));
	}

	private get existingSessionId() {
		return this.storageService.get(EditSessionsWorkbenchService.CACHED_SESSION_STORAGE_KEY, StorageScope.APPLICATION);
	}

	private set existingSessionId(sessionId: string | undefined) {
		this.logService.trace(`Saving authentication session preference for ID ${sessionId}.`);
		if (sessionId === undefined) {
			this.storageService.remove(EditSessionsWorkbenchService.CACHED_SESSION_STORAGE_KEY, StorageScope.APPLICATION);
		} else {
			this.storageService.store(EditSessionsWorkbenchService.CACHED_SESSION_STORAGE_KEY, sessionId, StorageScope.APPLICATION, StorageTarget.MACHINE);
		}
	}

	private async getExistingSession() {
		const accounts = await this.getAllSessions();
		return accounts.find((account) => account.session.id === this.existingSessionId);
	}

	private async onDidChangeStorage(e: IStorageValueChangeEvent): Promise<void> {
		if (e.key === EditSessionsWorkbenchService.CACHED_SESSION_STORAGE_KEY
			&& e.scope === StorageScope.APPLICATION
		) {
			const newSessionId = this.existingSessionId;
			const previousSessionId = this.#authenticationInfo?.sessionId;

			if (previousSessionId !== newSessionId) {
				this.logService.trace(`Resetting authentication state because authentication session ID preference changed from ${previousSessionId} to ${newSessionId}.`);
				this.#authenticationInfo = undefined;
				this.initialized = false;
			}
		}
	}

	private clearAuthenticationPreference(): void {
		this.#authenticationInfo = undefined;
		this.initialized = false;
		this.existingSessionId = undefined;
		this.signedInContext.set(false);
	}

	private onDidChangeSessions(e: AuthenticationSessionsChangeEvent): void {
		if (this.#authenticationInfo?.sessionId && e.removed.find(session => session.id === this.#authenticationInfo?.sessionId)) {
			this.clearAuthenticationPreference();
		}
	}

	private registerSignInAction() {
		const that = this;
		this._register(registerAction2(class ResetEditSessionAuthenticationAction extends Action2 {
			constructor() {
				super({
					id: 'workbench.editSessions.actions.signIn',
					title: localize('sign in', 'Turn on Edit Sessions...'),
					category: EDIT_SESSION_SYNC_CATEGORY,
					precondition: ContextKeyExpr.equals(EDIT_SESSIONS_SIGNED_IN_KEY, false),
					menu: [{
						id: MenuId.CommandPalette,
					},
					{
						id: MenuId.AccountsContext,
						group: '2_editSessions',
						when: ContextKeyExpr.equals(EDIT_SESSIONS_SIGNED_IN_KEY, false),
					}]
				});
			}

			async run() {
				return await that.initialize(false);
			}
		}));
	}

	private registerResetAuthenticationAction() {
		const that = this;
		this._register(registerAction2(class ResetEditSessionAuthenticationAction extends Action2 {
			constructor() {
				super({
					id: 'workbench.editSessions.actions.resetAuth',
					title: localize('reset auth.v3', 'Turn off Edit Sessions...'),
					category: EDIT_SESSION_SYNC_CATEGORY,
					precondition: ContextKeyExpr.equals(EDIT_SESSIONS_SIGNED_IN_KEY, true),
					menu: [{
						id: MenuId.CommandPalette,
					},
					{
						id: MenuId.AccountsContext,
						group: '2_editSessions',
						when: ContextKeyExpr.equals(EDIT_SESSIONS_SIGNED_IN_KEY, true),
					}]
				});
			}

			async run() {
				const result = await that.dialogService.confirm({
					type: 'info',
					message: localize('sign out of edit sessions clear data prompt.v2', 'Do you want to turn off Edit Sessions?'),
					checkbox: { label: localize('delete all edit sessions.v2', 'Delete all stored data from the cloud.') },
					primaryButton: localize('clear data confirm', 'Yes'),
				});
				if (result.confirmed) {
					if (result.checkboxChecked) {
						that.storeClient?.deleteResource('editSessions', null);
					}
					that.clearAuthenticationPreference();
				}
			}
		}));
	}
}

class EditSessionsStoreClient extends UserDataSyncStoreClient {
	_serviceBrand: any;
}
