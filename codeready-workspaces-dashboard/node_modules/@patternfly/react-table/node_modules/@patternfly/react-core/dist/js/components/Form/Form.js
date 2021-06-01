"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Form = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const form_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Form/form"));
const react_styles_1 = require("@patternfly/react-styles");
exports.Form = (_a) => {
    var { children = null, className = '', isHorizontal = false, isWidthLimited = false } = _a, props = tslib_1.__rest(_a, ["children", "className", "isHorizontal", "isWidthLimited"]);
    return (React.createElement("form", Object.assign({ noValidate: true }, props, { className: react_styles_1.css(form_1.default.form, isHorizontal && form_1.default.modifiers.horizontal, isWidthLimited && form_1.default.modifiers.limitWidth, className) }), children));
};
exports.Form.displayName = 'Form';
//# sourceMappingURL=Form.js.map