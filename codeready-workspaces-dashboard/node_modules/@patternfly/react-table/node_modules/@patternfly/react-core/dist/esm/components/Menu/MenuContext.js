import * as React from 'react';
export const MenuContext = React.createContext({
    menuId: null,
    parentMenu: null,
    onActionClick: () => null,
    onSelect: () => null,
    activeItemId: null,
    selected: null,
    drilledInMenus: [],
    drilldownItemPath: [],
    onDrillIn: null,
    onDrillOut: null,
    onGetMenuHeight: () => null
});
export const MenuItemContext = React.createContext({
    itemId: null,
    isDisabled: false
});
//# sourceMappingURL=MenuContext.js.map