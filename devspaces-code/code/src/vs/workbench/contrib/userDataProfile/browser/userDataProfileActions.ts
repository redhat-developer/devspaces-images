/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { Action2, IMenuService, registerAction2 } from 'vs/platform/actions/common/actions';
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { QuickPickItem, IQuickInputService, IQuickPickItem } from 'vs/platform/quickinput/common/quickInput';
import { IUserDataProfileManagementService, PROFILES_CATEGORY, ManageProfilesSubMenu, IUserDataProfileService, PROFILES_ENABLEMENT_CONTEXT, HAS_PROFILES_CONTEXT, MANAGE_PROFILES_ACTION_ID } from 'vs/workbench/services/userDataProfile/common/userDataProfile';
import { IUserDataProfile, IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile';
import { Categories } from 'vs/platform/action/common/actionCommonCategories';
import { ContextKeyExpr, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { compare } from 'vs/base/common/strings';
import { Codicon } from 'vs/base/common/codicons';
import { createAndFillInActionBarActions } from 'vs/platform/actions/browser/menuEntryActionViewItem';
import { IAction, Separator } from 'vs/base/common/actions';

class CreateFromCurrentProfileAction extends Action2 {
	static readonly ID = 'workbench.profiles.actions.createFromCurrentProfile';
	static readonly TITLE = {
		value: localize('save profile as', "Create from Current Profile..."),
		original: 'Create from Current Profile...'
	};
	constructor() {
		super({
			id: CreateFromCurrentProfileAction.ID,
			title: CreateFromCurrentProfileAction.TITLE,
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: PROFILES_ENABLEMENT_CONTEXT
		});
	}

	async run(accessor: ServicesAccessor) {
		const quickInputService = accessor.get(IQuickInputService);
		const notificationService = accessor.get(INotificationService);
		const userDataProfileManagementService = accessor.get(IUserDataProfileManagementService);
		const userDataProfilesService = accessor.get(IUserDataProfilesService);
		const name = await quickInputService.input({
			placeHolder: localize('name', "Profile name"),
			title: localize('save profile as', "Create from Current Profile..."),
			validateInput: async (value: string) => {
				if (userDataProfilesService.profiles.some(p => p.name === value)) {
					return localize('profileExists', "Profile with name {0} already exists.", value);
				}
				return undefined;
			}
		});
		if (name) {
			try {
				await userDataProfileManagementService.createAndEnterProfile(name, undefined, true);
			} catch (error) {
				notificationService.error(error);
			}
		}
	}
}
registerAction2(CreateFromCurrentProfileAction);

class CreateEmptyProfileAction extends Action2 {
	static readonly ID = 'workbench.profiles.actions.createEmptyProfile';
	static readonly TITLE = {
		value: localize('create empty profile', "Create an Empty Profile..."),
		original: 'Create an Empty Profile...'
	};
	constructor() {
		super({
			id: CreateEmptyProfileAction.ID,
			title: CreateEmptyProfileAction.TITLE,
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: PROFILES_ENABLEMENT_CONTEXT
		});
	}

	async run(accessor: ServicesAccessor) {
		const quickInputService = accessor.get(IQuickInputService);
		const userDataProfileManagementService = accessor.get(IUserDataProfileManagementService);
		const notificationService = accessor.get(INotificationService);
		const userDataProfilesService = accessor.get(IUserDataProfilesService);
		const name = await quickInputService.input({
			placeHolder: localize('name', "Profile name"),
			title: localize('create and enter empty profile', "Create an Empty Profile..."),
			validateInput: async (value: string) => {
				if (userDataProfilesService.profiles.some(p => p.name === value)) {
					return localize('profileExists', "Profile with name {0} already exists.", value);
				}
				return undefined;
			}
		});
		if (name) {
			try {
				await userDataProfileManagementService.createAndEnterProfile(name, undefined, undefined);
			} catch (error) {
				notificationService.error(error);
			}
		}
	}
}
registerAction2(CreateEmptyProfileAction);

registerAction2(class CreateProfileAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.profiles.actions.createProfile',
			title: {
				value: localize('create profile', "Create..."),
				original: 'Create...'
			},
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: PROFILES_ENABLEMENT_CONTEXT,
			menu: [
				{
					id: ManageProfilesSubMenu,
					group: '3_manage_profiles',
					when: PROFILES_ENABLEMENT_CONTEXT,
					order: 1
				}
			]
		});
	}

	async run(accessor: ServicesAccessor) {
		const quickInputService = accessor.get(IQuickInputService);
		const commandService = accessor.get(ICommandService);
		const pick = await quickInputService.pick(
			[{
				id: CreateEmptyProfileAction.ID,
				label: CreateEmptyProfileAction.TITLE.value,
			}, {
				type: 'separator',
			}, {
				id: CreateFromCurrentProfileAction.ID,
				label: CreateFromCurrentProfileAction.TITLE.value,
			}, {
				type: 'separator',
			}, {
				id: CreateTransientProfileAction.ID,
				label: CreateTransientProfileAction.TITLE.value,
			}], { hideInput: true, canPickMany: false, title: localize('create profile title', "{0}: Create...", PROFILES_CATEGORY.value) });
		if (pick?.id) {
			return commandService.executeCommand(pick.id);
		}
	}
});

class CreateTransientProfileAction extends Action2 {
	static readonly ID = 'workbench.profiles.actions.createTemporaryProfile';
	static readonly TITLE = {
		value: localize('create temporary profile', "Create a Temporary Profile"),
		original: 'Create a Temporary Profile'
	};
	constructor() {
		super({
			id: CreateTransientProfileAction.ID,
			title: CreateTransientProfileAction.TITLE,
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: PROFILES_ENABLEMENT_CONTEXT,
		});
	}

	async run(accessor: ServicesAccessor) {
		return accessor.get(IUserDataProfileManagementService).createAndEnterTransientProfile();
	}
}

registerAction2(CreateTransientProfileAction);

export class RenameProfileAction extends Action2 {
	static readonly ID = 'workbench.profiles.actions.renameProfile';
	constructor() {
		super({
			id: RenameProfileAction.ID,
			title: {
				value: localize('rename profile', "Rename..."),
				original: 'Rename...'
			},
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: ContextKeyExpr.and(PROFILES_ENABLEMENT_CONTEXT, HAS_PROFILES_CONTEXT),
		});
	}

	async run(accessor: ServicesAccessor, profile?: IUserDataProfile) {
		const quickInputService = accessor.get(IQuickInputService);
		const userDataProfileService = accessor.get(IUserDataProfileService);
		const userDataProfilesService = accessor.get(IUserDataProfilesService);
		const userDataProfileManagementService = accessor.get(IUserDataProfileManagementService);
		const notificationService = accessor.get(INotificationService);

		if (!profile) {
			profile = await this.pickProfile(quickInputService, userDataProfileService, userDataProfilesService);
		}

		if (!profile || profile.isDefault) {
			return;
		}

		const name = await quickInputService.input({
			value: profile.name,
			title: localize('select profile to rename', 'Rename {0}', profile.name),
			validateInput: async (value: string) => {
				if (profile!.name !== value && userDataProfilesService.profiles.some(p => p.name === value)) {
					return localize('profileExists', "Profile with name {0} already exists.", value);
				}
				return undefined;
			}
		});
		if (name && name !== profile.name) {
			try {
				await userDataProfileManagementService.updateProfile(profile, { name });
			} catch (error) {
				notificationService.error(error);
			}
		}
	}

	private async pickProfile(quickInputService: IQuickInputService, userDataProfileService: IUserDataProfileService, userDataProfilesService: IUserDataProfilesService): Promise<IUserDataProfile | undefined> {
		const profiles = userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient);
		if (!profiles.length) {
			return undefined;
		}
		const pick = await quickInputService.pick(
			profiles.map(profile => ({
				label: profile.name,
				description: profile.id === userDataProfileService.currentProfile.id ? localize('current', "Current") : undefined,
				profile
			})),
			{
				title: localize('rename specific profile', "Rename Profile..."),
				placeHolder: localize('pick profile to rename', "Select Profile to Rename"),
			});
		return pick?.profile;
	}
}

registerAction2(RenameProfileAction);

registerAction2(class DeleteProfileAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.profiles.actions.deleteProfile',
			title: {
				value: localize('delete profile', "Delete..."),
				original: 'Delete...'
			},
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: ContextKeyExpr.and(PROFILES_ENABLEMENT_CONTEXT, HAS_PROFILES_CONTEXT),
			menu: [
				{
					id: ManageProfilesSubMenu,
					group: '3_manage_profiles',
					when: PROFILES_ENABLEMENT_CONTEXT,
					order: 2
				}
			]
		});
	}

	async run(accessor: ServicesAccessor) {
		const quickInputService = accessor.get(IQuickInputService);
		const userDataProfileService = accessor.get(IUserDataProfileService);
		const userDataProfilesService = accessor.get(IUserDataProfilesService);
		const userDataProfileManagementService = accessor.get(IUserDataProfileManagementService);
		const notificationService = accessor.get(INotificationService);

		const profiles = userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient);
		if (profiles.length) {
			const picks = await quickInputService.pick(
				profiles.map(profile => ({
					label: profile.name,
					description: profile.id === userDataProfileService.currentProfile.id ? localize('current', "Current") : undefined,
					profile
				})),
				{
					title: localize('delete specific profile', "Delete Profile..."),
					placeHolder: localize('pick profile to delete', "Select Profiles to Delete"),
					canPickMany: true
				});
			if (picks) {
				try {
					await Promise.all(picks.map(pick => userDataProfileManagementService.removeProfile(pick.profile)));
				} catch (error) {
					notificationService.error(error);
				}
			}
		}
	}
});

registerAction2(class ManageProfilesAction extends Action2 {
	constructor() {
		super({
			id: MANAGE_PROFILES_ACTION_ID,
			title: {
				value: localize('mange', "Manage..."),
				original: 'Manage...'
			},
			category: PROFILES_CATEGORY,
			precondition: ContextKeyExpr.and(PROFILES_ENABLEMENT_CONTEXT, HAS_PROFILES_CONTEXT),
		});
	}

	async run(accessor: ServicesAccessor) {
		const quickInputService = accessor.get(IQuickInputService);
		const menuService = accessor.get(IMenuService);
		const contextKeyService = accessor.get(IContextKeyService);
		const commandService = accessor.get(ICommandService);

		const menu = menuService.createMenu(ManageProfilesSubMenu, contextKeyService);
		const actions: IAction[] = [];
		createAndFillInActionBarActions(menu, undefined, actions);
		menu.dispose();

		if (actions.length) {
			const picks: QuickPickItem[] = actions.map(action => {
				if (action instanceof Separator) {
					return { type: 'separator' };
				}
				return {
					id: action.id,
					label: `${action.label}${action.checked ? ` $(${Codicon.check.id})` : ''}`,
				};
			});
			const pick = await quickInputService.pick(picks, { canPickMany: false, title: PROFILES_CATEGORY.value });
			if (pick?.id) {
				await commandService.executeCommand(pick.id);
			}
		}
	}
});

registerAction2(class SwitchProfileAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.profiles.actions.switchProfile',
			title: {
				value: localize('switch profile', "Switch..."),
				original: 'Switch...'
			},
			category: PROFILES_CATEGORY,
			f1: true,
			precondition: ContextKeyExpr.and(PROFILES_ENABLEMENT_CONTEXT, HAS_PROFILES_CONTEXT),
		});
	}

	async run(accessor: ServicesAccessor) {
		const quickInputService = accessor.get(IQuickInputService);
		const userDataProfileService = accessor.get(IUserDataProfileService);
		const userDataProfilesService = accessor.get(IUserDataProfilesService);
		const userDataProfileManagementService = accessor.get(IUserDataProfileManagementService);

		const profiles = userDataProfilesService.profiles.slice(0).sort((a, b) => compare(a.name, b.name));
		if (profiles.length) {
			const picks: Array<IQuickPickItem & { profile: IUserDataProfile }> = profiles.map(profile => ({
				label: `${profile.name}${profile.id === userDataProfileService.currentProfile.id ? ` $(${Codicon.check.id})` : ''}`,
				profile
			}));
			const pick = await quickInputService.pick(picks, { placeHolder: localize('pick profile', "Select Profile") });
			if (pick) {
				await userDataProfileManagementService.switchProfile(pick.profile);
			}
		}
	}
});

// Developer Actions

registerAction2(class CleanupProfilesAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.profiles.actions.cleanupProfiles',
			title: {
				value: localize('cleanup profile', "Cleanup Profiles"),
				original: 'Cleanup Profiles'
			},
			category: Categories.Developer,
			f1: true,
			precondition: PROFILES_ENABLEMENT_CONTEXT,
		});
	}

	async run(accessor: ServicesAccessor) {
		return accessor.get(IUserDataProfilesService).cleanUp();
	}
});

registerAction2(class ResetWorkspacesAction extends Action2 {
	constructor() {
		super({
			id: 'workbench.profiles.actions.resetWorkspaces',
			title: {
				value: localize('reset workspaces', "Reset Workspace Profiles Associations"),
				original: 'Reset Workspace Profiles Associations'
			},
			category: Categories.Developer,
			f1: true,
			precondition: PROFILES_ENABLEMENT_CONTEXT,
		});
	}

	async run(accessor: ServicesAccessor) {
		const userDataProfilesService = accessor.get(IUserDataProfilesService);
		return userDataProfilesService.resetWorkspaces();
	}
});
