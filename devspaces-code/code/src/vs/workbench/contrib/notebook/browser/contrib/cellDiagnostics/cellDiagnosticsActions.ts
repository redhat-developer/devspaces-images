/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../../../../base/common/keyCodes.js';
import { ServicesAccessor } from '../../../../../../editor/browser/editorExtensions.js';
import { Range } from '../../../../../../editor/common/core/range.js';
import { CodeActionController } from '../../../../../../editor/contrib/codeAction/browser/codeActionController.js';
import { CodeActionKind, CodeActionTriggerSource } from '../../../../../../editor/contrib/codeAction/common/types.js';
import { localize, localize2 } from '../../../../../../nls.js';
import { registerAction2 } from '../../../../../../platform/actions/common/actions.js';
import { ContextKeyExpr } from '../../../../../../platform/contextkey/common/contextkey.js';
import { KeybindingWeight } from '../../../../../../platform/keybinding/common/keybindingsRegistry.js';
import { INotebookCellActionContext, NotebookCellAction, findTargetCellEditor } from '../../controller/coreActions.js';
import { CodeCellViewModel } from '../../viewModel/codeCellViewModel.js';
import { NOTEBOOK_CELL_EDITOR_FOCUSED, NOTEBOOK_CELL_FOCUSED, NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS } from '../../../common/notebookContextKeys.js';

export const OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID = 'notebook.cell.openFailureActions';

registerAction2(class extends NotebookCellAction {
	constructor() {
		super({
			id: OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID,
			title: localize2('notebookActions.cellFailureActions', "Show Cell Failure Actions"),
			precondition: ContextKeyExpr.and(NOTEBOOK_CELL_FOCUSED, NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS, NOTEBOOK_CELL_EDITOR_FOCUSED.toNegated()),
			f1: true,
			keybinding: {
				when: ContextKeyExpr.and(NOTEBOOK_CELL_FOCUSED, NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS, NOTEBOOK_CELL_EDITOR_FOCUSED.toNegated()),
				primary: KeyMod.CtrlCmd | KeyCode.Period,
				weight: KeybindingWeight.WorkbenchContrib
			}
		});
	}

	async runWithContext(accessor: ServicesAccessor, context: INotebookCellActionContext): Promise<void> {
		if (context.cell instanceof CodeCellViewModel) {
			const error = context.cell.excecutionError.get();
			if (error?.location) {
				const location = Range.lift({
					startLineNumber: error.location.startLineNumber + 1,
					startColumn: error.location.startColumn + 1,
					endLineNumber: error.location.endLineNumber + 1,
					endColumn: error.location.endColumn + 1
				});
				context.notebookEditor.setCellEditorSelection(context.cell, Range.lift(location));
				const editor = findTargetCellEditor(context, context.cell);
				if (editor) {
					const controller = CodeActionController.get(editor);
					controller?.manualTriggerAtCurrentPosition(
						localize('cellCommands.quickFix.noneMessage', "No code actions available"),
						CodeActionTriggerSource.Default,
						{ include: CodeActionKind.QuickFix });
				}
			}
		}
	}
});
