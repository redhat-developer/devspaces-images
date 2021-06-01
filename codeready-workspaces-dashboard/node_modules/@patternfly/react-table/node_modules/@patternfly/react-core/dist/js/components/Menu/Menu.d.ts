import * as React from 'react';
import { OUIAProps } from '../../helpers';
export interface MenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'ref' | 'onSelect'>, OUIAProps {
    /** Anything that can be rendered inside of the Menu */
    children?: React.ReactNode;
    /** Additional classes added to the Menu */
    className?: string;
    /** ID of the menu */
    id?: string;
    /** Callback for updating when item selection changes. You can also specify onClick on the MenuItem. */
    onSelect?: (event?: React.MouseEvent, itemId?: string | number) => void;
    /** Single itemId for single select menus, or array of itemIds for multi select. You can also specify isSelected on the MenuItem. */
    selected?: any | any[];
    /** Callback called when an MenuItems's action button is clicked. You can also specify it within a MenuItemAction. */
    onActionClick?: (event?: any, itemId?: any, actionId?: any) => void;
    /** Search input of menu */
    hasSearchInput?: boolean;
    /** A callback for when the input value changes. */
    onSearchInputChange?: (event: React.FormEvent<HTMLInputElement> | React.SyntheticEvent<HTMLButtonElement>, value: string) => void;
    /** Accessibility label */
    'aria-label'?: string;
    /** Indicates if menu contains a flyout menu */
    containsFlyout?: boolean;
    /** Indicates if menu contains a drilldown menu */
    containsDrilldown?: boolean;
    /** Indicates if a menu is drilled into */
    isMenuDrilledIn?: boolean;
    /** Indicates the path of drilled in menu itemIds */
    drilldownItemPath?: string[];
    /** Array of menus that are drilled in */
    drilledInMenus?: string[];
    /** Callback for drilling into a submenu */
    onDrillIn?: (fromItemId: string, toItemId: string, itemId: string) => void;
    /** Callback for drilling out of a submenu */
    onDrillOut?: (toItemId: string, itemId: string) => void;
    /** Callback for collecting menu heights */
    onGetMenuHeight?: (menuId: string, height: number) => void;
    /** ID of parent menu for drilldown menus */
    parentMenu?: string;
    /** ID of the currently active menu for the drilldown variant */
    activeMenu?: string;
    /** itemId of the currently active item. You can also specify isActive on the MenuItem. */
    activeItemId?: string | number;
    /** Forwarded ref */
    innerRef?: React.Ref<any>;
    /** Internal flag indicating if the Menu is the root of a menu tree */
    isRootMenu?: boolean;
}
export interface MenuState {
    searchInputValue: string | null;
    ouiaStateId: string;
    transitionMoveTarget: HTMLElement;
}
export declare const Menu: React.ForwardRefExoticComponent<MenuProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Menu.d.ts.map