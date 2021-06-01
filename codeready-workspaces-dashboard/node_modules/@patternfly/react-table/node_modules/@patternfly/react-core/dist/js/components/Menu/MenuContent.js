"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuContent = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const menu_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Menu/menu"));
const react_styles_1 = require("@patternfly/react-styles");
const MenuContext_1 = require("./MenuContext");
exports.MenuContent = React.forwardRef((props, ref) => {
    const { getHeight, children, menuHeight } = props, rest = tslib_1.__rest(props, ["getHeight", "children", "menuHeight"]);
    const menuContentRef = React.createRef();
    const refCallback = (el, menuId, onGetMenuHeight) => {
        if (el) {
            onGetMenuHeight && onGetMenuHeight(menuId, el.clientHeight);
            getHeight && getHeight(el.clientHeight);
        }
        return ref || menuContentRef;
    };
    return (React.createElement(MenuContext_1.MenuContext.Consumer, null, ({ menuId, onGetMenuHeight }) => (React.createElement("div", Object.assign({}, rest, { className: react_styles_1.css(menu_1.default.menuContent, props.className), ref: el => refCallback(el, menuId, onGetMenuHeight), style: { '--pf-c-menu__content--Height': menuHeight } }), children))));
});
exports.MenuContent.displayName = 'MenuContent';
//# sourceMappingURL=MenuContent.js.map