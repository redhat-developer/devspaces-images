"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Popover = exports.PopoverPosition = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console */
const React = tslib_1.__importStar(require("react"));
const constants_1 = require("../../helpers/constants");
const popover_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Popover/popover"));
const react_styles_1 = require("@patternfly/react-styles");
const PopoverContent_1 = require("./PopoverContent");
const PopoverBody_1 = require("./PopoverBody");
const PopoverHeader_1 = require("./PopoverHeader");
const PopoverFooter_1 = require("./PopoverFooter");
const PopoverCloseButton_1 = require("./PopoverCloseButton");
const PopoverArrow_1 = require("./PopoverArrow");
const c_popover_MaxWidth_1 = tslib_1.__importDefault(require("@patternfly/react-tokens/dist/js/c_popover_MaxWidth"));
const c_popover_MinWidth_1 = tslib_1.__importDefault(require("@patternfly/react-tokens/dist/js/c_popover_MinWidth"));
const helpers_1 = require("../../helpers");
const Popper_1 = require("../../helpers/Popper/Popper");
const util_1 = require("../../helpers/util");
var PopoverPosition;
(function (PopoverPosition) {
    PopoverPosition["auto"] = "auto";
    PopoverPosition["top"] = "top";
    PopoverPosition["bottom"] = "bottom";
    PopoverPosition["left"] = "left";
    PopoverPosition["right"] = "right";
})(PopoverPosition = exports.PopoverPosition || (exports.PopoverPosition = {}));
exports.Popover = (_a) => {
    var { children, position = 'top', enableFlip = true, className = '', isVisible = null, shouldClose = () => null, shouldOpen = () => null, 'aria-label': ariaLabel = '', bodyContent, headerContent = null, footerContent = null, appendTo = () => document.body, hideOnOutsideClick = true, onHide = () => null, onHidden = () => null, onShow = () => null, onShown = () => null, onMount = () => null, zIndex = 9999, minWidth = c_popover_MinWidth_1.default && c_popover_MinWidth_1.default.value, maxWidth = c_popover_MaxWidth_1.default && c_popover_MaxWidth_1.default.value, closeBtnAriaLabel = 'Close', showClose = true, distance = 25, 
    // For every initial starting position, there are 3 escape positions
    flipBehavior = ['top', 'right', 'bottom', 'left', 'top', 'right', 'bottom'], animationDuration = 300, id, withFocusTrap: propWithFocusTrap, boundary, tippyProps, reference, hasNoPadding = false, hasAutoWidth = false } = _a, rest = tslib_1.__rest(_a, ["children", "position", "enableFlip", "className", "isVisible", "shouldClose", "shouldOpen", 'aria-label', "bodyContent", "headerContent", "footerContent", "appendTo", "hideOnOutsideClick", "onHide", "onHidden", "onShow", "onShown", "onMount", "zIndex", "minWidth", "maxWidth", "closeBtnAriaLabel", "showClose", "distance", "flipBehavior", "animationDuration", "id", "withFocusTrap", "boundary", "tippyProps", "reference", "hasNoPadding", "hasAutoWidth"]);
    if (process.env.NODE_ENV !== 'production') {
        boundary !== undefined &&
            console.warn('The Popover boundary prop has been deprecated. If you want to constrain the popper to a specific element use the appendTo prop instead.');
        tippyProps !== undefined && console.warn('The Popover tippyProps prop has been deprecated and is no longer used.');
    }
    // could make this a prop in the future (true | false | 'toggle')
    // const hideOnClick = true;
    const uniqueId = id || util_1.getUniqueId();
    const triggerManually = isVisible !== null;
    const [visible, setVisible] = React.useState(false);
    const [opacity, setOpacity] = React.useState(0);
    const [focusTrapActive, setFocusTrapActive] = React.useState(Boolean(propWithFocusTrap));
    const transitionTimerRef = React.useRef(null);
    const showTimerRef = React.useRef(null);
    const hideTimerRef = React.useRef(null);
    React.useEffect(() => {
        onMount();
    }, []);
    React.useEffect(() => {
        if (triggerManually) {
            if (isVisible) {
                show();
            }
            else {
                hide();
            }
        }
    }, [isVisible, triggerManually]);
    const show = (withFocusTrap) => {
        onShow();
        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
        }
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }
        showTimerRef.current = setTimeout(() => {
            setVisible(true);
            setOpacity(1);
            propWithFocusTrap !== false && withFocusTrap && setFocusTrapActive(true);
            onShown();
        }, 0);
    };
    const hide = () => {
        onHide();
        if (showTimerRef.current) {
            clearTimeout(showTimerRef.current);
        }
        hideTimerRef.current = setTimeout(() => {
            setOpacity(0);
            setFocusTrapActive(false);
            transitionTimerRef.current = setTimeout(() => {
                setVisible(false);
                onHidden();
            }, animationDuration);
        }, 0);
    };
    const positionModifiers = {
        top: popover_1.default.modifiers.top,
        bottom: popover_1.default.modifiers.bottom,
        left: popover_1.default.modifiers.left,
        right: popover_1.default.modifiers.right
    };
    const hasCustomMinWidth = minWidth !== c_popover_MinWidth_1.default.value;
    const hasCustomMaxWidth = maxWidth !== c_popover_MaxWidth_1.default.value;
    const onDocumentKeyDown = (event) => {
        if (event.keyCode === constants_1.KEY_CODES.ESCAPE_KEY && visible) {
            if (triggerManually) {
                shouldClose(null, hide, event);
            }
            else {
                hide();
            }
        }
    };
    const onDocumentClick = (event, triggerElement, popperElement) => {
        if (hideOnOutsideClick && visible) {
            // check if we clicked within the popper, if so don't do anything
            const isChild = popperElement && popperElement.contains(event.target);
            if (isChild) {
                // clicked within the popper
                return;
            }
            if (triggerManually) {
                shouldClose(null, hide, event);
            }
            else {
                hide();
            }
        }
    };
    const onTriggerEnter = (event) => {
        if (event.keyCode === constants_1.KEY_CODES.ENTER) {
            if (!visible) {
                if (triggerManually) {
                    shouldOpen(show, event);
                }
                else {
                    show(true);
                }
            }
            else {
                if (triggerManually) {
                    shouldClose(null, hide, event);
                }
                else {
                    hide();
                }
            }
        }
    };
    const onTriggerClick = (event) => {
        if (triggerManually) {
            if (visible) {
                shouldClose(null, hide, event);
            }
            else {
                shouldOpen(show, event);
            }
        }
        else {
            if (visible) {
                hide();
            }
            else {
                show();
            }
        }
    };
    const onContentMouseDown = () => {
        if (focusTrapActive) {
            setFocusTrapActive(false);
        }
    };
    const closePopover = (event) => {
        event.stopPropagation();
        if (triggerManually) {
            shouldClose(null, hide, event);
        }
        else {
            hide();
        }
    };
    const content = (React.createElement(helpers_1.FocusTrap, Object.assign({ active: focusTrapActive, focusTrapOptions: {
            returnFocusOnDeactivate: true,
            clickOutsideDeactivates: true,
            fallbackFocus: () => {
                // If the popover's trigger is focused but scrolled out of view,
                // FocusTrap will throw an error when the Enter button is used on the trigger.
                // That is because the Popover is hidden when its trigger is out of view.
                // Provide a fallback in that case.
                let node = null;
                if (document && document.activeElement) {
                    node = document.activeElement;
                }
                return node;
            }
        }, preventScrollOnDeactivate: true, className: react_styles_1.css(popover_1.default.popover, hasNoPadding && popover_1.default.modifiers.noPadding, hasAutoWidth && popover_1.default.modifiers.widthAuto, className), role: "dialog", "aria-modal": "true", "aria-label": headerContent ? undefined : ariaLabel, "aria-labelledby": headerContent ? `popover-${uniqueId}-header` : undefined, "aria-describedby": `popover-${uniqueId}-body`, onMouseDown: onContentMouseDown, style: {
            minWidth: hasCustomMinWidth ? minWidth : null,
            maxWidth: hasCustomMaxWidth ? maxWidth : null,
            opacity,
            transition: Popper_1.getOpacityTransition(animationDuration)
        } }, rest),
        React.createElement(PopoverArrow_1.PopoverArrow, null),
        React.createElement(PopoverContent_1.PopoverContent, null,
            showClose && React.createElement(PopoverCloseButton_1.PopoverCloseButton, { onClose: closePopover, "aria-label": closeBtnAriaLabel }),
            headerContent && (React.createElement(PopoverHeader_1.PopoverHeader, { id: `popover-${uniqueId}-header` }, typeof headerContent === 'function' ? headerContent(hide) : headerContent)),
            React.createElement(PopoverBody_1.PopoverBody, { id: `popover-${uniqueId}-body` }, typeof bodyContent === 'function' ? bodyContent(hide) : bodyContent),
            footerContent && (React.createElement(PopoverFooter_1.PopoverFooter, { id: `popover-${uniqueId}-footer` }, typeof footerContent === 'function' ? footerContent(hide) : footerContent)))));
    return (React.createElement(Popper_1.Popper, { trigger: children, reference: reference, popper: content, popperMatchesTriggerWidth: false, appendTo: appendTo, isVisible: visible, positionModifiers: positionModifiers, distance: distance, placement: position, onTriggerClick: onTriggerClick, onTriggerEnter: onTriggerEnter, onDocumentClick: onDocumentClick, onDocumentKeyDown: onDocumentKeyDown, enableFlip: enableFlip, zIndex: zIndex, flipBehavior: flipBehavior }));
};
exports.Popover.displayName = 'Popover';
//# sourceMappingURL=Popover.js.map