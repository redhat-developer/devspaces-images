import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FindRefWrapper } from './FindRefWrapper';
import { usePopper } from './thirdparty/react-popper/usePopper';
import { css } from '@patternfly/react-styles';
import '@patternfly/react-styles/css/components/Popper/Popper.css';
const hash = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' };
const getOppositePlacement = (placement) => placement.replace(/left|right|bottom|top/g, (matched) => hash[matched]);
export const getOpacityTransition = (animationDuration) => `opacity ${animationDuration}ms cubic-bezier(.54, 1.5, .38, 1.11)`;
export const Popper = ({ trigger, popper, popperMatchesTriggerWidth = true, direction = 'down', position = 'left', placement, appendTo = () => document.body, zIndex = 9999, isVisible = true, positionModifiers, distance = 0, onMouseEnter, onMouseLeave, onFocus, onBlur, onDocumentClick, onTriggerClick, onTriggerEnter, onPopperClick, onDocumentKeyDown, enableFlip = true, flipBehavior = 'flip', reference }) => {
    const [triggerElement, setTriggerElement] = React.useState(null);
    const [refElement, setRefElement] = React.useState(null);
    const [popperElement, setPopperElement] = React.useState(null);
    const [ready, setReady] = React.useState(false);
    const refOrTrigger = refElement || triggerElement;
    const onDocumentClickCallback = React.useCallback(event => onDocumentClick(event, refOrTrigger, popperElement), [
        isVisible,
        triggerElement,
        refElement,
        popperElement,
        onDocumentClick
    ]);
    React.useEffect(() => {
        setReady(true);
    }, []);
    React.useEffect(() => {
        if (reference) {
            if (reference.current) {
                setRefElement(reference.current);
            }
            else if (typeof reference === 'function') {
                setRefElement(reference());
            }
        }
    }, [reference]);
    const addEventListener = (listener, element, event) => {
        if (listener && element) {
            element.addEventListener(event, listener);
        }
    };
    const removeEventListener = (listener, element, event) => {
        if (listener && element) {
            element.removeEventListener(event, listener);
        }
    };
    React.useEffect(() => {
        addEventListener(onMouseEnter, refOrTrigger, 'mouseenter');
        addEventListener(onMouseLeave, refOrTrigger, 'mouseleave');
        addEventListener(onFocus, refOrTrigger, 'focus');
        addEventListener(onBlur, refOrTrigger, 'blur');
        addEventListener(onTriggerClick, refOrTrigger, 'click');
        addEventListener(onTriggerEnter, refOrTrigger, 'keydown');
        addEventListener(onPopperClick, popperElement, 'click');
        onDocumentClick && addEventListener(onDocumentClickCallback, document, 'click');
        addEventListener(onDocumentKeyDown, document, 'keydown');
        return () => {
            removeEventListener(onMouseEnter, refOrTrigger, 'mouseenter');
            removeEventListener(onMouseLeave, refOrTrigger, 'mouseleave');
            removeEventListener(onFocus, refOrTrigger, 'focus');
            removeEventListener(onBlur, refOrTrigger, 'blur');
            removeEventListener(onTriggerClick, refOrTrigger, 'click');
            removeEventListener(onTriggerEnter, refOrTrigger, 'keydown');
            removeEventListener(onPopperClick, popperElement, 'click');
            onDocumentClick && removeEventListener(onDocumentClickCallback, document, 'click');
            removeEventListener(onDocumentKeyDown, document, 'keydown');
        };
    }, [
        triggerElement,
        popperElement,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
        onTriggerClick,
        onTriggerEnter,
        onPopperClick,
        onDocumentClick,
        onDocumentKeyDown,
        refElement
    ]);
    const getPlacement = () => {
        if (placement) {
            return placement;
        }
        let convertedPlacement = direction === 'up' ? 'top' : 'bottom';
        if (position !== 'center') {
            convertedPlacement = `${convertedPlacement}-${position === 'right' ? 'end' : 'start'}`;
        }
        return convertedPlacement;
    };
    const getPlacementMemo = React.useMemo(getPlacement, [direction, position, placement]);
    const getOppositePlacementMemo = React.useMemo(() => getOppositePlacement(getPlacement()), [
        direction,
        position,
        placement
    ]);
    const sameWidthMod = React.useMemo(() => ({
        name: 'sameWidth',
        enabled: popperMatchesTriggerWidth,
        phase: 'beforeWrite',
        requires: ['computeStyles'],
        fn: ({ state }) => {
            state.styles.popper.width = `${state.rects.reference.width}px`;
        },
        effect: ({ state }) => {
            state.elements.popper.style.width = `${state.elements.reference.offsetWidth}px`;
            return () => { };
        }
    }), [popperMatchesTriggerWidth]);
    const { styles: popperStyles, attributes } = usePopper(refOrTrigger, popperElement, {
        placement: getPlacementMemo,
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: [0, distance]
                }
            },
            {
                name: 'preventOverflow',
                enabled: false
            },
            {
                // adds attribute [data-popper-reference-hidden] to the popper element which can be used to hide it using CSS
                name: 'hide',
                enabled: true
            },
            {
                name: 'flip',
                enabled: getPlacementMemo.startsWith('auto') || enableFlip,
                options: {
                    fallbackPlacements: flipBehavior === 'flip' ? [getOppositePlacementMemo] : flipBehavior
                }
            },
            sameWidthMod
        ]
    });
    const modifierFromPopperPosition = () => {
        if (attributes && attributes.popper && attributes.popper['data-popper-placement']) {
            const popperPlacement = attributes.popper['data-popper-placement'];
            if (popperPlacement.startsWith('top')) {
                return positionModifiers.top || '';
            }
            else if (popperPlacement.startsWith('bottom')) {
                return positionModifiers.bottom || '';
            }
            else if (popperPlacement.startsWith('left')) {
                return positionModifiers.left || '';
            }
            else if (popperPlacement.startsWith('right')) {
                return positionModifiers.right || '';
            }
        }
        return positionModifiers.top;
    };
    const menuWithPopper = React.cloneElement(popper, Object.assign({ className: css(popper.props && popper.props.className, positionModifiers && modifierFromPopperPosition()), style: Object.assign(Object.assign(Object.assign({}, ((popper.props && popper.props.style) || {})), popperStyles.popper), { zIndex }) }, attributes.popper));
    const getTarget = () => {
        if (typeof appendTo === 'function') {
            return appendTo();
        }
        return appendTo;
    };
    return (React.createElement(React.Fragment, null,
        !reference && trigger && (React.createElement(FindRefWrapper, { onFoundRef: (foundRef) => setTriggerElement(foundRef) }, trigger)),
        ready &&
            isVisible &&
            ReactDOM.createPortal(React.createElement(FindRefWrapper, { onFoundRef: (foundRef) => setPopperElement(foundRef) }, menuWithPopper), getTarget())));
};
Popper.displayName = 'Popper';
//# sourceMappingURL=Popper.js.map