import * as React from 'react';
export interface GalleryProps extends React.HTMLProps<HTMLDivElement> {
    /** content rendered inside the Gallery layout */
    children?: React.ReactNode;
    /** additional classes added to the Gallery layout */
    className?: string;
    /** Adds space between children. */
    hasGutter?: boolean;
    /** Minimum widths at various breakpoints. */
    minWidths?: {
        default?: string;
        sm?: string;
        md?: string;
        lg?: string;
        xl?: string;
        '2xl'?: string;
    };
    /** Maximum widths at various breakpoints. */
    maxWidths?: {
        default?: string;
        sm?: string;
        md?: string;
        lg?: string;
        xl?: string;
        '2xl'?: string;
    };
}
export declare const Gallery: React.FunctionComponent<GalleryProps>;
//# sourceMappingURL=Gallery.d.ts.map