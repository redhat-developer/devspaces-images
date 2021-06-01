import { IRow, IValidatorDef, RowEditType, RowErrors } from '../TableTypes';
export declare const isRowExpanded: (row: IRow, rows: IRow[]) => any;
export declare const getErrorTextByValidator: (validatorName: string, validators: IValidatorDef[]) => string;
export declare const cancelCellEdits: (row: IRow) => IRow;
export declare const validateCellEdits: (row: IRow, type: RowEditType, validationErrors: RowErrors, missingPropErrorTxt?: string) => IRow;
export declare const applyCellEdits: (row: IRow, type: RowEditType) => IRow;
export declare const toCamel: (s: string) => string;
/**
 * @param {string} input - String to capitalize
 */
export declare function capitalize(input: string): string;
//# sourceMappingURL=utils.d.ts.map