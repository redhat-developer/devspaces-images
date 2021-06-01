import * as React from 'react';
import { TooltipProps } from '@patternfly/react-core/dist/js/components/Tooltip/Tooltip';
export declare enum TableTextVariant {
    div = "div",
    nav = "nav"
}
export declare enum WrapModifier {
    wrap = "wrap",
    nowrap = "nowrap",
    truncate = "truncate",
    breakWord = "breakWord",
    fitContent = "fitContent"
}
export interface TableTextProps extends React.HTMLProps<HTMLDivElement> {
    /** Content rendered within the table text */
    children?: React.ReactNode;
    /** Additional classes added to the table text */
    className?: string;
    /** Determines which element to render as a table text */
    variant?: TableTextVariant | 'span' | 'div';
    /** Determines which wrapping modifier to apply to the table text */
    wrapModifier?: WrapModifier | 'wrap' | 'nowrap' | 'truncate' | 'breakWord' | 'fitContent';
    /** text to display on the tooltip */
    tooltip?: string;
    /** other props to pass to the tooltip */
    tooltipProps?: Omit<TooltipProps, 'content'>;
    /** callback used to create the tooltip if text is truncated */
    onMouseEnter?: (event: any) => void;
}
export declare const TableText: React.FunctionComponent<TableTextProps>;
//# sourceMappingURL=TableText.d.ts.map