import * as React from 'react';
export interface HeaderCellProps {
    'data-label'?: string;
    className?: string;
    component?: React.ReactNode;
    isVisible?: boolean;
    scope?: string;
    textCenter?: boolean;
    dataLabel?: string;
    tooltip?: string;
    onMouseEnter?: (event: any) => void;
    children: React.ReactNode;
}
export declare const HeaderCell: React.FunctionComponent<HeaderCellProps>;
//# sourceMappingURL=HeaderCell.d.ts.map