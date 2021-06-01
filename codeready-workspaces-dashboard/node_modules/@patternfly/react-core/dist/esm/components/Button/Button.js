import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Button/button';
import { css } from '@patternfly/react-styles';
import { Spinner, spinnerSize } from '../Spinner';
import { useOUIAProps } from '../../helpers';
export var ButtonVariant;
(function (ButtonVariant) {
    ButtonVariant["primary"] = "primary";
    ButtonVariant["secondary"] = "secondary";
    ButtonVariant["tertiary"] = "tertiary";
    ButtonVariant["danger"] = "danger";
    ButtonVariant["warning"] = "warning";
    ButtonVariant["link"] = "link";
    ButtonVariant["plain"] = "plain";
    ButtonVariant["control"] = "control";
})(ButtonVariant || (ButtonVariant = {}));
export var ButtonType;
(function (ButtonType) {
    ButtonType["button"] = "button";
    ButtonType["submit"] = "submit";
    ButtonType["reset"] = "reset";
})(ButtonType || (ButtonType = {}));
export const Button = (_a) => {
    var { children = null, className = '', component = 'button', isActive = false, isBlock = false, isDisabled = false, isAriaDisabled = false, isLoading = null, spinnerAriaValueText, isSmall = false, isLarge = false, inoperableEvents = ['onClick', 'onKeyPress'], isInline = false, type = ButtonType.button, variant = ButtonVariant.primary, iconPosition = 'left', 'aria-label': ariaLabel = null, icon = null, ouiaId, ouiaSafe = true, tabIndex = null } = _a, props = __rest(_a, ["children", "className", "component", "isActive", "isBlock", "isDisabled", "isAriaDisabled", "isLoading", "spinnerAriaValueText", "isSmall", "isLarge", "inoperableEvents", "isInline", "type", "variant", "iconPosition", 'aria-label', "icon", "ouiaId", "ouiaSafe", "tabIndex"]);
    const ouiaProps = useOUIAProps(Button.displayName, ouiaId, ouiaSafe, variant);
    const Component = component;
    const isButtonElement = Component === 'button';
    const isInlineSpan = isInline && Component === 'span';
    if (isAriaDisabled && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('You are using a beta component feature (isAriaDisabled). These api parts are subject to change in the future.');
    }
    const preventedEvents = inoperableEvents.reduce((handlers, eventToPrevent) => (Object.assign(Object.assign({}, handlers), { [eventToPrevent]: (event) => {
            event.preventDefault();
        } })), {});
    const getDefaultTabIdx = () => {
        if (isDisabled) {
            return isButtonElement ? null : -1;
        }
        else if (isAriaDisabled) {
            return null;
        }
        else if (isInlineSpan) {
            return 0;
        }
    };
    return (React.createElement(Component, Object.assign({}, props, (isAriaDisabled ? preventedEvents : null), { "aria-disabled": isDisabled || isAriaDisabled, "aria-label": ariaLabel, className: css(styles.button, styles.modifiers[variant], isBlock && styles.modifiers.block, isDisabled && styles.modifiers.disabled, isAriaDisabled && styles.modifiers.ariaDisabled, isActive && styles.modifiers.active, isInline && variant === ButtonVariant.link && styles.modifiers.inline, isLoading !== null && styles.modifiers.progress, isLoading && styles.modifiers.inProgress, isSmall && styles.modifiers.small, isLarge && styles.modifiers.displayLg, className), disabled: isButtonElement ? isDisabled : null, tabIndex: tabIndex !== null ? tabIndex : getDefaultTabIdx(), type: isButtonElement || isInlineSpan ? type : null, role: isInlineSpan ? 'button' : null }, ouiaProps),
        isLoading && (React.createElement("span", { className: css(styles.buttonProgress) },
            React.createElement(Spinner, { size: spinnerSize.md, "aria-valuetext": spinnerAriaValueText }))),
        variant !== ButtonVariant.plain && icon && iconPosition === 'left' && (React.createElement("span", { className: css(styles.buttonIcon, styles.modifiers.start) }, icon)),
        children,
        variant !== ButtonVariant.plain && icon && iconPosition === 'right' && (React.createElement("span", { className: css(styles.buttonIcon, styles.modifiers.end) }, icon))));
};
Button.displayName = 'Button';
//# sourceMappingURL=Button.js.map