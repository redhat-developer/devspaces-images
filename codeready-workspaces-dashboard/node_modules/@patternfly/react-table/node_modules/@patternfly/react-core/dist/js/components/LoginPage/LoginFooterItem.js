"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginFooterItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
exports.LoginFooterItem = (_a) => {
    var { 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className = '', children = null, href = '#', target = '_blank' } = _a, props = tslib_1.__rest(_a, ["className", "children", "href", "target"]);
    return React.isValidElement(children) ? (children) : (React.createElement("a", Object.assign({ target: target, href: href }, props), children));
};
exports.LoginFooterItem.displayName = 'LoginFooterItem';
//# sourceMappingURL=LoginFooterItem.js.map