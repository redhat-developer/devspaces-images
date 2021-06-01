import { IExtra, IFormatterValueType, IFormatter, decoratorReturnType } from '../../TableTypes';
export declare const collapsible: IFormatter;
export declare const expandable: IFormatter;
export declare const expandedRow: (colSpan?: number) => (value: IFormatterValueType, { columnIndex, rowIndex, rowData, column: { extraParams: { contentId } } }: IExtra) => decoratorReturnType;
//# sourceMappingURL=collapsible.d.ts.map