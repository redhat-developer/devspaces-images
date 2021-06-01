import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/NumberInput/number-input';
import { css } from '@patternfly/react-styles';
import MinusIcon from "@patternfly/react-icons/dist/esm/icons/minus-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import { Button } from '../Button';
export const NumberInput = (_a) => {
    var { value = 0, className, widthChars, isDisabled = false, onMinus, onChange, onPlus, unit, unitPosition = 'after', min, max, inputName, inputAriaLabel = 'Input', minusBtnAriaLabel = 'Minus', plusBtnAriaLabel = 'Plus', inputProps, minusBtnProps, plusBtnProps } = _a, props = __rest(_a, ["value", "className", "widthChars", "isDisabled", "onMinus", "onChange", "onPlus", "unit", "unitPosition", "min", "max", "inputName", "inputAriaLabel", "minusBtnAriaLabel", "plusBtnAriaLabel", "inputProps", "minusBtnProps", "plusBtnProps"]);
    const numberInputUnit = React.createElement("div", { className: css(styles.numberInputUnit) }, unit);
    return (React.createElement("div", Object.assign({ className: css(styles.numberInput, className) }, (widthChars && {
        style: Object.assign({ '--pf-c-number-input--c-form-control--width-chars': widthChars }, props.style)
    }), props),
        unit && unitPosition === 'before' && numberInputUnit,
        React.createElement("div", { className: css(styles.inputGroup) },
            React.createElement(Button, Object.assign({ variant: "control", "aria-label": minusBtnAriaLabel, isDisabled: isDisabled || value === min, onClick: evt => onMinus(evt, inputName) }, minusBtnProps),
                React.createElement("span", { className: css(styles.numberInputIcon) },
                    React.createElement(MinusIcon, { "aria-hidden": "true" }))),
            React.createElement("input", Object.assign({ className: css(styles.formControl), type: "number", value: value, name: inputName, "aria-label": inputAriaLabel }, (isDisabled && { disabled: isDisabled }), (onChange && { onChange }), (!onChange && { readOnly: true }), inputProps)),
            React.createElement(Button, Object.assign({ variant: "control", "aria-label": plusBtnAriaLabel, isDisabled: isDisabled || value === max, onClick: evt => onPlus(evt, inputName) }, plusBtnProps),
                React.createElement("span", { className: css(styles.numberInputIcon) },
                    React.createElement(PlusIcon, { "aria-hidden": "true" })))),
        unit && unitPosition === 'after' && numberInputUnit));
};
NumberInput.displayName = 'NumberInput';
//# sourceMappingURL=NumberInput.js.map