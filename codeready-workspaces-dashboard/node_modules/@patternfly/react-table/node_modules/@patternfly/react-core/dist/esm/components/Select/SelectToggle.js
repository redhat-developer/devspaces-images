import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Select/select';
import buttonStyles from '@patternfly/react-styles/css/components/Button/button';
import { css } from '@patternfly/react-styles';
import CaretDownIcon from "@patternfly/react-icons/dist/esm/icons/caret-down-icon";
import { KeyTypes, SelectVariant } from './selectConstants';
export class SelectToggle extends React.Component {
    constructor(props) {
        super(props);
        this.onDocClick = (event) => {
            const { parentRef, menuRef, isOpen, onToggle, onClose } = this.props;
            const clickedOnToggle = parentRef && parentRef.current && parentRef.current.contains(event.target);
            const clickedWithinMenu = menuRef && menuRef.current && menuRef.current.contains && menuRef.current.contains(event.target);
            if (isOpen && !(clickedOnToggle || clickedWithinMenu)) {
                onToggle(false);
                onClose();
            }
        };
        this.findTabbableFooterElements = () => {
            const tabbable = this.props.footerRef.current.querySelectorAll('input, button, select, textarea, a[href]');
            const list = Array.prototype.filter.call(tabbable, function (item) {
                return item.tabIndex >= '0';
            });
            return list;
        };
        this.handleGlobalKeys = (event) => {
            const { parentRef, menuRef, hasFooter, isOpen, variant, onToggle, onClose } = this.props;
            const escFromToggle = parentRef && parentRef.current && parentRef.current.contains(event.target);
            const escFromWithinMenu = menuRef && menuRef.current && menuRef.current.contains && menuRef.current.contains(event.target);
            if (isOpen &&
                event.key === KeyTypes.Tab &&
                (variant === SelectVariant.typeahead || variant === SelectVariant.typeaheadMulti)) {
                this.props.handleTypeaheadKeys('tab');
                event.preventDefault();
                return;
            }
            if (isOpen && event.key === KeyTypes.Tab && hasFooter) {
                const tabbableItems = this.findTabbableFooterElements();
                // If no tabbable item in footer close select
                if (tabbableItems.length <= 0) {
                    onToggle(false);
                    onClose();
                    this.toggle.current.focus();
                    return;
                }
                else {
                    // if current element is not in footer, tab to first tabbable element in footer
                    const currentElementIndex = tabbableItems.findIndex(item => item === document.activeElement);
                    if (currentElementIndex === -1) {
                        tabbableItems[0].focus();
                        return;
                    }
                    // Current element is in footer.
                    if (event.shiftKey) {
                        return;
                    }
                    // Tab to next element in footer or close if there are none
                    if (currentElementIndex + 1 < tabbableItems.length) {
                        tabbableItems[currentElementIndex + 1].focus();
                    }
                    else {
                        // no more footer items close menu
                        onToggle(false);
                        onClose();
                        this.toggle.current.focus();
                    }
                    event.preventDefault();
                    return;
                }
            }
            if (isOpen &&
                (event.key === KeyTypes.Escape || event.key === KeyTypes.Tab) &&
                (escFromToggle || escFromWithinMenu)) {
                onToggle(false);
                onClose();
                this.toggle.current.focus();
            }
        };
        this.onKeyDown = (event) => {
            const { isOpen, onToggle, variant, onClose, onEnter, handleTypeaheadKeys } = this.props;
            if (variant === SelectVariant.typeahead || variant === SelectVariant.typeaheadMulti) {
                if (event.key === KeyTypes.ArrowDown || event.key === KeyTypes.ArrowUp) {
                    handleTypeaheadKeys((event.key === KeyTypes.ArrowDown && 'down') || (event.key === KeyTypes.ArrowUp && 'up'));
                    event.preventDefault();
                }
                else if (event.key === KeyTypes.Enter) {
                    if (isOpen) {
                        handleTypeaheadKeys('enter');
                    }
                    else {
                        onToggle(!isOpen);
                    }
                }
            }
            if (variant === SelectVariant.typeahead ||
                variant === SelectVariant.typeaheadMulti ||
                (event.key === KeyTypes.Tab && !isOpen) ||
                (event.key !== KeyTypes.Enter && event.key !== KeyTypes.Space)) {
                return;
            }
            event.preventDefault();
            if ((event.key === KeyTypes.Tab || event.key === KeyTypes.Enter || event.key === KeyTypes.Space) && isOpen) {
                onToggle(!isOpen);
                onClose();
                this.toggle.current.focus();
            }
            else if ((event.key === KeyTypes.Enter || event.key === KeyTypes.Space) && !isOpen) {
                onToggle(!isOpen);
                onEnter();
            }
        };
        const { variant } = props;
        const isTypeahead = variant === SelectVariant.typeahead || variant === SelectVariant.typeaheadMulti;
        this.toggle = isTypeahead ? React.createRef() : React.createRef();
    }
    componentDidMount() {
        document.addEventListener('click', this.onDocClick);
        document.addEventListener('touchstart', this.onDocClick);
        document.addEventListener('keydown', this.handleGlobalKeys);
    }
    componentWillUnmount() {
        document.removeEventListener('click', this.onDocClick);
        document.removeEventListener('touchstart', this.onDocClick);
        document.removeEventListener('keydown', this.handleGlobalKeys);
    }
    render() {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const _a = this.props, { className, children, isOpen, isActive, isPlain, isDisabled, variant, onToggle, onEnter, onClose, onClickTypeaheadToggleButton, handleTypeaheadKeys, parentRef, menuRef, id, type, hasClearButton, 'aria-labelledby': ariaLabelledBy, 'aria-label': ariaLabel, hasFooter, footerRef } = _a, props = __rest(_a, ["className", "children", "isOpen", "isActive", "isPlain", "isDisabled", "variant", "onToggle", "onEnter", "onClose", "onClickTypeaheadToggleButton", "handleTypeaheadKeys", "parentRef", "menuRef", "id", "type", "hasClearButton", 'aria-labelledby', 'aria-label', "hasFooter", "footerRef"]);
        /* eslint-enable @typescript-eslint/no-unused-vars */
        const isTypeahead = variant === SelectVariant.typeahead || variant === SelectVariant.typeaheadMulti || hasClearButton;
        const toggleProps = {
            id,
            'aria-labelledby': ariaLabelledBy,
            'aria-expanded': isOpen,
            'aria-haspopup': (variant !== SelectVariant.checkbox && 'listbox') || null
        };
        return (React.createElement(React.Fragment, null,
            !isTypeahead && (React.createElement("button", Object.assign({}, props, toggleProps, { ref: this.toggle, type: type, className: css(styles.selectToggle, isDisabled && styles.modifiers.disabled, isPlain && styles.modifiers.plain, isActive && styles.modifiers.active, className), 
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onClick: _event => {
                    onToggle(!isOpen);
                    if (isOpen) {
                        onClose();
                    }
                }, onKeyDown: this.onKeyDown, disabled: isDisabled }),
                children,
                React.createElement("span", { className: css(styles.selectToggleArrow) },
                    React.createElement(CaretDownIcon, null)))),
            isTypeahead && (React.createElement("div", Object.assign({}, props, { ref: this.toggle, className: css(styles.selectToggle, isDisabled && styles.modifiers.disabled, isPlain && styles.modifiers.plain, isTypeahead && styles.modifiers.typeahead, className), 
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onClick: _event => {
                    if (!isDisabled) {
                        onToggle(true);
                    }
                }, onKeyDown: this.onKeyDown }),
                children,
                React.createElement("button", Object.assign({}, toggleProps, { type: type, className: css(buttonStyles.button, styles.selectToggleButton, styles.modifiers.plain), "aria-label": ariaLabel, onClick: _event => {
                        _event.stopPropagation();
                        onToggle(!isOpen);
                        if (isOpen) {
                            onClose();
                        }
                        onClickTypeaheadToggleButton();
                    } }, ((variant === SelectVariant.typeahead || variant === SelectVariant.typeaheadMulti) && {
                    tabIndex: -1
                }), { disabled: isDisabled }),
                    React.createElement(CaretDownIcon, { className: css(styles.selectToggleArrow) }))))));
    }
}
SelectToggle.displayName = 'SelectToggle';
SelectToggle.defaultProps = {
    className: '',
    isOpen: false,
    isActive: false,
    isPlain: false,
    isDisabled: false,
    hasClearButton: false,
    hasFooter: false,
    variant: 'single',
    'aria-labelledby': '',
    'aria-label': '',
    type: 'button',
    onToggle: () => { },
    onEnter: () => { },
    onClose: () => { },
    onClickTypeaheadToggleButton: () => { }
};
//# sourceMappingURL=SelectToggle.js.map