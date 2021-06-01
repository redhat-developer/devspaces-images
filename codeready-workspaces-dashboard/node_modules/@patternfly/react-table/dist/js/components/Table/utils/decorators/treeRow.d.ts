/// <reference types="react" />
import { IExtra, IFormatterValueType, OnCheckChange, OnTreeRowCollapse, OnToggleRowDetails } from '../../TableTypes';
export declare const treeRow: (onCollapse: OnTreeRowCollapse, onCheckChange?: OnCheckChange, onToggleRowDetails?: OnToggleRowDetails) => (value: IFormatterValueType, { rowIndex, rowData }: IExtra) => {
    component: string;
    className: string;
    children: JSX.Element;
};
//# sourceMappingURL=treeRow.d.ts.map