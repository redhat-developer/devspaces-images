import * as React from 'react';
export declare enum ToggleGroupVariant {
    default = "default",
    light = "light"
}
export interface ToggleGroupProps extends React.HTMLProps<HTMLDivElement> {
    /** Content rendered inside the toggle group */
    children?: React.ReactNode;
    /** Additional classes added to the toggle group */
    className?: string;
    /** Adds toggle group variant styles */
    variant?: ToggleGroupVariant | 'light' | 'default';
    /** Accessible label for the toggle group */
    'aria-label'?: string;
}
export declare const ToggleGroup: React.FunctionComponent<ToggleGroupProps>;
//# sourceMappingURL=ToggleGroup.d.ts.map