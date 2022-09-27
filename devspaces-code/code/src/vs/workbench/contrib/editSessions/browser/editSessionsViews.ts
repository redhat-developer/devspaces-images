/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/base/common/lifecycle';
import { localize } from 'vs/nls';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { IInstantiationService, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { Registry } from 'vs/platform/registry/common/platform';
import { TreeView, TreeViewPane } from 'vs/workbench/browser/parts/views/treeView';
import { Extensions, ITreeItem, ITreeViewDataProvider, ITreeViewDescriptor, IViewsRegistry, TreeItemCollapsibleState, TreeViewItemHandleArg, ViewContainer } from 'vs/workbench/common/views';
import { EDIT_SESSIONS_DATA_VIEW_ID, EDIT_SESSIONS_SCHEME, EDIT_SESSIONS_SHOW_VIEW, EDIT_SESSIONS_SIGNED_IN, EDIT_SESSIONS_SIGNED_IN_KEY, EDIT_SESSIONS_TITLE, IEditSessionsStorageService } from 'vs/workbench/contrib/editSessions/common/editSessions';
import { URI } from 'vs/base/common/uri';
import { fromNow } from 'vs/base/common/date';
import { Codicon } from 'vs/base/common/codicons';
import { API_OPEN_EDITOR_COMMAND_ID } from 'vs/workbench/browser/parts/editor/editorCommands';
import { registerAction2, Action2, MenuId } from 'vs/platform/actions/common/actions';
import { ContextKeyExpr, IContextKeyService, RawContextKey } from 'vs/platform/contextkey/common/contextkey';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IDialogService } from 'vs/platform/dialogs/common/dialogs';

const EDIT_SESSIONS_COUNT_KEY = 'editSessionsCount';
const EDIT_SESSIONS_COUNT_CONTEXT_KEY = new RawContextKey<number>(EDIT_SESSIONS_COUNT_KEY, 0);

export class EditSessionsDataViews extends Disposable {
	constructor(
		container: ViewContainer,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();
		this.registerViews(container);
	}

	private registerViews(container: ViewContainer): void {
		const viewId = EDIT_SESSIONS_DATA_VIEW_ID;
		const name = EDIT_SESSIONS_TITLE;
		const treeView = this.instantiationService.createInstance(TreeView, viewId, name);
		treeView.showCollapseAllAction = true;
		treeView.showRefreshAction = true;
		const disposable = treeView.onDidChangeVisibility(visible => {
			if (visible && !treeView.dataProvider) {
				disposable.dispose();
				treeView.dataProvider = this.instantiationService.createInstance(EditSessionDataViewDataProvider);
			}
		});

		const viewsRegistry = Registry.as<IViewsRegistry>(Extensions.ViewsRegistry);
		viewsRegistry.registerViews([<ITreeViewDescriptor>{
			id: viewId,
			name,
			ctorDescriptor: new SyncDescriptor(TreeViewPane),
			canToggleVisibility: true,
			canMoveView: false,
			treeView,
			collapsed: false,
			when: ContextKeyExpr.and(EDIT_SESSIONS_SIGNED_IN, EDIT_SESSIONS_SHOW_VIEW),
			order: 100,
			hideByDefault: true,
		}], container);

		viewsRegistry.registerViewWelcomeContent(viewId, {
			content: localize(
				'noEditSessions',
				'You have no stored edit sessions to display.\n{0}',
				localize(
					{ key: 'storeEditSessionCommand', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] },
					'[{0}](command:workbench.editSessions.actions.store)',
					localize('storeEditSessionTitle', 'Store Edit Session')
				)
			),
			when: ContextKeyExpr.and(ContextKeyExpr.equals(EDIT_SESSIONS_SIGNED_IN_KEY, true), ContextKeyExpr.equals(EDIT_SESSIONS_COUNT_KEY, 0)),
			order: 1
		});

		registerAction2(class extends Action2 {
			constructor() {
				super({
					id: 'workbench.editSessions.actions.resume',
					title: localize('workbench.editSessions.actions.resume', "Resume Edit Session"),
					icon: Codicon.desktopDownload,
					menu: {
						id: MenuId.ViewItemContext,
						when: ContextKeyExpr.and(ContextKeyExpr.equals('view', viewId), ContextKeyExpr.regex('viewItem', /edit-session/i)),
						group: 'inline'
					}
				});
			}

			async run(accessor: ServicesAccessor, handle: TreeViewItemHandleArg): Promise<void> {
				const editSessionId = URI.parse(handle.$treeItemHandle).path.substring(1);
				const commandService = accessor.get(ICommandService);
				await commandService.executeCommand('workbench.experimental.editSessions.actions.resumeLatest', editSessionId);
				await treeView.refresh();
			}
		});

		registerAction2(class extends Action2 {
			constructor() {
				super({
					id: 'workbench.editSessions.actions.store',
					title: localize('workbench.editSessions.actions.store', "Store Edit Session"),
					icon: Codicon.cloudUpload,
				});
			}

			async run(accessor: ServicesAccessor, handle: TreeViewItemHandleArg): Promise<void> {
				const commandService = accessor.get(ICommandService);
				await commandService.executeCommand('workbench.experimental.editSessions.actions.storeCurrent');
				await treeView.refresh();
			}
		});

		registerAction2(class extends Action2 {
			constructor() {
				super({
					id: 'workbench.editSessions.actions.delete',
					title: localize('workbench.editSessions.actions.delete', "Delete Edit Session"),
					icon: Codicon.trash,
					menu: {
						id: MenuId.ViewItemContext,
						when: ContextKeyExpr.and(ContextKeyExpr.equals('view', viewId), ContextKeyExpr.regex('viewItem', /edit-session/i)),
						group: 'inline'
					}
				});
			}

			async run(accessor: ServicesAccessor, handle: TreeViewItemHandleArg): Promise<void> {
				const editSessionId = URI.parse(handle.$treeItemHandle).path.substring(1);
				const dialogService = accessor.get(IDialogService);
				const editSessionStorageService = accessor.get(IEditSessionsStorageService);
				const result = await dialogService.confirm({
					message: localize('confirm delete', 'Are you sure you want to permanently delete the edit session with ref {0}? You cannot undo this action.', editSessionId),
					type: 'warning',
					title: EDIT_SESSIONS_TITLE
				});
				if (result.confirmed) {
					await editSessionStorageService.delete(editSessionId);
					await treeView.refresh();
				}
			}
		});

		registerAction2(class extends Action2 {
			constructor() {
				super({
					id: 'workbench.editSessions.actions.deleteAll',
					title: localize('workbench.editSessions.actions.deleteAll', "Delete All Edit Sessions"),
					icon: Codicon.trash,
					menu: {
						id: MenuId.ViewTitle,
						when: ContextKeyExpr.and(ContextKeyExpr.equals('view', viewId), ContextKeyExpr.greater(EDIT_SESSIONS_COUNT_KEY, 0)),
					}
				});
			}

			async run(accessor: ServicesAccessor): Promise<void> {
				const dialogService = accessor.get(IDialogService);
				const editSessionStorageService = accessor.get(IEditSessionsStorageService);
				const result = await dialogService.confirm({
					message: localize('confirm delete all', 'Are you sure you want to permanently delete all edit sessions? You cannot undo this action.'),
					type: 'warning',
					title: EDIT_SESSIONS_TITLE
				});
				if (result.confirmed) {
					await editSessionStorageService.delete(null);
					await treeView.refresh();
				}
			}
		});
	}
}

class EditSessionDataViewDataProvider implements ITreeViewDataProvider {

	private editSessionsCount;

	constructor(
		@IEditSessionsStorageService private readonly editSessionsStorageService: IEditSessionsStorageService,
		@IContextKeyService private readonly contextKeyService: IContextKeyService
	) {
		this.editSessionsCount = EDIT_SESSIONS_COUNT_CONTEXT_KEY.bindTo(this.contextKeyService);
	}

	async getChildren(element?: ITreeItem): Promise<ITreeItem[]> {
		if (!element) {
			return this.getAllEditSessions();
		}

		const [ref, folderName, filePath] = URI.parse(element.handle).path.substring(1).split('/');

		if (ref && !folderName) {
			return this.getEditSession(ref);
		} else if (ref && folderName && !filePath) {
			return this.getEditSessionFolderContents(ref, folderName);
		}

		return [];
	}

	private async getAllEditSessions(): Promise<ITreeItem[]> {
		const allEditSessions = await this.editSessionsStorageService.list();
		this.editSessionsCount.set(allEditSessions.length);
		const editSessions = [];

		for (const session of allEditSessions) {
			const resource = URI.from({ scheme: EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${session.ref}` });
			const sessionData = await this.editSessionsStorageService.read(session.ref);
			const label = sessionData?.editSession.folders.map((folder) => folder.name).join(', ') ?? session.ref;
			const machineId = sessionData?.editSession.machine;
			const description = machineId === undefined ? fromNow(session.created, true) : `${fromNow(session.created, true)}\u00a0\u00a0\u2022\u00a0\u00a0${await this.editSessionsStorageService.getMachineById(machineId)}`;

			editSessions.push({
				handle: resource.toString(),
				collapsibleState: TreeItemCollapsibleState.Collapsed,
				label: { label },
				description: description,
				themeIcon: Codicon.repo,
				contextValue: `edit-session`
			});
		}

		return editSessions;
	}

	private async getEditSession(ref: string): Promise<ITreeItem[]> {
		const data = await this.editSessionsStorageService.read(ref);

		if (!data) {
			return [];
		}

		if (data.editSession.folders.length === 1) {
			const folder = data.editSession.folders[0];
			return this.getEditSessionFolderContents(ref, folder.name);
		}

		return data.editSession.folders.map((folder) => {
			const resource = URI.from({ scheme: EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${data.ref}/${folder.name}` });
			return {
				handle: resource.toString(),
				collapsibleState: TreeItemCollapsibleState.Collapsed,
				label: { label: folder.name },
				themeIcon: Codicon.folder
			};
		});
	}

	private async getEditSessionFolderContents(ref: string, folderName: string): Promise<ITreeItem[]> {
		const data = await this.editSessionsStorageService.read(ref);

		if (!data) {
			return [];
		}

		return (data.editSession.folders.find((folder) => folder.name === folderName)?.workingChanges ?? []).map((change) => {
			const resource = URI.from({ scheme: EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${data.ref}/${folderName}/${change.relativeFilePath}` });
			return {
				handle: resource.toString(),
				resourceUri: resource,
				collapsibleState: TreeItemCollapsibleState.None,
				label: { label: change.relativeFilePath },
				themeIcon: Codicon.file,
				command: {
					id: API_OPEN_EDITOR_COMMAND_ID,
					title: localize('open file', 'Open File'),
					arguments: [resource, undefined, undefined]
				}
			};
		});
	}
}
