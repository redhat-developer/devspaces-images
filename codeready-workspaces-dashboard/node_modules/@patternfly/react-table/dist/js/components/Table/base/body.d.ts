/// <reference types="react" />
import { RowsType, RowKeyType, RenderersTypes, ColumnsType } from './types';
export interface BodyProps {
    onRow?: Function;
    rows: RowsType;
    rowKey?: RowKeyType;
    columns?: ColumnsType;
    renderers?: RenderersTypes['renderers'];
    mappedRows?: any;
    className?: string;
}
export declare const Body: (props: BodyProps) => JSX.Element;
//# sourceMappingURL=body.d.ts.map