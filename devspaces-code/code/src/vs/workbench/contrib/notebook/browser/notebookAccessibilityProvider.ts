/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IListAccessibilityProvider } from '../../../../base/browser/ui/list/listWidget.js';
import { Event, Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { observableFromEvent } from '../../../../base/common/observable.js';
import * as nls from '../../../../nls.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { AccessibilityVerbositySettingId } from '../../accessibility/browser/accessibilityConfiguration.js';
import { AccessibilityCommandId } from '../../accessibility/common/accessibilityCommands.js';
import { CellViewModel, NotebookViewModel } from './viewModel/notebookViewModelImpl.js';
import { CellKind, NotebookCellExecutionState } from '../common/notebookCommon.js';
import { ICellExecutionStateChangedEvent, IExecutionStateChangedEvent, INotebookExecutionStateService, NotebookExecutionType } from '../common/notebookExecutionStateService.js';

export class NotebookAccessibilityProvider extends Disposable implements IListAccessibilityProvider<CellViewModel> {
	private readonly _onDidAriaLabelChange = new Emitter<CellViewModel>();
	private readonly onDidAriaLabelChange = this._onDidAriaLabelChange.event;

	constructor(
		private readonly notebookExecutionStateService: INotebookExecutionStateService,
		private readonly viewModel: () => NotebookViewModel | undefined,
		private readonly keybindingService: IKeybindingService,
		private readonly configurationService: IConfigurationService,
		private readonly isReplHistory: boolean
	) {
		super();
		this._register(Event.debounce<ICellExecutionStateChangedEvent | IExecutionStateChangedEvent, number[]>(
			this.notebookExecutionStateService.onDidChangeExecution,
			(last: number[] | undefined, e: ICellExecutionStateChangedEvent | IExecutionStateChangedEvent) => this.mergeEvents(last, e),
			100
		)((cellHandles: number[]) => {
			const viewModel = this.viewModel();
			if (viewModel) {
				for (const handle of cellHandles) {
					const cellModel = viewModel.getCellByHandle(handle);
					if (cellModel) {
						this._onDidAriaLabelChange.fire(cellModel as CellViewModel);
					}
				}
			}
		}, this));
	}

	get verbositySettingId() {
		return this.isReplHistory ?
			AccessibilityVerbositySettingId.ReplEditor :
			AccessibilityVerbositySettingId.Notebook;
	}

	getAriaLabel(element: CellViewModel) {
		const event = Event.filter(this.onDidAriaLabelChange, e => e === element);
		return observableFromEvent(this, event, () => {
			const viewModel = this.viewModel();
			if (!viewModel) {
				return '';
			}
			const index = viewModel.getCellIndex(element);

			if (index >= 0) {
				return this.getLabel(index, element);
			}

			return '';
		});
	}

	private createItemLabel(executionLabel: string, index: number, cellKind: CellKind) {
		return this.isReplHistory ?
			`item${executionLabel}` :
			`${cellKind === CellKind.Markup ? 'markdown' : 'code'} cell${executionLabel}`;
	}

	private getLabel(index: number, element: CellViewModel) {
		const executionState = this.notebookExecutionStateService.getCellExecution(element.uri)?.state;
		const executionLabel =
			executionState === NotebookCellExecutionState.Executing
				? ', executing'
				: executionState === NotebookCellExecutionState.Pending
					? ', pending'
					: '';

		return this.createItemLabel(executionLabel, index, element.cellKind);
	}

	private get widgetAriaLabelName() {
		return this.isReplHistory ?
			nls.localize('replHistoryTreeAriaLabel', "REPL Editor History") :
			nls.localize('notebookTreeAriaLabel', "Notebook");
	}

	getWidgetAriaLabel() {
		const keybinding = this.keybindingService.lookupKeybinding(AccessibilityCommandId.OpenAccessibilityHelp)?.getLabel();

		if (this.configurationService.getValue(this.verbositySettingId)) {
			return keybinding
				? nls.localize('notebookTreeAriaLabelHelp', "{0}\nUse {1} for accessibility help", this.widgetAriaLabelName, keybinding)
				: nls.localize('notebookTreeAriaLabelHelpNoKb', "{0}\nRun the Open Accessibility Help command for more information", this.widgetAriaLabelName);
		}
		return this.widgetAriaLabelName;
	}

	private mergeEvents(last: number[] | undefined, e: ICellExecutionStateChangedEvent | IExecutionStateChangedEvent): number[] {
		const viewModel = this.viewModel();
		const result = last || [];
		if (viewModel && e.type === NotebookExecutionType.cell && e.affectsNotebook(viewModel.uri)) {
			if (result.indexOf(e.cellHandle) < 0) {
				result.push(e.cellHandle);
			}
		}
		return result;
	}
}
