"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Caption = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
exports.Caption = (_a) => {
    var { children, className } = _a, props = tslib_1.__rest(_a, ["children", "className"]);
    return (React.createElement("caption", Object.assign({ className: className }, props), children));
};
exports.Caption.displayName = 'Caption';
//# sourceMappingURL=Caption.js.map