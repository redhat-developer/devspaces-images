import * as React from 'react';
import { NavSelectClickHandler } from './Nav';
import { OUIAProps } from '../../helpers';
export interface NavItemProps extends Omit<React.HTMLProps<HTMLAnchorElement>, 'onClick'>, OUIAProps {
    /** Content rendered inside the nav item. If React.isValidElement(children) props onClick, className and aria-current will be injected. */
    children?: React.ReactNode;
    /** Whether to set className on children when React.isValidElement(children) */
    styleChildren?: boolean;
    /** Additional classes added to the nav item */
    className?: string;
    /** Target navigation link */
    to?: string;
    /** Flag indicating whether the item is active */
    isActive?: boolean;
    /** Group identifier, will be returned with the onToggle and onSelect callback passed to the Nav component */
    groupId?: string | number | null;
    /** Item identifier, will be returned with the onToggle and onSelect callback passed to the Nav component */
    itemId?: string | number | null;
    /** If true prevents the default anchor link action to occur. Set to true if you want to handle navigation yourself. */
    preventDefault?: boolean;
    /** Callback for item click */
    onClick?: NavSelectClickHandler;
    /** Component used to render NavItems */
    component?: React.ReactNode;
}
export declare const NavItem: React.FunctionComponent<NavItemProps>;
//# sourceMappingURL=NavItem.d.ts.map