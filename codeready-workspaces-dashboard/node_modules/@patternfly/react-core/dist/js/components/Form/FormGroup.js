"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormGroup = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const form_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Form/form"));
const htmlConstants_1 = require("../../helpers/htmlConstants");
const react_styles_1 = require("@patternfly/react-styles");
const constants_1 = require("../../helpers/constants");
exports.FormGroup = (_a) => {
    var { children = null, className = '', label, labelIcon, isRequired = false, validated = 'default', isInline = false, hasNoPaddingTop = false, helperText, isHelperTextBeforeField = false, helperTextInvalid, helperTextIcon, helperTextInvalidIcon, fieldId } = _a, props = tslib_1.__rest(_a, ["children", "className", "label", "labelIcon", "isRequired", "validated", "isInline", "hasNoPaddingTop", "helperText", "isHelperTextBeforeField", "helperTextInvalid", "helperTextIcon", "helperTextInvalidIcon", "fieldId"]);
    const validHelperText = typeof helperText !== 'string' ? (helperText) : (React.createElement("div", { className: react_styles_1.css(form_1.default.formHelperText, validated === constants_1.ValidatedOptions.success && form_1.default.modifiers.success, validated === constants_1.ValidatedOptions.warning && form_1.default.modifiers.warning), id: `${fieldId}-helper`, "aria-live": "polite" },
        helperTextIcon && React.createElement("span", { className: react_styles_1.css(form_1.default.formHelperTextIcon) }, helperTextIcon),
        helperText));
    const inValidHelperText = typeof helperTextInvalid !== 'string' ? (helperTextInvalid) : (React.createElement("div", { className: react_styles_1.css(form_1.default.formHelperText, form_1.default.modifiers.error), id: `${fieldId}-helper`, "aria-live": "polite" },
        helperTextInvalidIcon && React.createElement("span", { className: react_styles_1.css(form_1.default.formHelperTextIcon) }, helperTextInvalidIcon),
        helperTextInvalid));
    const showValidHelperTxt = (validationType) => validationType !== constants_1.ValidatedOptions.error && helperText ? validHelperText : '';
    const helperTextToDisplay = validated === constants_1.ValidatedOptions.error && helperTextInvalid ? inValidHelperText : showValidHelperTxt(validated);
    return (React.createElement("div", Object.assign({}, props, { className: react_styles_1.css(form_1.default.formGroup, className) }),
        label && (React.createElement("div", { className: react_styles_1.css(form_1.default.formGroupLabel, hasNoPaddingTop && form_1.default.modifiers.noPaddingTop) },
            React.createElement("label", { className: react_styles_1.css(form_1.default.formLabel), htmlFor: fieldId },
                React.createElement("span", { className: react_styles_1.css(form_1.default.formLabelText) }, label),
                isRequired && (React.createElement("span", { className: react_styles_1.css(form_1.default.formLabelRequired), "aria-hidden": "true" },
                    ' ',
                    htmlConstants_1.ASTERISK))),
            ' ',
            React.isValidElement(labelIcon) && labelIcon)),
        React.createElement("div", { className: react_styles_1.css(form_1.default.formGroupControl, isInline && form_1.default.modifiers.inline) },
            isHelperTextBeforeField && helperTextToDisplay,
            children,
            !isHelperTextBeforeField && helperTextToDisplay)));
};
exports.FormGroup.displayName = 'FormGroup';
//# sourceMappingURL=FormGroup.js.map