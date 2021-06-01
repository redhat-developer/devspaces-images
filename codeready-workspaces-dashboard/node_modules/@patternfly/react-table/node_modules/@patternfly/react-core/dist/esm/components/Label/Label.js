import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Label/label';
import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import { css } from '@patternfly/react-styles';
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
const colorStyles = {
    blue: styles.modifiers.blue,
    cyan: styles.modifiers.cyan,
    green: styles.modifiers.green,
    orange: styles.modifiers.orange,
    purple: styles.modifiers.purple,
    red: styles.modifiers.red,
    grey: ''
};
export const Label = (_a) => {
    var { children, className = '', color = 'grey', variant = 'filled', isTruncated = false, tooltipPosition, icon, onClose, closeBtn, closeBtnProps, href, isOverflowLabel, render } = _a, props = __rest(_a, ["children", "className", "color", "variant", "isTruncated", "tooltipPosition", "icon", "onClose", "closeBtn", "closeBtnProps", "href", "isOverflowLabel", "render"]);
    const LabelComponent = (isOverflowLabel ? 'button' : 'span');
    const Component = href ? 'a' : 'span';
    const button = closeBtn ? (closeBtn) : (React.createElement(Button, Object.assign({ type: "button", variant: "plain", onClick: onClose }, Object.assign({ 'aria-label': 'label-close-button' }, closeBtnProps)),
        React.createElement(TimesIcon, null)));
    const textRef = React.createRef();
    // ref to apply tooltip when rendered is used
    const componentRef = React.useRef();
    const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);
    React.useLayoutEffect(() => {
        setIsTooltipVisible(textRef.current && textRef.current.offsetWidth < textRef.current.scrollWidth);
    }, []);
    const content = (React.createElement(React.Fragment, null,
        icon && React.createElement("span", { className: css(styles.labelIcon) }, icon),
        isTruncated && (React.createElement("span", { ref: textRef, className: css(styles.labelText) }, children)),
        !isTruncated && children));
    let labelComponentChild = (React.createElement(Component, Object.assign({ className: css(styles.labelContent) }, (href && { href })), content));
    if (render) {
        labelComponentChild = (React.createElement(React.Fragment, null,
            isTooltipVisible && React.createElement(Tooltip, { reference: componentRef, content: children, position: tooltipPosition }),
            render({
                className: styles.labelContent,
                content,
                componentRef
            })));
    }
    else if (isTooltipVisible) {
        labelComponentChild = (React.createElement(Tooltip, { content: children, position: tooltipPosition },
            React.createElement(Component, Object.assign({ className: css(styles.labelContent) }, (href && { href })), content)));
    }
    return (React.createElement(LabelComponent, Object.assign({}, props, { className: css(styles.label, colorStyles[color], variant === 'outline' && styles.modifiers.outline, isOverflowLabel && styles.modifiers.overflow, className) }),
        labelComponentChild,
        onClose && button));
};
Label.displayName = 'Label';
//# sourceMappingURL=Label.js.map