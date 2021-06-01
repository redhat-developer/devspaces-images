"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuList = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const menu_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Menu/menu"));
const react_styles_1 = require("@patternfly/react-styles");
const MenuListBase = (_a) => {
    var { children = null, className, innerRef } = _a, props = tslib_1.__rest(_a, ["children", "className", "innerRef"]);
    return (React.createElement("ul", Object.assign({ className: react_styles_1.css(menu_1.default.menuList, className), ref: innerRef }, props), children));
};
exports.MenuList = React.forwardRef((props, ref) => (React.createElement(MenuListBase, Object.assign({}, props, { innerRef: ref }))));
exports.MenuList.displayName = 'MenuList';
//# sourceMappingURL=MenuList.js.map