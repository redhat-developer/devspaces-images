import * as React from 'react';
export declare enum SortByDirection {
    asc = "asc",
    desc = "desc"
}
export interface SortColumnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    className?: string;
    isSortedBy?: boolean;
    onSort?: Function;
    sortDirection?: string;
}
export declare const SortColumn: React.FunctionComponent<SortColumnProps>;
//# sourceMappingURL=SortColumn.d.ts.map