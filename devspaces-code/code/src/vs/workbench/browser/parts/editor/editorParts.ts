/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { EditorGroupLayout, GroupDirection, GroupLocation, GroupOrientation, GroupsArrangement, GroupsOrder, IAuxiliaryEditorPart, IEditorDropTargetDelegate, IEditorGroupsService, IEditorSideGroup, IFindGroupScope, IMergeGroupOptions } from 'vs/workbench/services/editor/common/editorGroupsService';
import { Emitter } from 'vs/base/common/event';
import { getActiveDocument } from 'vs/base/browser/dom';
import { Disposable, DisposableStore, IDisposable, toDisposable } from 'vs/base/common/lifecycle';
import { GroupIdentifier } from 'vs/workbench/common/editor';
import { EditorPart, MainEditorPart } from 'vs/workbench/browser/parts/editor/editorPart';
import { IEditorGroupView, IEditorPartsView } from 'vs/workbench/browser/parts/editor/editor';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IAuxiliaryWindowOpenOptions } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService';
import { distinct } from 'vs/base/common/arrays';
import { AuxiliaryEditorPart } from 'vs/workbench/browser/parts/editor/auxiliaryEditorPart';

export class EditorParts extends Disposable implements IEditorGroupsService, IEditorPartsView {

	declare readonly _serviceBrand: undefined;

	readonly mainPart = this._register(this.createMainEditorPart());

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super();

		this._register(this.registerEditorPart(this.mainPart));
	}

	protected createMainEditorPart(): MainEditorPart {
		return this.instantiationService.createInstance(MainEditorPart, this);
	}

	//#region Auxiliary Editor Parts

	private readonly _onDidCreateAuxiliaryEditorPart = this._register(new Emitter<{ readonly part: IAuxiliaryEditorPart; readonly disposables: DisposableStore }>());
	readonly onDidCreateAuxiliaryEditorPart = this._onDidCreateAuxiliaryEditorPart.event;

	async createAuxiliaryEditorPart(options?: IAuxiliaryWindowOpenOptions): Promise<IAuxiliaryEditorPart> {
		const { part, disposables } = await this.instantiationService.createInstance(AuxiliaryEditorPart, this).create(this.getGroupsLabel(this._parts.size), options);

		// Events
		this._onDidAddGroup.fire(part.activeGroup);

		const eventDisposables = disposables.add(new DisposableStore());
		this._onDidCreateAuxiliaryEditorPart.fire({ part, disposables: eventDisposables });

		return part;
	}

	//#endregion

	//#region Registration

	private readonly _parts = new Set<EditorPart>();
	get parts() { return Array.from(this._parts); }

	registerEditorPart(part: EditorPart): IDisposable {
		this._parts.add(part);

		const disposables = this._register(new DisposableStore());
		disposables.add(toDisposable(() => this.unregisterEditorPart(part)));

		this.registerEditorPartListeners(part, disposables);

		return disposables;
	}

	private unregisterEditorPart(part: EditorPart): void {
		this._parts.delete(part);

		// Notify all parts about a groups label change
		// given it is computed based on the index

		this.parts.forEach((part, index) => {
			if (part === this.mainPart) {
				return;
			}

			part.notifyGroupsLabelChange(this.getGroupsLabel(index));
		});
	}

	private registerEditorPartListeners(part: EditorPart, disposables: DisposableStore): void {
		disposables.add(part.onDidFocus(() => {
			if (this._parts.size > 1) {
				this._onDidActiveGroupChange.fire(this.activeGroup); // this can only happen when we have more than 1 editor part
			}
		}));

		disposables.add(part.onDidChangeActiveGroup(group => this._onDidActiveGroupChange.fire(group)));
		disposables.add(part.onDidAddGroup(group => this._onDidAddGroup.fire(group)));
		disposables.add(part.onDidRemoveGroup(group => this._onDidRemoveGroup.fire(group)));
		disposables.add(part.onDidMoveGroup(group => this._onDidMoveGroup.fire(group)));
		disposables.add(part.onDidActivateGroup(group => this._onDidActivateGroup.fire(group)));
		disposables.add(part.onDidChangeGroupMaximized(maximized => this._onDidChangeGroupMaximized.fire(maximized)));

		disposables.add(part.onDidChangeGroupIndex(group => this._onDidChangeGroupIndex.fire(group)));
		disposables.add(part.onDidChangeGroupLocked(group => this._onDidChangeGroupLocked.fire(group)));
	}

	private getGroupsLabel(index: number): string {
		return localize('groupLabel', "Window {0}", index + 1);
	}

	//#endregion

	//#region Helpers

	get activePart(): EditorPart {
		return this.getPartByDocument(getActiveDocument());
	}

	private getPartByDocument(document: Document): EditorPart {
		if (this._parts.size > 1) {
			for (const part of this._parts) {
				if (part.element?.ownerDocument === document) {
					return part;
				}
			}
		}

		return this.mainPart;
	}

	getPart(group: IEditorGroupView | GroupIdentifier): EditorPart;
	getPart(element: HTMLElement): EditorPart;
	getPart(groupOrElement: IEditorGroupView | GroupIdentifier | HTMLElement): EditorPart {
		if (this._parts.size > 1) {
			if (groupOrElement instanceof HTMLElement) {
				const element = groupOrElement;

				return this.getPartByDocument(element.ownerDocument);
			} else {
				const group = groupOrElement;

				let id: GroupIdentifier;
				if (typeof group === 'number') {
					id = group;
				} else {
					id = group.id;
				}

				for (const part of this._parts) {
					if (part.hasGroup(id)) {
						return part;
					}
				}
			}
		}

		return this.mainPart;
	}

	//#endregion

	//#region Events

	private readonly _onDidActiveGroupChange = this._register(new Emitter<IEditorGroupView>());
	readonly onDidChangeActiveGroup = this._onDidActiveGroupChange.event;

	private readonly _onDidAddGroup = this._register(new Emitter<IEditorGroupView>());
	readonly onDidAddGroup = this._onDidAddGroup.event;

	private readonly _onDidRemoveGroup = this._register(new Emitter<IEditorGroupView>());
	readonly onDidRemoveGroup = this._onDidRemoveGroup.event;

	private readonly _onDidMoveGroup = this._register(new Emitter<IEditorGroupView>());
	readonly onDidMoveGroup = this._onDidMoveGroup.event;

	private readonly _onDidActivateGroup = this._register(new Emitter<IEditorGroupView>());
	readonly onDidActivateGroup = this._onDidActivateGroup.event;

	private readonly _onDidChangeGroupIndex = this._register(new Emitter<IEditorGroupView>());
	readonly onDidChangeGroupIndex = this._onDidChangeGroupIndex.event;

	private readonly _onDidChangeGroupLocked = this._register(new Emitter<IEditorGroupView>());
	readonly onDidChangeGroupLocked = this._onDidChangeGroupLocked.event;

	private readonly _onDidChangeGroupMaximized = this._register(new Emitter<boolean>());
	readonly onDidChangeGroupMaximized = this._onDidChangeGroupMaximized.event;

	//#endregion

	//#region Editor Groups Service

	get activeGroup(): IEditorGroupView {
		return this.activePart.activeGroup;
	}

	get sideGroup(): IEditorSideGroup {
		return this.activePart.sideGroup;
	}

	get groups(): IEditorGroupView[] {
		return this.getGroups();
	}

	get count(): number {
		return this.groups.length;
	}

	getGroups(order = GroupsOrder.CREATION_TIME): IEditorGroupView[] {
		if (this._parts.size > 1) {
			let parts: EditorPart[];
			if (order === GroupsOrder.MOST_RECENTLY_ACTIVE) {
				parts = distinct([this.activePart, ...this._parts]); // put active part first in this order
			} else {
				parts = this.parts;
			}

			return parts.map(part => part.getGroups(order)).flat();
		}

		return this.mainPart.getGroups(order);
	}

	getGroup(identifier: GroupIdentifier): IEditorGroupView | undefined {
		if (this._parts.size > 1) {
			for (const part of this._parts) {
				const group = part.getGroup(identifier);
				if (group) {
					return group;
				}
			}
		}

		return this.mainPart.getGroup(identifier);
	}

	private assertGroupView(group: IEditorGroupView | GroupIdentifier): IEditorGroupView {
		let groupView: IEditorGroupView | undefined;
		if (typeof group === 'number') {
			groupView = this.getGroup(group);
		} else {
			groupView = group;
		}

		if (!groupView) {
			throw new Error('Invalid editor group provided!');
		}

		return groupView;
	}

	activateGroup(group: IEditorGroupView | GroupIdentifier): IEditorGroupView {
		return this.getPart(group).activateGroup(group);
	}

	getSize(group: IEditorGroupView | GroupIdentifier): { width: number; height: number } {
		return this.getPart(group).getSize(group);
	}

	setSize(group: IEditorGroupView | GroupIdentifier, size: { width: number; height: number }): void {
		this.getPart(group).setSize(group, size);
	}

	arrangeGroups(arrangement: GroupsArrangement, group?: IEditorGroupView | GroupIdentifier): void {
		(group !== undefined ? this.getPart(group) : this.activePart).arrangeGroups(arrangement, group);
	}

	toggleMaximizeGroup(group?: IEditorGroupView | GroupIdentifier): void {
		(group !== undefined ? this.getPart(group) : this.activePart).toggleMaximizeGroup(group);
	}

	toggleExpandGroup(group?: IEditorGroupView | GroupIdentifier): void {
		(group !== undefined ? this.getPart(group) : this.activePart).toggleExpandGroup(group);
	}

	restoreGroup(group: IEditorGroupView | GroupIdentifier): IEditorGroupView {
		return this.getPart(group).restoreGroup(group);
	}

	applyLayout(layout: EditorGroupLayout): void {
		this.activePart.applyLayout(layout);
	}

	getLayout(): EditorGroupLayout {
		return this.activePart.getLayout();
	}

	get orientation() {
		return this.activePart.orientation;
	}

	setGroupOrientation(orientation: GroupOrientation): void {
		this.activePart.setGroupOrientation(orientation);
	}

	findGroup(scope: IFindGroupScope, source: IEditorGroupView | GroupIdentifier = this.activeGroup, wrap?: boolean): IEditorGroupView | undefined {
		const sourcePart = this.getPart(source);
		if (this._parts.size > 1) {
			const groups = this.getGroups(GroupsOrder.GRID_APPEARANCE);

			// Ensure that FIRST/LAST dispatches globally over all parts
			if (scope.location === GroupLocation.FIRST || scope.location === GroupLocation.LAST) {
				return scope.location === GroupLocation.FIRST ? groups[0] : groups[groups.length - 1];
			}

			// Try to find in target part first without wrapping
			const group = sourcePart.findGroup(scope, source, false);
			if (group) {
				return group;
			}

			// Ensure that NEXT/PREVIOUS dispatches globally over all parts
			if (scope.location === GroupLocation.NEXT || scope.location === GroupLocation.PREVIOUS) {
				const sourceGroup = this.assertGroupView(source);
				const index = groups.indexOf(sourceGroup);

				if (scope.location === GroupLocation.NEXT) {
					let nextGroup: IEditorGroupView | undefined = groups[index + 1];
					if (!nextGroup && wrap) {
						nextGroup = groups[0];
					}

					return nextGroup;
				} else {
					let previousGroup: IEditorGroupView | undefined = groups[index - 1];
					if (!previousGroup && wrap) {
						previousGroup = groups[groups.length - 1];
					}

					return previousGroup;
				}
			}
		}

		return sourcePart.findGroup(scope, source, wrap);
	}

	addGroup(location: IEditorGroupView | GroupIdentifier, direction: GroupDirection): IEditorGroupView {
		return this.getPart(location).addGroup(location, direction);
	}

	removeGroup(group: IEditorGroupView | GroupIdentifier): void {
		this.getPart(group).removeGroup(group);
	}

	moveGroup(group: IEditorGroupView | GroupIdentifier, location: IEditorGroupView | GroupIdentifier, direction: GroupDirection): IEditorGroupView {
		return this.getPart(group).moveGroup(group, location, direction);
	}

	mergeGroup(group: IEditorGroupView | GroupIdentifier, target: IEditorGroupView | GroupIdentifier, options?: IMergeGroupOptions): IEditorGroupView {
		return this.getPart(group).mergeGroup(group, target, options);
	}

	mergeAllGroups(target: IEditorGroupView | GroupIdentifier): IEditorGroupView {
		return this.activePart.mergeAllGroups(target);
	}

	copyGroup(group: IEditorGroupView | GroupIdentifier, location: IEditorGroupView | GroupIdentifier, direction: GroupDirection): IEditorGroupView {
		return this.getPart(group).copyGroup(group, location, direction);
	}

	createEditorDropTarget(container: HTMLElement, delegate: IEditorDropTargetDelegate): IDisposable {
		return this.getPart(container).createEditorDropTarget(container, delegate);
	}

	//#endregion

	//#region Main Editor Part Only

	get partOptions() { return this.mainPart.partOptions; }
	get onDidChangeEditorPartOptions() { return this.mainPart.onDidChangeEditorPartOptions; }

	//#endregion
}

registerSingleton(IEditorGroupsService, EditorParts, InstantiationType.Eager);
