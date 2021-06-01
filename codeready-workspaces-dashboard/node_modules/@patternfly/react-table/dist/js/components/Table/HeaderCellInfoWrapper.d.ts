import * as React from 'react';
import { TooltipProps, PopoverProps } from '@patternfly/react-core';
export interface ColumnHelpWrapperProps {
    /**
     * The header cell that is wrapped
     */
    children: React.ReactNode;
    /**
     * The information that is presented in the tooltip/popover
     */
    info: React.ReactNode;
    /**
     * Optional classname to add to the tooltip/popover
     */
    className?: string;
    /**
     * The info variant
     */
    variant?: 'tooltip' | 'popover';
    /**
     * Additional props forwarded to the Popover component
     */
    popoverProps?: Omit<PopoverProps, 'bodyContent'>;
    /**
     * Additional props forwarded to the tooltip component
     */
    tooltipProps?: Omit<TooltipProps, 'content'>;
    /**
     * Aria label of the info button
     */
    ariaLabel?: string;
}
export declare const HeaderCellInfoWrapper: React.FunctionComponent<ColumnHelpWrapperProps>;
//# sourceMappingURL=HeaderCellInfoWrapper.d.ts.map