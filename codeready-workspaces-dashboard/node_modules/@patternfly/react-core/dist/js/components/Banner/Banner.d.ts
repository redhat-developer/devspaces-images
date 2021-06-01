import * as React from 'react';
export interface BannerProps extends React.HTMLProps<HTMLButtonElement> {
    /** Content rendered inside the banner */
    children?: React.ReactNode;
    /** Additional classes added to the banner */
    className?: string;
    /** Variant styles for the banner */
    variant?: 'default' | 'info' | 'danger' | 'success' | 'warning';
    /** If set to true, the banner sticks to the top of its container */
    isSticky?: boolean;
}
export declare const Banner: React.FunctionComponent<BannerProps>;
//# sourceMappingURL=Banner.d.ts.map