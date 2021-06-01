import * as React from 'react';
import { BadgeProps } from '../Badge';
export interface MenuToggleProps extends Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'ref'> {
    /** Content rendered inside the toggle */
    children?: React.ReactNode;
    /** Additional classes added to the toggle */
    className?: string;
    /** Flag indicating the toggle has expanded styling */
    isExpanded?: boolean;
    /** Flag indicating the toggle is disabled */
    isDisabled?: boolean;
    /** Variant styles of the menu toggle */
    variant?: 'default' | 'plain' | 'primary';
    /** Optional icon rendered inside the toggle, before the children content */
    icon?: React.ReactNode;
    /** Optional badge rendered inside the toggle, after the children content */
    badge?: BadgeProps | React.ReactNode;
    /** Forwarded ref */
    innerRef?: React.Ref<HTMLButtonElement>;
}
export declare class MenuToggleBase extends React.Component<MenuToggleProps> {
    displayName: string;
    static defaultProps: {
        className: string;
        isExpanded: boolean;
        isDisabled: boolean;
        variant: string;
    };
    render(): JSX.Element;
}
export declare const MenuToggle: React.ForwardRefExoticComponent<MenuToggleProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=MenuToggle.d.ts.map