"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
exports.Brand = (_a) => {
    var { className = '', src = '', alt } = _a, props = tslib_1.__rest(_a, ["className", "src", "alt"]);
    return (
    /** the brand component currently contains no styling the 'pf-c-brand' string will be used for the className */
    React.createElement("img", Object.assign({}, props, { className: react_styles_1.css('pf-c-brand', className), src: src, alt: alt })));
};
exports.Brand.displayName = 'Brand';
//# sourceMappingURL=Brand.js.map