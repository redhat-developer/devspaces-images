"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormHelperText = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const form_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Form/form"));
exports.FormHelperText = (_a) => {
    var { children = null, isError = false, isHidden = true, className = '', icon = null } = _a, props = tslib_1.__rest(_a, ["children", "isError", "isHidden", "className", "icon"]);
    return (React.createElement("p", Object.assign({ className: react_styles_1.css(form_1.default.formHelperText, isError && form_1.default.modifiers.error, isHidden && form_1.default.modifiers.hidden, className) }, props),
        icon && React.createElement("span", { className: react_styles_1.css(form_1.default.formHelperTextIcon) }, icon),
        children));
};
exports.FormHelperText.displayName = 'FormHelperText';
//# sourceMappingURL=FormHelperText.js.map