"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberInput = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const number_input_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/NumberInput/number-input"));
const react_styles_1 = require("@patternfly/react-styles");
const minus_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/minus-icon"));
const plus_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/plus-icon"));
const Button_1 = require("../Button");
exports.NumberInput = (_a) => {
    var { value = 0, className, widthChars, isDisabled = false, onMinus, onChange, onPlus, unit, unitPosition = 'after', min, max, inputName, inputAriaLabel = 'Input', minusBtnAriaLabel = 'Minus', plusBtnAriaLabel = 'Plus', inputProps, minusBtnProps, plusBtnProps } = _a, props = tslib_1.__rest(_a, ["value", "className", "widthChars", "isDisabled", "onMinus", "onChange", "onPlus", "unit", "unitPosition", "min", "max", "inputName", "inputAriaLabel", "minusBtnAriaLabel", "plusBtnAriaLabel", "inputProps", "minusBtnProps", "plusBtnProps"]);
    const numberInputUnit = React.createElement("div", { className: react_styles_1.css(number_input_1.default.numberInputUnit) }, unit);
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(number_input_1.default.numberInput, className) }, (widthChars && {
        style: Object.assign({ '--pf-c-number-input--c-form-control--width-chars': widthChars }, props.style)
    }), props),
        unit && unitPosition === 'before' && numberInputUnit,
        React.createElement("div", { className: react_styles_1.css(number_input_1.default.inputGroup) },
            React.createElement(Button_1.Button, Object.assign({ variant: "control", "aria-label": minusBtnAriaLabel, isDisabled: isDisabled || value === min, onClick: evt => onMinus(evt, inputName) }, minusBtnProps),
                React.createElement("span", { className: react_styles_1.css(number_input_1.default.numberInputIcon) },
                    React.createElement(minus_icon_1.default, { "aria-hidden": "true" }))),
            React.createElement("input", Object.assign({ className: react_styles_1.css(number_input_1.default.formControl), type: "number", value: value, name: inputName, "aria-label": inputAriaLabel }, (isDisabled && { disabled: isDisabled }), (onChange && { onChange }), (!onChange && { readOnly: true }), inputProps)),
            React.createElement(Button_1.Button, Object.assign({ variant: "control", "aria-label": plusBtnAriaLabel, isDisabled: isDisabled || value === max, onClick: evt => onPlus(evt, inputName) }, plusBtnProps),
                React.createElement("span", { className: react_styles_1.css(number_input_1.default.numberInputIcon) },
                    React.createElement(plus_icon_1.default, { "aria-hidden": "true" })))),
        unit && unitPosition === 'after' && numberInputUnit));
};
exports.NumberInput.displayName = 'NumberInput';
//# sourceMappingURL=NumberInput.js.map