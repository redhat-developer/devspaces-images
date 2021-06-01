import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Menu/menu';
import { css } from '@patternfly/react-styles';
const MenuListBase = (_a) => {
    var { children = null, className, innerRef } = _a, props = __rest(_a, ["children", "className", "innerRef"]);
    return (React.createElement("ul", Object.assign({ className: css(styles.menuList, className), ref: innerRef }, props), children));
};
export const MenuList = React.forwardRef((props, ref) => (React.createElement(MenuListBase, Object.assign({}, props, { innerRef: ref }))));
MenuList.displayName = 'MenuList';
//# sourceMappingURL=MenuList.js.map