import * as React from 'react';
import { ColumnsType, RowType, RendererType } from './types';
export interface BodyRowProps {
    columns: ColumnsType;
    renderers: RendererType;
    onRow?: Function;
    rowIndex: number;
    rowData: RowType;
    rowKey: string;
}
export declare class BodyRow extends React.Component<BodyRowProps, {}> {
    static displayName: string;
    static defaultProps: {
        onRow: (...args: any) => ObjectConstructor;
    };
    shouldComponentUpdate(nextProps: BodyRowProps): boolean;
    render(): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)>;
}
//# sourceMappingURL=body-row.d.ts.map