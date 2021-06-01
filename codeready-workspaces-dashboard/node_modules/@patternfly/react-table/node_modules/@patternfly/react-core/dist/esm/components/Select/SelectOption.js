import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Select/select';
import checkStyles from '@patternfly/react-styles/css/components/Check/check';
import { css } from '@patternfly/react-styles';
import CheckIcon from "@patternfly/react-icons/dist/esm/icons/check-icon";
import { SelectConsumer, SelectVariant, KeyTypes } from './selectConstants';
import StarIcon from "@patternfly/react-icons/dist/esm/icons/star-icon";
import { getUniqueId } from '../../helpers/util';
export class SelectOption extends React.Component {
    constructor() {
        super(...arguments);
        this.ref = React.createRef();
        this.liRef = React.createRef();
        this.favoriteRef = React.createRef();
        this.onKeyDown = (event, innerIndex, onEnter, isCheckbox) => {
            const { index, keyHandler } = this.props;
            if (event.key === KeyTypes.Tab) {
                // More modal-like experience for checkboxes
                if (isCheckbox) {
                    if (event.shiftKey) {
                        keyHandler(index, innerIndex, 'up');
                    }
                    else {
                        keyHandler(index, innerIndex, 'down');
                    }
                    event.stopPropagation();
                }
                else {
                    keyHandler(index, innerIndex, 'tab');
                }
            }
            event.preventDefault();
            if (event.key === KeyTypes.ArrowUp) {
                keyHandler(index, innerIndex, 'up');
            }
            else if (event.key === KeyTypes.ArrowDown) {
                keyHandler(index, innerIndex, 'down');
            }
            else if (event.key === KeyTypes.ArrowLeft) {
                keyHandler(index, innerIndex, 'left');
            }
            else if (event.key === KeyTypes.ArrowRight) {
                keyHandler(index, innerIndex, 'right');
            }
            else if (event.key === KeyTypes.Enter) {
                if (onEnter !== undefined) {
                    onEnter();
                }
                else {
                    this.ref.current.click();
                }
            }
        };
    }
    componentDidMount() {
        this.props.sendRef(this.props.isDisabled ? null : this.ref.current, this.props.isDisabled ? null : this.favoriteRef.current, this.props.isDisabled ? null : this.liRef.current, this.props.index);
    }
    componentDidUpdate() {
        this.props.sendRef(this.props.isDisabled ? null : this.ref.current, this.props.isDisabled ? null : this.favoriteRef.current, this.props.isDisabled ? null : this.liRef.current, this.props.index);
    }
    render() {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const _a = this.props, { children, className, id, description, itemCount, value, onClick, isDisabled, isPlaceholder, isNoResultsOption, isSelected, isChecked, isFocused, sendRef, keyHandler, index, component, inputId, isFavorite, ariaIsFavoriteLabel = 'starred', ariaIsNotFavoriteLabel = 'not starred', isLoad, isLoading } = _a, props = __rest(_a, ["children", "className", "id", "description", "itemCount", "value", "onClick", "isDisabled", "isPlaceholder", "isNoResultsOption", "isSelected", "isChecked", "isFocused", "sendRef", "keyHandler", "index", "component", "inputId", "isFavorite", "ariaIsFavoriteLabel", "ariaIsNotFavoriteLabel", "isLoad", "isLoading"]);
        /* eslint-enable @typescript-eslint/no-unused-vars */
        const Component = component;
        if (!id && isFavorite !== null) {
            // eslint-disable-next-line no-console
            console.error('Please provide an id to use the favorites feature.');
        }
        const generatedId = id || getUniqueId('select-option');
        const favoriteButton = (onFavorite) => (React.createElement("button", { className: css(styles.selectMenuItem, styles.modifiers.action, styles.modifiers.favoriteAction), "aria-label": isFavorite ? ariaIsFavoriteLabel : ariaIsNotFavoriteLabel, onClick: () => {
                onFavorite(generatedId.replace('favorite-', ''), isFavorite);
            }, onKeyDown: event => {
                this.onKeyDown(event, 1, () => onFavorite(generatedId.replace('favorite-', '')));
            }, ref: this.favoriteRef },
            React.createElement("span", { className: css(styles.selectMenuItemActionIcon) },
                React.createElement(StarIcon, null))));
        const itemDisplay = itemCount ? (React.createElement("span", { className: css(styles.selectMenuItemRow) },
            React.createElement("span", { className: css(styles.selectMenuItemText) }, children || value.toString()),
            React.createElement("span", { className: css(styles.selectMenuItemCount) }, itemCount))) : (children || value.toString());
        return (React.createElement(SelectConsumer, null, ({ onSelect, onClose, variant, inputIdPrefix, onFavorite }) => (React.createElement(React.Fragment, null,
            variant !== SelectVariant.checkbox && (React.createElement("li", { id: generatedId, role: "presentation", className: css(isLoading && styles.selectListItem, !isLoad && !isLoading && styles.selectMenuWrapper, isFavorite && styles.modifiers.favorite, isFocused && styles.modifiers.focus, isLoading && styles.modifiers.loading), ref: this.liRef },
                isLoading && children,
                !isLoading && (React.createElement(React.Fragment, null,
                    React.createElement(Component, Object.assign({}, props, { className: css(styles.selectMenuItem, isLoad && styles.modifiers.load, isSelected && styles.modifiers.selected, isDisabled && styles.modifiers.disabled, description && styles.modifiers.description, isFavorite !== null && styles.modifiers.link, className), onClick: (event) => {
                            if (isLoad) {
                                onClick(event);
                                event.stopPropagation();
                            }
                            else if (!isDisabled && !isLoading) {
                                onClick(event);
                                onSelect(event, value, isPlaceholder);
                                onClose();
                            }
                        }, role: "option", "aria-selected": isSelected || null, ref: this.ref, onKeyDown: (event) => {
                            this.onKeyDown(event, 0);
                        }, type: "button" }),
                        description && (React.createElement(React.Fragment, null,
                            React.createElement("span", { className: css(styles.selectMenuItemMain) },
                                itemDisplay,
                                isSelected && (React.createElement("span", { className: css(styles.selectMenuItemIcon) },
                                    React.createElement(CheckIcon, { "aria-hidden": true })))),
                            React.createElement("span", { className: css(styles.selectMenuItemDescription) }, description))),
                        !description && (React.createElement(React.Fragment, null,
                            itemDisplay,
                            isSelected && (React.createElement("span", { className: css(styles.selectMenuItemIcon) },
                                React.createElement(CheckIcon, { "aria-hidden": true })))))),
                    isFavorite !== null && id && favoriteButton(onFavorite))))),
            variant === SelectVariant.checkbox && isLoad && (React.createElement("button", { className: css(styles.selectMenuItem, styles.modifiers.load, isFocused && styles.modifiers.focus, className), onKeyDown: (event) => {
                    this.onKeyDown(event, 0, undefined, true);
                }, onClick: (event) => {
                    onClick(event);
                    event.stopPropagation();
                }, ref: this.ref }, children || value.toString())),
            variant === SelectVariant.checkbox && isLoading && (React.createElement("div", { className: css(styles.selectListItem, isLoading && styles.modifiers.loading, className) }, children)),
            variant === SelectVariant.checkbox && !isNoResultsOption && !isLoading && !isLoad && (React.createElement("label", Object.assign({}, props, { className: css(checkStyles.check, styles.selectMenuItem, isDisabled && styles.modifiers.disabled, description && styles.modifiers.description, className), onKeyDown: (event) => {
                    this.onKeyDown(event, 0, undefined, true);
                } }),
                React.createElement("input", { id: inputId || `${inputIdPrefix}-${value.toString()}`, className: css(checkStyles.checkInput), type: "checkbox", onChange: event => {
                        if (!isDisabled) {
                            onClick(event);
                            onSelect(event, value);
                        }
                    }, ref: this.ref, checked: isChecked || false, disabled: isDisabled }),
                React.createElement("span", { className: css(checkStyles.checkLabel, isDisabled && styles.modifiers.disabled) }, itemDisplay),
                description && React.createElement("div", { className: css(checkStyles.checkDescription) }, description))),
            variant === SelectVariant.checkbox && isNoResultsOption && !isLoading && !isLoad && (React.createElement("div", null,
                React.createElement(Component, Object.assign({}, props, { className: css(styles.selectMenuItem, isSelected && styles.modifiers.selected, isDisabled && styles.modifiers.disabled, className), role: "option", "aria-selected": isSelected || null, ref: this.ref, onKeyDown: (event) => {
                        this.onKeyDown(event, 0, undefined, true);
                    }, type: "button" }), itemDisplay)))))));
    }
}
SelectOption.displayName = 'SelectOption';
SelectOption.defaultProps = {
    className: '',
    value: '',
    index: 0,
    isDisabled: false,
    isPlaceholder: false,
    isSelected: false,
    isChecked: false,
    isNoResultsOption: false,
    component: 'button',
    onClick: () => { },
    sendRef: () => { },
    keyHandler: () => { },
    inputId: '',
    isFavorite: null,
    isLoad: false,
    isLoading: false
};
//# sourceMappingURL=SelectOption.js.map