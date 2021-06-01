"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
exports.ListItem = (_a) => {
    var { children = null } = _a, props = tslib_1.__rest(_a, ["children"]);
    return (React.createElement("li", Object.assign({}, props), children));
};
exports.ListItem.displayName = 'ListItem';
//# sourceMappingURL=ListItem.js.map