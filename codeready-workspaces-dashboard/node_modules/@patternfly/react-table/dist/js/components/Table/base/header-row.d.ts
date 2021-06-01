/**
 * header-row.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import * as React from 'react';
import { RowsType, RendererType } from './types';
export interface HeaderRowProps {
    rowData: RowsType;
    rowIndex: number;
    renderers: RendererType;
    onRow?: Function;
}
export declare const HeaderRow: React.FunctionComponent<HeaderRowProps>;
//# sourceMappingURL=header-row.d.ts.map