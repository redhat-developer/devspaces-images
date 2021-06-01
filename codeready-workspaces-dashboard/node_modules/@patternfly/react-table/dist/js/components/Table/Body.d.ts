import * as React from 'react';
import { RowKeyType } from './base/types';
import { IRow, IExtraRowData } from './TableTypes';
export interface IComputedData {
    isInput: boolean;
    isButton: boolean;
}
export declare type OnRowClick = (event: React.MouseEvent, row: IRow, rowProps: IExtraRowData, computedData: IComputedData) => void;
export interface TableBodyProps {
    /** Additional classes added to the TableBody  */
    className?: string;
    /** This prop should not be set manually  */
    children?: React.ReactNode;
    /** This prop should not be set manually  */
    headerData?: IRow[];
    /** This prop should not be set manually  */
    rows?: IRow[];
    /** This prop should not be set manually  */
    rowKey?: RowKeyType;
    /** This prop should not be set manually  */
    onRowClick?: OnRowClick;
    /** This prop should not be set manually  */
    onRow?: Function;
}
export declare const TableBody: ({ className, children, rowKey, onRow, onRowClick, ...props }: TableBodyProps) => JSX.Element;
//# sourceMappingURL=Body.d.ts.map