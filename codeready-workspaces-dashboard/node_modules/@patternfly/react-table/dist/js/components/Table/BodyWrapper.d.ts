import * as React from 'react';
import { IRow, IRowData, IExtraData, IHeaderRow } from './TableTypes';
export interface BodyWrapperProps {
    children?: React.ReactNode;
    mappedRows?: IRow[];
    rows?: IRow[];
    onCollapse?: (event: React.MouseEvent, rowIndex: number, isOpen: boolean, rowData: IRowData, extraData: IExtraData) => undefined;
    tbodyRef?: React.Ref<any> | Function;
    headerRows?: IHeaderRow[];
}
export declare const BodyWrapper: React.FunctionComponent<BodyWrapperProps>;
//# sourceMappingURL=BodyWrapper.d.ts.map