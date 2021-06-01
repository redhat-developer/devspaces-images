import * as React from 'react';
export declare enum DividerVariant {
    hr = "hr",
    li = "li",
    div = "div"
}
export interface DividerProps extends React.HTMLProps<HTMLElement> {
    /** Additional classes added to the divider */
    className?: string;
    /** The component type to use */
    component?: 'hr' | 'li' | 'div';
    /** Flag to indicate the divider is vertical (must be in a flex layout) */
    isVertical?: boolean;
    /** Insets at various breakpoints. */
    inset?: {
        default?: 'insetNone' | 'insetXs' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl' | 'inset3xl';
        sm?: 'insetNone' | 'insetXs' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl' | 'inset3xl';
        md?: 'insetNone' | 'insetXs' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl' | 'inset3xl';
        lg?: 'insetNone' | 'insetXs' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl' | 'inset3xl';
        xl?: 'insetNone' | 'insetXs' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl' | 'inset3xl';
        '2xl'?: 'insetNone' | 'insetXs' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl' | 'inset3xl';
    };
}
export declare const Divider: React.FunctionComponent<DividerProps>;
//# sourceMappingURL=Divider.d.ts.map