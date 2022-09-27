/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IUserDataSyncService, IAuthenticationProvider, isAuthenticationProvider, IUserDataAutoSyncService, IUserDataSyncStoreManagementService, SyncStatus, IUserDataSyncEnablementService, IUserDataSyncResource, IResourcePreview, USER_DATA_SYNC_SCHEME, } from 'vs/platform/userDataSync/common/userDataSync';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { IUserDataSyncWorkbenchService, IUserDataSyncAccount, AccountStatus, CONTEXT_SYNC_ENABLEMENT, CONTEXT_SYNC_STATE, CONTEXT_ACCOUNT_STATE, SHOW_SYNC_LOG_COMMAND_ID, CONTEXT_ENABLE_ACTIVITY_VIEWS, SYNC_VIEW_CONTAINER_ID, SYNC_TITLE, SYNC_CONFLICTS_VIEW_ID, CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW, CONTEXT_HAS_CONFLICTS, IUserDataSyncConflictsView } from 'vs/workbench/services/userDataSync/common/userDataSync';
import { Disposable, DisposableStore } from 'vs/base/common/lifecycle';
import { Emitter, Event } from 'vs/base/common/event';
import { flatten } from 'vs/base/common/arrays';
import { getCurrentAuthenticationSessionInfo } from 'vs/workbench/services/authentication/browser/authenticationService';
import { AuthenticationSession, AuthenticationSessionsChangeEvent, IAuthenticationService } from 'vs/workbench/services/authentication/common/authentication';
import { IUserDataSyncAccountService } from 'vs/platform/userDataSync/common/userDataSyncAccount';
import { IQuickInputService, IQuickPickSeparator } from 'vs/platform/quickinput/common/quickInput';
import { IStorageService, IStorageValueChangeEvent, StorageScope, StorageTarget } from 'vs/platform/storage/common/storage';
import { ILogService } from 'vs/platform/log/common/log';
import { IProductService } from 'vs/platform/product/common/productService';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService';
import { localize } from 'vs/nls';
import { INotificationService, Severity } from 'vs/platform/notification/common/notification';
import { IDialogService } from 'vs/platform/dialogs/common/dialogs';
import { IContextKey, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { Action } from 'vs/base/common/actions';
import { IProgressService, ProgressLocation } from 'vs/platform/progress/common/progress';
import { URI } from 'vs/base/common/uri';
import { IViewsService, IViewDescriptorService } from 'vs/workbench/common/views';
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle';
import { isWeb } from 'vs/base/common/platform';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { UserDataSyncStoreClient } from 'vs/platform/userDataSync/common/userDataSyncStoreService';
import { UserDataSyncStoreTypeSynchronizer } from 'vs/platform/userDataSync/common/globalStateSync';
import { ICredentialsService } from 'vs/platform/credentials/common/credentials';
import { CancellationError } from 'vs/base/common/errors';
import { raceCancellationError } from 'vs/base/common/async';
import { CancellationToken, CancellationTokenSource } from 'vs/base/common/cancellation';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity';
import { isDiffEditorInput } from 'vs/workbench/common/editor';

type AccountQuickPickItem = { label: string; authenticationProvider: IAuthenticationProvider; account?: UserDataSyncAccount; description?: string };

class UserDataSyncAccount implements IUserDataSyncAccount {

	constructor(readonly authenticationProviderId: string, private readonly session: AuthenticationSession) { }

	get sessionId(): string { return this.session.id; }
	get accountName(): string { return this.session.account.label; }
	get accountId(): string { return this.session.account.id; }
	get token(): string { return this.session.idToken || this.session.accessToken; }
}

type MergeEditorInput = { base: URI; input1: { uri: URI }; input2: { uri: URI }; result: URI };
export function isMergeEditorInput(editor: unknown): editor is MergeEditorInput {
	const candidate = editor as MergeEditorInput;
	return URI.isUri(candidate?.base) && URI.isUri(candidate?.input1?.uri) && URI.isUri(candidate?.input2?.uri) && URI.isUri(candidate?.result);
}

export class UserDataSyncWorkbenchService extends Disposable implements IUserDataSyncWorkbenchService {

	_serviceBrand: any;

	private static DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY = 'userDataSyncAccount.donotUseWorkbenchSession';
	private static CACHED_SESSION_STORAGE_KEY = 'userDataSyncAccountPreference';

	get enabled() { return !!this.userDataSyncStoreManagementService.userDataSyncStore; }

	private _authenticationProviders: IAuthenticationProvider[] = [];
	get authenticationProviders() { return this._authenticationProviders; }

	private _accountStatus: AccountStatus = AccountStatus.Uninitialized;
	get accountStatus(): AccountStatus { return this._accountStatus; }
	private readonly _onDidChangeAccountStatus = this._register(new Emitter<AccountStatus>());
	readonly onDidChangeAccountStatus = this._onDidChangeAccountStatus.event;

	private _all: Map<string, UserDataSyncAccount[]> = new Map<string, UserDataSyncAccount[]>();
	get all(): UserDataSyncAccount[] { return flatten([...this._all.values()]); }

	get current(): UserDataSyncAccount | undefined { return this.all.filter(account => this.isCurrentAccount(account))[0]; }

	private readonly syncEnablementContext: IContextKey<boolean>;
	private readonly syncStatusContext: IContextKey<string>;
	private readonly accountStatusContext: IContextKey<string>;
	private readonly enableConflictsViewContext: IContextKey<boolean>;
	private readonly hasConflicts: IContextKey<boolean>;
	private readonly activityViewsEnablementContext: IContextKey<boolean>;

	private turnOnSyncCancellationToken: CancellationTokenSource | undefined = undefined;

	constructor(
		@IUserDataSyncService private readonly userDataSyncService: IUserDataSyncService,
		@IUriIdentityService private readonly uriIdentityService: IUriIdentityService,
		@IAuthenticationService private readonly authenticationService: IAuthenticationService,
		@IUserDataSyncAccountService private readonly userDataSyncAccountService: IUserDataSyncAccountService,
		@IQuickInputService private readonly quickInputService: IQuickInputService,
		@IStorageService private readonly storageService: IStorageService,
		@IUserDataSyncEnablementService private readonly userDataSyncEnablementService: IUserDataSyncEnablementService,
		@IUserDataAutoSyncService private readonly userDataAutoSyncService: IUserDataAutoSyncService,
		@ITelemetryService private readonly telemetryService: ITelemetryService,
		@ILogService private readonly logService: ILogService,
		@IProductService private readonly productService: IProductService,
		@IExtensionService private readonly extensionService: IExtensionService,
		@IWorkbenchEnvironmentService private readonly environmentService: IWorkbenchEnvironmentService,
		@ICredentialsService private readonly credentialsService: ICredentialsService,
		@INotificationService private readonly notificationService: INotificationService,
		@IProgressService private readonly progressService: IProgressService,
		@IDialogService private readonly dialogService: IDialogService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewsService private readonly viewsService: IViewsService,
		@IViewDescriptorService private readonly viewDescriptorService: IViewDescriptorService,
		@IUserDataSyncStoreManagementService private readonly userDataSyncStoreManagementService: IUserDataSyncStoreManagementService,
		@ILifecycleService private readonly lifecycleService: ILifecycleService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IEditorService private readonly editorService: IEditorService,
	) {
		super();
		this.syncEnablementContext = CONTEXT_SYNC_ENABLEMENT.bindTo(contextKeyService);
		this.syncStatusContext = CONTEXT_SYNC_STATE.bindTo(contextKeyService);
		this.accountStatusContext = CONTEXT_ACCOUNT_STATE.bindTo(contextKeyService);
		this.activityViewsEnablementContext = CONTEXT_ENABLE_ACTIVITY_VIEWS.bindTo(contextKeyService);
		this.hasConflicts = CONTEXT_HAS_CONFLICTS.bindTo(contextKeyService);
		this.enableConflictsViewContext = CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW.bindTo(contextKeyService);

		if (this.userDataSyncStoreManagementService.userDataSyncStore) {
			this.syncStatusContext.set(this.userDataSyncService.status);
			this._register(userDataSyncService.onDidChangeStatus(status => this.syncStatusContext.set(status)));
			this.syncEnablementContext.set(userDataSyncEnablementService.isEnabled());
			this._register(userDataSyncEnablementService.onDidChangeEnablement(enabled => this.syncEnablementContext.set(enabled)));

			this.waitAndInitialize();
		}
	}

	private updateAuthenticationProviders(): void {
		this._authenticationProviders = (this.userDataSyncStoreManagementService.userDataSyncStore?.authenticationProviders || []).filter(({ id }) => this.authenticationService.declaredProviders.some(provider => provider.id === id));
	}

	private isSupportedAuthenticationProviderId(authenticationProviderId: string): boolean {
		return this.authenticationProviders.some(({ id }) => id === authenticationProviderId);
	}

	private async waitAndInitialize(): Promise<void> {
		/* wait */
		await this.extensionService.whenInstalledExtensionsRegistered();

		/* initialize */
		try {
			this.logService.trace('Settings Sync: Initializing accounts');
			await this.initialize();
		} catch (error) {
			// Do not log if the current window is running extension tests
			if (!this.environmentService.extensionTestsLocationURI) {
				this.logService.error(error);
			}
		}

		if (this.accountStatus === AccountStatus.Uninitialized) {
			// Do not log if the current window is running extension tests
			if (!this.environmentService.extensionTestsLocationURI) {
				this.logService.warn('Settings Sync: Accounts are not initialized');
			}
		} else {
			this.logService.trace('Settings Sync: Accounts are initialized');
		}
	}

	private async initialize(): Promise<void> {
		const authenticationSession = await getCurrentAuthenticationSessionInfo(this.credentialsService, this.productService);
		if (this.currentSessionId === undefined && this.useWorkbenchSessionId && (authenticationSession?.id)) {
			this.currentSessionId = authenticationSession?.id;
			this.useWorkbenchSessionId = false;
		}

		await this.update();

		this._register(this.authenticationService.onDidChangeDeclaredProviders(() => this.updateAuthenticationProviders()));

		this._register(
			Event.any(
				Event.filter(
					Event.any(
						this.authenticationService.onDidRegisterAuthenticationProvider,
						this.authenticationService.onDidUnregisterAuthenticationProvider,
					), info => this.isSupportedAuthenticationProviderId(info.id)),
				Event.filter(this.userDataSyncAccountService.onTokenFailed, isSuccessive => !isSuccessive))
				(() => this.update()));

		this._register(Event.filter(this.authenticationService.onDidChangeSessions, e => this.isSupportedAuthenticationProviderId(e.providerId))(({ event }) => this.onDidChangeSessions(event)));
		this._register(this.storageService.onDidChangeValue(e => this.onDidChangeStorage(e)));
		this._register(Event.filter(this.userDataSyncAccountService.onTokenFailed, isSuccessive => isSuccessive)(() => this.onDidSuccessiveAuthFailures()));
		this.hasConflicts.set(this.userDataSyncService.conflicts.length > 0);
		this._register(this.userDataSyncService.onDidChangeConflicts(conflicts => {
			this.hasConflicts.set(conflicts.length > 0);
			if (!conflicts.length) {
				this.enableConflictsViewContext.reset();
			}
			// Close merge editors with no conflicts
			this.editorService.editors.filter(input => {
				const remoteResource = isDiffEditorInput(input) ? input.original.resource : isMergeEditorInput(input) ? input.input1.uri : undefined;
				if (remoteResource?.scheme !== USER_DATA_SYNC_SCHEME) {
					return false;
				}
				return !this.userDataSyncService.conflicts.some(({ conflicts }) => conflicts.some(({ previewResource }) => this.uriIdentityService.extUri.isEqual(previewResource, input.resource)));
			}).forEach(input => input.dispose());
		}));
	}

	private async update(): Promise<void> {

		this.updateAuthenticationProviders();

		const allAccounts: Map<string, UserDataSyncAccount[]> = new Map<string, UserDataSyncAccount[]>();
		for (const { id, scopes } of this.authenticationProviders) {
			this.logService.trace('Settings Sync: Getting accounts for', id);
			const accounts = await this.getAccounts(id, scopes);
			allAccounts.set(id, accounts);
			this.logService.trace('Settings Sync: Updated accounts for', id);
		}

		this._all = allAccounts;
		const current = this.current;
		await this.updateToken(current);
		this.updateAccountStatus(current ? AccountStatus.Available : AccountStatus.Unavailable);
	}

	private async getAccounts(authenticationProviderId: string, scopes: string[]): Promise<UserDataSyncAccount[]> {
		const accounts: Map<string, UserDataSyncAccount> = new Map<string, UserDataSyncAccount>();
		let currentAccount: UserDataSyncAccount | null = null;

		const sessions = await this.authenticationService.getSessions(authenticationProviderId, scopes) || [];
		for (const session of sessions) {
			const account: UserDataSyncAccount = new UserDataSyncAccount(authenticationProviderId, session);
			accounts.set(account.accountId, account);
			if (this.isCurrentAccount(account)) {
				currentAccount = account;
			}
		}

		if (currentAccount) {
			// Always use current account if available
			accounts.set(currentAccount.accountId, currentAccount);
		}

		return [...accounts.values()];
	}

	private async updateToken(current: UserDataSyncAccount | undefined): Promise<void> {
		let value: { token: string; authenticationProviderId: string } | undefined = undefined;
		if (current) {
			try {
				this.logService.trace('Settings Sync: Updating the token for the account', current.accountName);
				const token = current.token;
				this.logService.trace('Settings Sync: Token updated for the account', current.accountName);
				value = { token, authenticationProviderId: current.authenticationProviderId };
			} catch (e) {
				this.logService.error(e);
			}
		}
		await this.userDataSyncAccountService.updateAccount(value);
	}

	private updateAccountStatus(accountStatus: AccountStatus): void {
		if (this._accountStatus !== accountStatus) {
			const previous = this._accountStatus;
			this.logService.trace(`Settings Sync: Account status changed from ${previous} to ${accountStatus}`);

			this._accountStatus = accountStatus;
			this.accountStatusContext.set(accountStatus);
			this._onDidChangeAccountStatus.fire(accountStatus);
		}
	}

	async turnOn(): Promise<void> {
		if (!this.authenticationProviders.length) {
			throw new Error(localize('no authentication providers', "Settings sync cannot be turned on because there are no authentication providers available."));
		}
		if (this.userDataSyncEnablementService.isEnabled()) {
			return;
		}
		if (this.userDataSyncService.status !== SyncStatus.Idle) {
			throw new Error('Cannot turn on sync while syncing');
		}

		const picked = await this.pick();
		if (!picked) {
			throw new CancellationError();
		}

		// User did not pick an account or login failed
		if (this.accountStatus !== AccountStatus.Available) {
			throw new Error(localize('no account', "No account available"));
		}

		await this.turnOnUsingCurrentAccount();
	}

	async turnOnUsingCurrentAccount(): Promise<void> {
		if (this.userDataSyncEnablementService.isEnabled()) {
			return;
		}

		if (this.userDataSyncService.status !== SyncStatus.Idle) {
			throw new Error('Cannot turn on sync while syncing');
		}

		if (this.accountStatus !== AccountStatus.Available) {
			throw new Error(localize('no account', "No account available"));
		}

		const turnOnSyncCancellationToken = this.turnOnSyncCancellationToken = new CancellationTokenSource();
		const disposable = isWeb ? Disposable.None : this.lifecycleService.onBeforeShutdown(e => e.veto((async () => {
			const result = await this.dialogService.confirm({
				type: 'warning',
				message: localize('sync in progress', "Settings Sync is being turned on. Would you like to cancel it?"),
				title: localize('settings sync', "Settings Sync"),
				primaryButton: localize({ key: 'yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
				secondaryButton: localize({ key: 'no', comment: ['&& denotes a mnemonic'] }, "&&No"),
			});
			if (result.confirmed) {
				turnOnSyncCancellationToken.cancel();
			}
			return !result.confirmed;
		})(), 'veto.settingsSync'));
		try {
			await this.doTurnOnSync(turnOnSyncCancellationToken.token);
		} finally {
			disposable.dispose();
			this.turnOnSyncCancellationToken = undefined;
		}
		await this.userDataAutoSyncService.turnOn();

		if (this.userDataSyncStoreManagementService.userDataSyncStore?.canSwitch) {
			await this.synchroniseUserDataSyncStoreType();
		}

		this.notificationService.info(localize('sync turned on', "{0} is turned on", `${SYNC_TITLE} [(${localize('show log', "show log")})](command:${SHOW_SYNC_LOG_COMMAND_ID})`));
	}

	async turnoff(everywhere: boolean): Promise<void> {
		if (this.userDataSyncEnablementService.isEnabled()) {
			return this.userDataAutoSyncService.turnOff(everywhere);
		}
		if (this.turnOnSyncCancellationToken) {
			return this.turnOnSyncCancellationToken.cancel();
		}
	}

	async synchroniseUserDataSyncStoreType(): Promise<void> {
		if (!this.userDataSyncAccountService.account) {
			throw new Error('Cannot update because you are signed out from settings sync. Please sign in and try again.');
		}
		if (!isWeb || !this.userDataSyncStoreManagementService.userDataSyncStore) {
			// Not supported
			return;
		}

		const userDataSyncStoreUrl = this.userDataSyncStoreManagementService.userDataSyncStore.type === 'insiders' ? this.userDataSyncStoreManagementService.userDataSyncStore.stableUrl : this.userDataSyncStoreManagementService.userDataSyncStore.insidersUrl;
		const userDataSyncStoreClient = this.instantiationService.createInstance(UserDataSyncStoreClient, userDataSyncStoreUrl);
		userDataSyncStoreClient.setAuthToken(this.userDataSyncAccountService.account.token, this.userDataSyncAccountService.account.authenticationProviderId);
		await this.instantiationService.createInstance(UserDataSyncStoreTypeSynchronizer, userDataSyncStoreClient).sync(this.userDataSyncStoreManagementService.userDataSyncStore.type);
	}

	syncNow(): Promise<void> {
		return this.userDataAutoSyncService.triggerSync(['Sync Now'], false, true);
	}

	private async doTurnOnSync(token: CancellationToken): Promise<void> {
		const disposables = new DisposableStore();
		const manualSyncTask = disposables.add(await this.userDataSyncService.createManualSyncTask());
		try {
			await this.progressService.withProgress({
				location: ProgressLocation.Window,
				title: SYNC_TITLE,
				command: SHOW_SYNC_LOG_COMMAND_ID,
				delay: 500,
			}, async progress => {
				progress.report({ message: localize('turning on', "Turning on...") });
				disposables.add(this.userDataSyncService.onDidChangeStatus(status => {
					if (status === SyncStatus.HasConflicts) {
						progress.report({ message: localize('resolving conflicts', "Resolving conflicts...") });
					} else {
						progress.report({ message: localize('syncing...', "Turnin on...") });
					}
				}));
				await manualSyncTask.merge();
				if (this.userDataSyncService.status === SyncStatus.HasConflicts) {
					await this.handleConflictsWhileTurningOn(token);
				}
				await manualSyncTask.apply();
			});
		} catch (error) {
			await manualSyncTask.stop();
			throw error;
		} finally {
			disposables.dispose();
		}
	}

	private async handleConflictsWhileTurningOn(token: CancellationToken): Promise<void> {
		const result = await this.dialogService.show(
			Severity.Warning,
			localize('conflicts detected', "Conflicts Detected"),
			[
				localize('show conflicts', "Show Conflicts"),
				localize('replace local', "Replace Local"),
				localize('replace remote', "Replace Remote"),
				localize('cancel', "Cancel"),
			],
			{
				detail: localize('resolve', "Please resolve conflicts to turn on..."),
				cancelId: 3
			}
		);
		if (result.choice === 0) {
			const waitUntilConflictsAreResolvedPromise = raceCancellationError(Event.toPromise(Event.filter(this.userDataSyncService.onDidChangeConflicts, conficts => conficts.length === 0)), token);
			await this.showConflicts(this.userDataSyncService.conflicts[0]?.conflicts[0]);
			await waitUntilConflictsAreResolvedPromise;
		} else if (result.choice === 1 || result.choice === 2) {
			for (const conflict of this.userDataSyncService.conflicts) {
				for (const preview of conflict.conflicts) {
					await this.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, result.choice === 1 ? preview.remoteResource : preview.localResource, undefined, { force: true });
				}
			}
		} else {
			throw new CancellationError();
		}
	}

	async accept(resource: IUserDataSyncResource, conflictResource: URI, content: string | null | undefined, apply: boolean | { force: boolean }): Promise<void> {
		return this.userDataSyncService.accept(resource, conflictResource, content, apply);
	}

	async showConflicts(conflictToOpen?: IResourcePreview): Promise<void> {
		if (!this.userDataSyncService.conflicts.length) {
			return;
		}
		this.enableConflictsViewContext.set(true);
		const view = await this.viewsService.openView<IUserDataSyncConflictsView>(SYNC_CONFLICTS_VIEW_ID);
		if (view && conflictToOpen) {
			await view.open(conflictToOpen);
		}
	}

	async resetSyncedData(): Promise<void> {
		const result = await this.dialogService.confirm({
			message: localize('reset', "This will clear your data in the cloud and stop sync on all your devices."),
			title: localize('reset title', "Clear"),
			type: 'info',
			primaryButton: localize({ key: 'resetButton', comment: ['&& denotes a mnemonic'] }, "&&Reset"),
		});
		if (result.confirmed) {
			await this.userDataSyncService.resetRemote();
		}
	}

	async showSyncActivity(): Promise<void> {
		this.activityViewsEnablementContext.set(true);
		await this.waitForActiveSyncViews();
		await this.viewsService.openViewContainer(SYNC_VIEW_CONTAINER_ID);
	}

	private async waitForActiveSyncViews(): Promise<void> {
		const viewContainer = this.viewDescriptorService.getViewContainerById(SYNC_VIEW_CONTAINER_ID);
		if (viewContainer) {
			const model = this.viewDescriptorService.getViewContainerModel(viewContainer);
			if (!model.activeViewDescriptors.length) {
				await Event.toPromise(Event.filter(model.onDidChangeActiveViewDescriptors, e => model.activeViewDescriptors.length > 0));
			}
		}
	}

	private isCurrentAccount(account: UserDataSyncAccount): boolean {
		return account.sessionId === this.currentSessionId;
	}

	async signIn(): Promise<void> {
		await this.pick();
	}

	private async pick(): Promise<boolean> {
		const result = await this.doPick();
		if (!result) {
			return false;
		}
		let sessionId: string, accountName: string, accountId: string, authenticationProviderId: string;
		if (isAuthenticationProvider(result)) {
			const session = await this.authenticationService.createSession(result.id, result.scopes);
			sessionId = session.id;
			accountName = session.account.label;
			accountId = session.account.id;
			authenticationProviderId = result.id;
		} else {
			sessionId = result.sessionId;
			accountName = result.accountName;
			accountId = result.accountId;
			authenticationProviderId = result.authenticationProviderId;
		}
		await this.switch(sessionId, accountName, accountId, authenticationProviderId);
		return true;
	}

	private async doPick(): Promise<UserDataSyncAccount | IAuthenticationProvider | undefined> {
		if (this.authenticationProviders.length === 0) {
			return undefined;
		}

		await this.update();

		// Single auth provider and no accounts available
		if (this.authenticationProviders.length === 1 && !this.all.length) {
			return this.authenticationProviders[0];
		}

		return new Promise<UserDataSyncAccount | IAuthenticationProvider | undefined>(c => {
			let result: UserDataSyncAccount | IAuthenticationProvider | undefined;
			const disposables: DisposableStore = new DisposableStore();
			const quickPick = this.quickInputService.createQuickPick<AccountQuickPickItem>();
			disposables.add(quickPick);

			quickPick.title = SYNC_TITLE;
			quickPick.ok = false;
			quickPick.placeholder = localize('choose account placeholder', "Select an account to sign in");
			quickPick.ignoreFocusOut = true;
			quickPick.items = this.createQuickpickItems();

			disposables.add(quickPick.onDidAccept(() => {
				result = quickPick.selectedItems[0]?.account ? quickPick.selectedItems[0]?.account : quickPick.selectedItems[0]?.authenticationProvider;
				quickPick.hide();
			}));
			disposables.add(quickPick.onDidHide(() => {
				disposables.dispose();
				c(result);
			}));
			quickPick.show();
		});
	}

	private createQuickpickItems(): (AccountQuickPickItem | IQuickPickSeparator)[] {
		const quickPickItems: (AccountQuickPickItem | IQuickPickSeparator)[] = [];

		// Signed in Accounts
		if (this.all.length) {
			const authenticationProviders = [...this.authenticationProviders].sort(({ id }) => id === this.current?.authenticationProviderId ? -1 : 1);
			quickPickItems.push({ type: 'separator', label: localize('signed in', "Signed in") });
			for (const authenticationProvider of authenticationProviders) {
				const accounts = (this._all.get(authenticationProvider.id) || []).sort(({ sessionId }) => sessionId === this.current?.sessionId ? -1 : 1);
				const providerName = this.authenticationService.getLabel(authenticationProvider.id);
				for (const account of accounts) {
					quickPickItems.push({
						label: `${account.accountName} (${providerName})`,
						description: account.sessionId === this.current?.sessionId ? localize('last used', "Last Used with Sync") : undefined,
						account,
						authenticationProvider,
					});
				}
			}
			quickPickItems.push({ type: 'separator', label: localize('others', "Others") });
		}

		// Account proviers
		for (const authenticationProvider of this.authenticationProviders) {
			const signedInForProvider = this.all.some(account => account.authenticationProviderId === authenticationProvider.id);
			if (!signedInForProvider || this.authenticationService.supportsMultipleAccounts(authenticationProvider.id)) {
				const providerName = this.authenticationService.getLabel(authenticationProvider.id);
				quickPickItems.push({ label: localize('sign in using account', "Sign in with {0}", providerName), authenticationProvider });
			}
		}

		return quickPickItems;
	}

	private async switch(sessionId: string, accountName: string, accountId: string, authenticationProviderId: string): Promise<void> {
		const currentAccount = this.current;
		if (this.userDataSyncEnablementService.isEnabled() && (currentAccount && currentAccount.accountName !== accountName)) {
			// accounts are switched while sync is enabled.
		}
		this.currentSessionId = sessionId;
		await this.update();
	}

	private async onDidSuccessiveAuthFailures(): Promise<void> {
		this.telemetryService.publicLog2<{}, { owner: 'sandy081'; comment: 'Report when there are successive auth failures during settings sync' }>('sync/successiveAuthFailures');
		this.currentSessionId = undefined;
		await this.update();

		if (this.userDataSyncEnablementService.isEnabled()) {
			this.notificationService.notify({
				severity: Severity.Error,
				message: localize('successive auth failures', "Settings sync is suspended because of successive authorization failures. Please sign in again to continue synchronizing"),
				actions: {
					primary: [new Action('sign in', localize('sign in', "Sign in"), undefined, true, () => this.signIn())]
				}
			});
		}
	}

	private onDidChangeSessions(e: AuthenticationSessionsChangeEvent): void {
		if (this.currentSessionId && e.removed.find(session => session.id === this.currentSessionId)) {
			this.currentSessionId = undefined;
		}
		this.update();
	}

	private onDidChangeStorage(e: IStorageValueChangeEvent): void {
		if (e.key === UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY && e.scope === StorageScope.APPLICATION
			&& this.currentSessionId !== this.getStoredCachedSessionId() /* This checks if current window changed the value or not */) {
			this._cachedCurrentSessionId = null;
			this.update();
		}
	}

	private _cachedCurrentSessionId: string | undefined | null = null;
	private get currentSessionId(): string | undefined {
		if (this._cachedCurrentSessionId === null) {
			this._cachedCurrentSessionId = this.getStoredCachedSessionId();
		}
		return this._cachedCurrentSessionId;
	}

	private set currentSessionId(cachedSessionId: string | undefined) {
		if (this._cachedCurrentSessionId !== cachedSessionId) {
			this._cachedCurrentSessionId = cachedSessionId;
			if (cachedSessionId === undefined) {
				this.logService.info('Settings Sync: Reset current session');
				this.storageService.remove(UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY, StorageScope.APPLICATION);
			} else {
				this.logService.info('Settings Sync: Updated current session', cachedSessionId);
				this.storageService.store(UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY, cachedSessionId, StorageScope.APPLICATION, StorageTarget.MACHINE);
			}
		}
	}

	private getStoredCachedSessionId(): string | undefined {
		return this.storageService.get(UserDataSyncWorkbenchService.CACHED_SESSION_STORAGE_KEY, StorageScope.APPLICATION);
	}

	private get useWorkbenchSessionId(): boolean {
		return !this.storageService.getBoolean(UserDataSyncWorkbenchService.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, StorageScope.APPLICATION, false);
	}

	private set useWorkbenchSessionId(useWorkbenchSession: boolean) {
		this.storageService.store(UserDataSyncWorkbenchService.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, !useWorkbenchSession, StorageScope.APPLICATION, StorageTarget.MACHINE);
	}

}

registerSingleton(IUserDataSyncWorkbenchService, UserDataSyncWorkbenchService, InstantiationType.Eager /* Eager because it initializes settings sync accounts */);
