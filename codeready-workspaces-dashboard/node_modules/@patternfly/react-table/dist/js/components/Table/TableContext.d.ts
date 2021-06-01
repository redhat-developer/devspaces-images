import * as React from 'react';
import { IHeaderRow, IRow } from './TableTypes';
import { ColumnsType } from './base';
export declare const TableContext: React.Context<{
    headerData: ColumnsType;
    headerRows: IHeaderRow[];
    rows: (IRow | string[])[];
}>;
//# sourceMappingURL=TableContext.d.ts.map