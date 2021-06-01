import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Menu/menu';
import { css } from '@patternfly/react-styles';
import { MenuContext } from './MenuContext';
export const MenuContent = React.forwardRef((props, ref) => {
    const { getHeight, children, menuHeight } = props, rest = __rest(props, ["getHeight", "children", "menuHeight"]);
    const menuContentRef = React.createRef();
    const refCallback = (el, menuId, onGetMenuHeight) => {
        if (el) {
            onGetMenuHeight && onGetMenuHeight(menuId, el.clientHeight);
            getHeight && getHeight(el.clientHeight);
        }
        return ref || menuContentRef;
    };
    return (React.createElement(MenuContext.Consumer, null, ({ menuId, onGetMenuHeight }) => (React.createElement("div", Object.assign({}, rest, { className: css(styles.menuContent, props.className), ref: el => refCallback(el, menuId, onGetMenuHeight), style: { '--pf-c-menu__content--Height': menuHeight } }), children))));
});
MenuContent.displayName = 'MenuContent';
//# sourceMappingURL=MenuContent.js.map