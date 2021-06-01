import * as React from 'react';
export interface AutoFitModifiers {
    default?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
}
export interface DescriptionListProps extends Omit<React.HTMLProps<HTMLDListElement>, 'type'> {
    /** Anything that can be rendered inside of the list */
    children?: React.ReactNode;
    /** Additional classes added to the list */
    className?: string;
    /** Sets the description list to auto fit. */
    isAutoFit?: boolean;
    /** Sets the description list component term and description pair to a horizontal layout. */
    isHorizontal?: boolean;
    /** Sets the description list to format automatically. */
    isAutoColumnWidths?: boolean;
    /** Modifies the description list display to inline-grid. */
    isInlineGrid?: boolean;
    /** Sets the number of columns on the description list */
    columnModifier?: {
        default?: '1Col' | '2Col' | '3Col';
        md?: '1Col' | '2Col' | '3Col';
        lg?: '1Col' | '2Col' | '3Col';
        xl?: '1Col' | '2Col' | '3Col';
        '2xl'?: '1Col' | '2Col' | '3Col';
    };
    autoFitMinModifier?: {
        default?: string;
        md?: string;
        lg?: string;
        xl?: string;
        '2xl'?: string;
    };
}
export declare const DescriptionList: React.FunctionComponent<DescriptionListProps>;
//# sourceMappingURL=DescriptionList.d.ts.map