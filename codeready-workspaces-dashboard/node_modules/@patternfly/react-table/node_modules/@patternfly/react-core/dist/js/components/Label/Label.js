"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const label_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Label/label"));
const Button_1 = require("../Button");
const Tooltip_1 = require("../Tooltip");
const react_styles_1 = require("@patternfly/react-styles");
const times_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/times-icon"));
const colorStyles = {
    blue: label_1.default.modifiers.blue,
    cyan: label_1.default.modifiers.cyan,
    green: label_1.default.modifiers.green,
    orange: label_1.default.modifiers.orange,
    purple: label_1.default.modifiers.purple,
    red: label_1.default.modifiers.red,
    grey: ''
};
exports.Label = (_a) => {
    var { children, className = '', color = 'grey', variant = 'filled', isTruncated = false, tooltipPosition, icon, onClose, closeBtn, closeBtnProps, href, isOverflowLabel, render } = _a, props = tslib_1.__rest(_a, ["children", "className", "color", "variant", "isTruncated", "tooltipPosition", "icon", "onClose", "closeBtn", "closeBtnProps", "href", "isOverflowLabel", "render"]);
    const LabelComponent = (isOverflowLabel ? 'button' : 'span');
    const Component = href ? 'a' : 'span';
    const button = closeBtn ? (closeBtn) : (React.createElement(Button_1.Button, Object.assign({ type: "button", variant: "plain", onClick: onClose }, Object.assign({ 'aria-label': 'label-close-button' }, closeBtnProps)),
        React.createElement(times_icon_1.default, null)));
    const textRef = React.createRef();
    // ref to apply tooltip when rendered is used
    const componentRef = React.useRef();
    const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);
    React.useLayoutEffect(() => {
        setIsTooltipVisible(textRef.current && textRef.current.offsetWidth < textRef.current.scrollWidth);
    }, []);
    const content = (React.createElement(React.Fragment, null,
        icon && React.createElement("span", { className: react_styles_1.css(label_1.default.labelIcon) }, icon),
        isTruncated && (React.createElement("span", { ref: textRef, className: react_styles_1.css(label_1.default.labelText) }, children)),
        !isTruncated && children));
    let labelComponentChild = (React.createElement(Component, Object.assign({ className: react_styles_1.css(label_1.default.labelContent) }, (href && { href })), content));
    if (render) {
        labelComponentChild = (React.createElement(React.Fragment, null,
            isTooltipVisible && React.createElement(Tooltip_1.Tooltip, { reference: componentRef, content: children, position: tooltipPosition }),
            render({
                className: label_1.default.labelContent,
                content,
                componentRef
            })));
    }
    else if (isTooltipVisible) {
        labelComponentChild = (React.createElement(Tooltip_1.Tooltip, { content: children, position: tooltipPosition },
            React.createElement(Component, Object.assign({ className: react_styles_1.css(label_1.default.labelContent) }, (href && { href })), content)));
    }
    return (React.createElement(LabelComponent, Object.assign({}, props, { className: react_styles_1.css(label_1.default.label, colorStyles[color], variant === 'outline' && label_1.default.modifiers.outline, isOverflowLabel && label_1.default.modifiers.overflow, className) }),
        labelComponentChild,
        onClose && button));
};
exports.Label.displayName = 'Label';
//# sourceMappingURL=Label.js.map