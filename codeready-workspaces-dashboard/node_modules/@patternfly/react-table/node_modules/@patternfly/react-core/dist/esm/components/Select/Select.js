import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Select/select';
import badgeStyles from '@patternfly/react-styles/css/components/Badge/badge';
import formStyles from '@patternfly/react-styles/css/components/FormControl/form-control';
import buttonStyles from '@patternfly/react-styles/css/components/Button/button';
import { css } from '@patternfly/react-styles';
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import { SelectMenu } from './SelectMenu';
import { SelectOption } from './SelectOption';
import { SelectGroup } from './SelectGroup';
import { SelectToggle } from './SelectToggle';
import { SelectContext, SelectVariant, SelectDirection, KeyTypes } from './selectConstants';
import { Chip, ChipGroup } from '../ChipGroup';
import { Spinner } from '../Spinner';
import { keyHandler, getNextIndex, getOUIAProps, getDefaultOUIAId, GenerateId } from '../../helpers';
import { Divider } from '../Divider';
import { Popper } from '../../helpers/Popper/Popper';
import { createRenderableFavorites, extendItemsWithFavorite } from '../../helpers/favorites';
import { ValidatedOptions } from '../../helpers/constants';
// seed for the aria-labelledby ID
let currentId = 0;
export class Select extends React.Component {
    constructor() {
        super(...arguments);
        this.parentRef = React.createRef();
        this.menuComponentRef = React.createRef();
        this.filterRef = React.createRef();
        this.clearRef = React.createRef();
        this.inputRef = React.createRef();
        this.refCollection = [[]];
        this.optionContainerRefCollection = [];
        this.footerRef = React.createRef();
        this.state = {
            openedOnEnter: false,
            typeaheadInputValue: null,
            typeaheadFilteredChildren: React.Children.toArray(this.props.children),
            favoritesGroup: [],
            typeaheadCurrIndex: -1,
            typeaheadStoredIndex: -1,
            creatableValue: '',
            tabbedIntoFavoritesMenu: false,
            ouiaStateId: getDefaultOUIAId(Select.displayName, this.props.variant)
        };
        this.getTypeaheadActiveChild = (typeaheadCurrIndex) => this.refCollection[typeaheadCurrIndex] ? this.refCollection[typeaheadCurrIndex][0] : null;
        this.componentDidUpdate = (prevProps, prevState) => {
            if (this.props.hasInlineFilter) {
                this.refCollection[0][0] = this.filterRef.current;
            }
            if (!prevState.openedOnEnter && this.state.openedOnEnter && !this.props.customContent) {
                const firstRef = this.refCollection.find(ref => ref !== null);
                if (firstRef && firstRef[0]) {
                    firstRef[0].focus();
                }
            }
            if (prevProps.children !== this.props.children) {
                this.updateTypeAheadFilteredChildren(prevState.typeaheadInputValue || '', null);
            }
            if (this.props.onFavorite &&
                (this.props.favorites.length !== prevProps.favorites.length ||
                    this.state.typeaheadFilteredChildren !== prevState.typeaheadFilteredChildren)) {
                const tempRenderableChildren = this.props.variant === 'typeahead' || this.props.variant === 'typeaheadmulti'
                    ? this.state.typeaheadFilteredChildren
                    : this.props.children;
                const renderableFavorites = createRenderableFavorites(tempRenderableChildren, this.props.isGrouped, this.props.favorites);
                const favoritesGroup = renderableFavorites.length
                    ? [
                        React.createElement(SelectGroup, { key: "favorites", label: this.props.favoritesLabel }, renderableFavorites),
                        React.createElement(Divider, { key: "favorites-group-divider" })
                    ]
                    : [];
                this.setState({ favoritesGroup });
            }
        };
        this.onEnter = () => {
            this.setState({ openedOnEnter: true });
        };
        this.onToggle = (isExpanded) => {
            const { isInputValuePersisted, onSelect, onToggle } = this.props;
            if (!isExpanded && isInputValuePersisted && onSelect) {
                onSelect(undefined, this.inputRef && this.inputRef.current ? this.inputRef.current.value : '');
            }
            onToggle(isExpanded);
        };
        this.onClose = () => {
            this.setState({
                openedOnEnter: false,
                typeaheadInputValue: null,
                typeaheadFilteredChildren: React.Children.toArray(this.props.children),
                typeaheadCurrIndex: -1,
                tabbedIntoFavoritesMenu: false
            });
        };
        this.onChange = (e) => {
            if (e.target.value.toString() !== '' && !this.props.isOpen) {
                this.onToggle(true);
            }
            if (this.props.onTypeaheadInputChanged) {
                this.props.onTypeaheadInputChanged(e.target.value.toString());
            }
            this.setState({
                typeaheadCurrIndex: -1,
                typeaheadInputValue: e.target.value,
                creatableValue: e.target.value
            });
            this.updateTypeAheadFilteredChildren(e.target.value.toString(), e);
            this.refCollection = [[]];
        };
        this.updateTypeAheadFilteredChildren = (typeaheadInputValue, e) => {
            let typeaheadFilteredChildren;
            const { onFilter, isCreatable, onCreateOption, createText, noResultsFoundText, children, isGrouped } = this.props;
            if (onFilter) {
                /* The updateTypeAheadFilteredChildren callback is not only called on input changes but also when the children change.
                 * In this case the e is null but we can get the typeaheadInputValue from the state.
                 */
                typeaheadFilteredChildren = onFilter(e, e ? e.target.value : typeaheadInputValue) || children;
            }
            else {
                let input;
                try {
                    input = new RegExp(typeaheadInputValue.toString(), 'i');
                }
                catch (err) {
                    input = new RegExp(typeaheadInputValue.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                }
                const childrenArray = React.Children.toArray(children);
                if (isGrouped) {
                    const childFilter = (child) => child.props.value && this.getDisplay(child.props.value.toString(), 'text').search(input) === 0;
                    typeaheadFilteredChildren =
                        typeaheadInputValue.toString() !== ''
                            ? React.Children.map(children, group => {
                                if (group.type === SelectGroup) {
                                    const filteredGroupChildren = React.Children.toArray(group.props.children).filter(childFilter);
                                    if (filteredGroupChildren.length > 0) {
                                        return React.cloneElement(group, {
                                            titleId: group.props.label && group.props.label.replace(/\W/g, '-'),
                                            children: filteredGroupChildren
                                        });
                                    }
                                }
                                else {
                                    return React.Children.toArray(group).filter(childFilter);
                                }
                            })
                            : childrenArray;
                }
                else {
                    typeaheadFilteredChildren =
                        typeaheadInputValue.toString() !== ''
                            ? childrenArray.filter(child => {
                                const valueToCheck = child.props.value;
                                // Dividers don't have value and should not be filtered
                                if (!valueToCheck) {
                                    return true;
                                }
                                const isSelectOptionObject = typeof valueToCheck !== 'string' &&
                                    valueToCheck.toString &&
                                    valueToCheck.compareTo;
                                if (isSelectOptionObject) {
                                    return valueToCheck.compareTo(typeaheadInputValue);
                                }
                                else {
                                    return this.getDisplay(child.props.value.toString(), 'text').search(input) === 0;
                                }
                            })
                            : childrenArray;
                }
            }
            if (!typeaheadFilteredChildren) {
                typeaheadFilteredChildren = [];
            }
            if (typeaheadFilteredChildren.length === 0) {
                !isCreatable &&
                    typeaheadFilteredChildren.push(React.createElement(SelectOption, { isDisabled: true, key: 0, value: noResultsFoundText, isNoResultsOption: true }));
            }
            if (isCreatable && typeaheadInputValue !== '') {
                const newValue = typeaheadInputValue;
                typeaheadFilteredChildren.push(React.createElement(SelectOption, { key: 0, value: newValue, onClick: () => onCreateOption && onCreateOption(newValue) },
                    createText,
                    " \"",
                    newValue,
                    "\""));
            }
            this.setState({
                typeaheadFilteredChildren
            });
        };
        this.onClick = (e) => {
            if (!this.props.isOpen) {
                this.onToggle(true);
            }
            e.stopPropagation();
        };
        this.clearSelection = (e) => {
            e.stopPropagation();
            this.setState({
                typeaheadInputValue: null,
                typeaheadFilteredChildren: React.Children.toArray(this.props.children),
                typeaheadCurrIndex: -1
            });
        };
        this.sendRef = (optionRef, favoriteRef, optionContainerRef, index) => {
            this.refCollection[index] = [optionRef, favoriteRef];
            this.optionContainerRefCollection[index] = optionContainerRef;
        };
        this.handleMenuKeys = (index, innerIndex, position) => {
            keyHandler(index, innerIndex, position, this.refCollection, this.refCollection);
            if (this.props.variant === SelectVariant.typeahead || this.props.variant === SelectVariant.typeaheadMulti) {
                if (position !== 'tab') {
                    this.handleTypeaheadKeys(position);
                }
            }
        };
        this.moveFocus = (nextIndex, updateCurrentIndex = true) => {
            const { isCreatable, createText } = this.props;
            const hasDescriptionElm = Boolean(this.refCollection[nextIndex][0] && this.refCollection[nextIndex][0].classList.contains('pf-m-description'));
            const optionTextElm = hasDescriptionElm
                ? this.refCollection[nextIndex][0].firstElementChild
                : this.refCollection[nextIndex][0];
            let typeaheadInputValue = '';
            if (isCreatable && optionTextElm.innerText.includes(createText)) {
                typeaheadInputValue = this.state.creatableValue;
            }
            else if (optionTextElm) {
                typeaheadInputValue = optionTextElm.innerText;
            }
            this.setState(prevState => ({
                typeaheadCurrIndex: updateCurrentIndex ? nextIndex : prevState.typeaheadCurrIndex,
                typeaheadStoredIndex: nextIndex,
                typeaheadInputValue
            }));
        };
        this.handleTypeaheadKeys = (position) => {
            const { isOpen, onFavorite } = this.props;
            const { typeaheadCurrIndex, tabbedIntoFavoritesMenu, typeaheadStoredIndex } = this.state;
            const typeaheadActiveChild = this.getTypeaheadActiveChild(typeaheadCurrIndex);
            if (isOpen) {
                if (position === 'enter') {
                    if (typeaheadActiveChild || (this.refCollection[0] && this.refCollection[0][0])) {
                        this.setState({
                            typeaheadInputValue: (typeaheadActiveChild && typeaheadActiveChild.innerText) || this.refCollection[0][0].innerText
                        });
                        if (typeaheadActiveChild) {
                            typeaheadActiveChild.click();
                        }
                        else {
                            this.refCollection[0][0].click();
                        }
                    }
                }
                else if (position === 'tab') {
                    if (onFavorite) {
                        if (this.inputRef.current === document.activeElement) {
                            let indexForFocus = 0;
                            if (typeaheadCurrIndex !== -1) {
                                indexForFocus = typeaheadCurrIndex;
                            }
                            else if (typeaheadStoredIndex !== -1) {
                                indexForFocus = typeaheadStoredIndex;
                            }
                            if (this.refCollection[indexForFocus] !== null && this.refCollection[indexForFocus][0] !== null) {
                                this.refCollection[indexForFocus][0].focus();
                            }
                            else {
                                this.clearRef.current.focus();
                            }
                            this.setState({
                                tabbedIntoFavoritesMenu: true,
                                typeaheadCurrIndex: -1
                            });
                        }
                        else {
                            this.inputRef.current.focus();
                            this.setState({ tabbedIntoFavoritesMenu: false });
                        }
                    }
                    else {
                        this.onToggle(false);
                    }
                }
                else if (!tabbedIntoFavoritesMenu) {
                    let nextIndex;
                    if (typeaheadCurrIndex === -1 && position === 'down') {
                        nextIndex = 0;
                    }
                    else if (typeaheadCurrIndex === -1 && position === 'up') {
                        nextIndex = this.refCollection.length - 1;
                    }
                    else if (position !== 'left' && position !== 'right') {
                        nextIndex = getNextIndex(typeaheadCurrIndex, position, this.refCollection);
                    }
                    else {
                        nextIndex = typeaheadCurrIndex;
                    }
                    if (this.refCollection[nextIndex] === null) {
                        return;
                    }
                    this.moveFocus(nextIndex);
                }
                else {
                    const nextIndex = this.refCollection.findIndex(ref => ref !== undefined && (ref[0] === document.activeElement || ref[1] === document.activeElement));
                    this.moveFocus(nextIndex);
                }
            }
        };
        this.onClickTypeaheadToggleButton = () => {
            if (this.inputRef && this.inputRef.current) {
                this.inputRef.current.focus();
            }
        };
        this.getDisplay = (value, type = 'node') => {
            if (!value) {
                return;
            }
            const item = this.props.isGrouped
                ? React.Children.toArray(this.props.children)
                    .reduce((acc, curr) => [...acc, ...React.Children.toArray(curr.props.children)], [])
                    .find(child => child.props.value.toString() === value.toString())
                : React.Children.toArray(this.props.children).find(child => child.props.value &&
                    child.props.value.toString() === value.toString());
            if (item) {
                if (item && item.props.children) {
                    if (type === 'node') {
                        return item.props.children;
                    }
                    return this.findText(item);
                }
                return item.props.value.toString();
            }
            return value.toString();
        };
        this.findText = (item) => {
            if (typeof item === 'string') {
                return item;
            }
            else if (!React.isValidElement(item)) {
                return '';
            }
            else {
                const multi = [];
                React.Children.toArray(item.props.children).forEach(child => multi.push(this.findText(child)));
                return multi.join('');
            }
        };
        this.generateSelectedBadge = () => {
            const { customBadgeText, selections } = this.props;
            if (customBadgeText !== null) {
                return customBadgeText;
            }
            if (Array.isArray(selections) && selections.length > 0) {
                return selections.length;
            }
            return null;
        };
    }
    extendTypeaheadChildren(typeaheadCurrIndex, favoritesGroup) {
        const { isGrouped, onFavorite } = this.props;
        const typeaheadChildren = favoritesGroup
            ? favoritesGroup.concat(this.state.typeaheadFilteredChildren)
            : this.state.typeaheadFilteredChildren;
        const activeElement = this.optionContainerRefCollection[typeaheadCurrIndex];
        let typeaheadActiveChild = this.getTypeaheadActiveChild(typeaheadCurrIndex);
        if (typeaheadActiveChild && typeaheadActiveChild.classList.contains('pf-m-description')) {
            typeaheadActiveChild = typeaheadActiveChild.firstElementChild;
        }
        this.refCollection = [[]];
        this.optionContainerRefCollection = [];
        if (isGrouped) {
            return React.Children.map(typeaheadChildren, (group) => {
                if (group.type === Divider) {
                    return group;
                }
                else if (group.type === SelectGroup && onFavorite) {
                    return React.cloneElement(group, {
                        titleId: group.props.label && group.props.label.replace(/\W/g, '-'),
                        children: React.Children.map(group.props.children, (child) => child.type === Divider
                            ? child
                            : React.cloneElement(child, {
                                isFocused: activeElement &&
                                    (activeElement.id === child.props.id ||
                                        (this.props.isCreatable &&
                                            typeaheadActiveChild.innerText ===
                                                `{createText} "${group.props.value}"`))
                            }))
                    });
                }
                else if (group.type === SelectGroup) {
                    return React.cloneElement(group, {
                        titleId: group.props.label && group.props.label.replace(/\W/g, '-'),
                        children: React.Children.map(group.props.children, (child) => child.type === Divider
                            ? child
                            : React.cloneElement(child, {
                                isFocused: typeaheadActiveChild &&
                                    (typeaheadActiveChild.innerText === child.props.value.toString() ||
                                        (this.props.isCreatable &&
                                            typeaheadActiveChild.innerText ===
                                                `{createText} "${child.props.value}"`))
                            }))
                    });
                }
                else {
                    // group has been filtered down to SelectOption
                    return React.cloneElement(group, {
                        isFocused: typeaheadActiveChild &&
                            (typeaheadActiveChild.innerText === group.props.value.toString() ||
                                (this.props.isCreatable && typeaheadActiveChild.innerText === `{createText} "${group.props.value}"`))
                    });
                }
            });
        }
        return typeaheadChildren.map((child) => {
            const childElement = child;
            return childElement.type.displayName === 'Divider'
                ? child
                : React.cloneElement(child, {
                    isFocused: typeaheadActiveChild &&
                        (typeaheadActiveChild.innerText === child.props.value.toString() ||
                            (this.props.isCreatable &&
                                typeaheadActiveChild.innerText === `{createText} "${child.props.value}"`))
                });
        });
    }
    render() {
        const _a = this.props, { children, chipGroupProps, chipGroupComponent, className, customContent, variant, direction, onSelect, onClear, toggleId, isOpen, isGrouped, isPlain, isDisabled, validated, selections: selectionsProp, typeAheadAriaLabel, clearSelectionsAriaLabel, toggleAriaLabel, removeSelectionAriaLabel, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid, placeholderText, width, maxHeight, toggleIcon, ouiaId, ouiaSafe, hasInlineFilter, isCheckboxSelectionBadgeHidden, inlineFilterPlaceholderText, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onFilter, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onTypeaheadInputChanged, onCreateOption, isCreatable, onToggle, createText, noResultsFoundText, customBadgeText, inputIdPrefix, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        isInputValuePersisted, 
        /* eslint-enable @typescript-eslint/no-unused-vars */
        menuAppendTo, favorites, onFavorite, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        favoritesLabel, footer, loadingVariant } = _a, props = __rest(_a, ["children", "chipGroupProps", "chipGroupComponent", "className", "customContent", "variant", "direction", "onSelect", "onClear", "toggleId", "isOpen", "isGrouped", "isPlain", "isDisabled", "validated", "selections", "typeAheadAriaLabel", "clearSelectionsAriaLabel", "toggleAriaLabel", "removeSelectionAriaLabel", 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-invalid', "placeholderText", "width", "maxHeight", "toggleIcon", "ouiaId", "ouiaSafe", "hasInlineFilter", "isCheckboxSelectionBadgeHidden", "inlineFilterPlaceholderText", "onFilter", "onTypeaheadInputChanged", "onCreateOption", "isCreatable", "onToggle", "createText", "noResultsFoundText", "customBadgeText", "inputIdPrefix", "isInputValuePersisted", "menuAppendTo", "favorites", "onFavorite", "favoritesLabel", "footer", "loadingVariant"]);
        const { openedOnEnter, typeaheadCurrIndex, typeaheadInputValue, typeaheadFilteredChildren, favoritesGroup } = this.state;
        const selectToggleId = toggleId || `pf-select-toggle-id-${currentId++}`;
        const selections = Array.isArray(selectionsProp) ? selectionsProp : [selectionsProp];
        const hasAnySelections = Boolean(selections[0] && selections[0] !== '');
        const typeaheadActiveChild = this.getTypeaheadActiveChild(typeaheadCurrIndex);
        let childPlaceholderText = null;
        // If onFavorites is set,  add isFavorite prop to children and add a Favorites group to the SelectMenu
        let renderableItems = [];
        if (onFavorite) {
            // if variant is type-ahead call the extendTypeaheadChildren before adding favorites
            let tempExtendedChildren = children;
            if (variant === 'typeahead' || variant === 'typeaheadmulti') {
                tempExtendedChildren = this.extendTypeaheadChildren(typeaheadCurrIndex, favoritesGroup);
            }
            else if (onFavorite) {
                tempExtendedChildren = favoritesGroup.concat(children);
            }
            // mark items that are favorited with isFavorite
            renderableItems = extendItemsWithFavorite(tempExtendedChildren, isGrouped, favorites);
        }
        else {
            renderableItems = children;
        }
        if (!customContent) {
            if (!hasAnySelections && !placeholderText) {
                const childPlaceholder = React.Children.toArray(children).filter((child) => child.props.isPlaceholder === true);
                childPlaceholderText =
                    (childPlaceholder[0] && this.getDisplay(childPlaceholder[0].props.value, 'node')) ||
                        (children[0] && this.getDisplay(children[0].props.value, 'node'));
            }
        }
        if (isOpen) {
            if (renderableItems.find(item => { var _a; return ((_a = item) === null || _a === void 0 ? void 0 : _a.key) === 'loading'; }) === undefined) {
                if (loadingVariant === 'spinner') {
                    renderableItems.push(React.createElement(SelectOption, { isLoading: true, key: "loading", value: "loading" },
                        React.createElement(Spinner, { size: "lg" })));
                }
                else if (loadingVariant === null || loadingVariant === void 0 ? void 0 : loadingVariant.text) {
                    renderableItems.push(React.createElement(SelectOption, { isLoad: true, key: "loading", value: loadingVariant.text, onClick: loadingVariant === null || loadingVariant === void 0 ? void 0 : loadingVariant.onClick }));
                }
            }
        }
        const hasOnClear = onClear !== Select.defaultProps.onClear;
        const clearBtn = (React.createElement("button", { className: css(buttonStyles.button, buttonStyles.modifiers.plain, styles.selectToggleClear), onClick: e => {
                this.clearSelection(e);
                onClear(e);
            }, "aria-label": clearSelectionsAriaLabel, type: "button", disabled: isDisabled, ref: this.clearRef, onKeyDown: event => {
                if (event.key === KeyTypes.Enter) {
                    this.clearRef.current.click();
                }
            } },
            React.createElement(TimesCircleIcon, { "aria-hidden": true })));
        let selectedChips = null;
        if (variant === SelectVariant.typeaheadMulti) {
            selectedChips = chipGroupComponent ? (chipGroupComponent) : (React.createElement(ChipGroup, Object.assign({}, chipGroupProps), selections &&
                selections.map(item => (React.createElement(Chip, { key: item, onClick: (e) => onSelect(e, item), closeBtnAriaLabel: removeSelectionAriaLabel }, this.getDisplay(item, 'node'))))));
        }
        let filterWithChildren = children;
        if (hasInlineFilter) {
            const filterBox = (React.createElement(React.Fragment, null,
                React.createElement("div", { key: "inline-filter", className: css(styles.selectMenuSearch) },
                    React.createElement("input", { key: "inline-filter-input", type: "search", className: css(formStyles.formControl, formStyles.modifiers.search), onChange: this.onChange, placeholder: inlineFilterPlaceholderText, onKeyDown: event => {
                            if (event.key === KeyTypes.ArrowUp) {
                                this.handleMenuKeys(0, 0, 'up');
                            }
                            else if (event.key === KeyTypes.ArrowDown) {
                                this.handleMenuKeys(0, 0, 'down');
                            }
                            else if (event.key === KeyTypes.ArrowLeft) {
                                this.handleMenuKeys(0, 0, 'left');
                            }
                            else if (event.key === KeyTypes.ArrowRight) {
                                this.handleMenuKeys(0, 0, 'right');
                            }
                            else if (event.key === KeyTypes.Tab && variant === SelectVariant.checkbox) {
                                // More modal-like experience for checkboxes
                                // Let SelectOption handle this
                                if (event.shiftKey) {
                                    this.handleMenuKeys(0, 0, 'up');
                                }
                                else {
                                    this.handleMenuKeys(0, 0, 'down');
                                }
                                event.stopPropagation();
                                event.preventDefault();
                            }
                        }, ref: this.filterRef, autoComplete: "off" })),
                React.createElement(Divider, { key: "inline-filter-divider" })));
            this.refCollection[0][0] = this.filterRef.current;
            filterWithChildren = [filterBox, ...typeaheadFilteredChildren].map((option, index) => React.cloneElement(option, { key: index }));
        }
        let variantProps;
        let variantChildren;
        if (customContent) {
            variantProps = {
                selected: selections,
                openedOnEnter,
                isCustomContent: true
            };
            variantChildren = customContent;
        }
        else {
            switch (variant) {
                case 'single':
                    variantProps = {
                        selected: selections[0],
                        openedOnEnter
                    };
                    variantChildren = renderableItems;
                    break;
                case 'checkbox':
                    variantProps = {
                        checked: selections,
                        isGrouped,
                        hasInlineFilter,
                        openedOnEnter
                    };
                    variantChildren = filterWithChildren;
                    break;
                case 'typeahead':
                    variantProps = {
                        selected: selections[0],
                        openedOnEnter
                    };
                    variantChildren = onFavorite ? renderableItems : this.extendTypeaheadChildren(typeaheadCurrIndex);
                    if (variantChildren.length === 0) {
                        variantChildren.push(React.createElement(SelectOption, { isDisabled: true, key: 0, value: noResultsFoundText, isNoResultsOption: true }));
                    }
                    break;
                case 'typeaheadmulti':
                    variantProps = {
                        selected: selections,
                        openedOnEnter
                    };
                    variantChildren = onFavorite ? renderableItems : this.extendTypeaheadChildren(typeaheadCurrIndex);
                    if (variantChildren.length === 0) {
                        variantChildren.push(React.createElement(SelectOption, { isDisabled: true, key: 0, value: noResultsFoundText, isNoResultsOption: true }));
                    }
                    break;
            }
        }
        const innerMenu = (React.createElement(SelectMenu, Object.assign({}, props, { isGrouped: isGrouped, selected: selections }, variantProps, { openedOnEnter: openedOnEnter, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, sendRef: this.sendRef, keyHandler: this.handleMenuKeys, maxHeight: maxHeight, ref: this.menuComponentRef, footer: footer, footerRef: this.footerRef }), variantChildren));
        const menuContainer = footer ? React.createElement("div", { className: css(styles.selectMenu) },
            " ",
            innerMenu,
            " ") : innerMenu;
        const popperContainer = (React.createElement("div", Object.assign({ className: css(styles.select, isOpen && styles.modifiers.expanded, validated === ValidatedOptions.success && styles.modifiers.success, validated === ValidatedOptions.warning && styles.modifiers.warning, validated === ValidatedOptions.error && styles.modifiers.invalid, direction === SelectDirection.up && styles.modifiers.top, className) }, (width && { style: { width } }), (validated !== ValidatedOptions.default && { 'aria-describedby': ariaDescribedby }), (validated !== ValidatedOptions.default && { 'aria-invalid': ariaInvalid })), isOpen && menuContainer));
        const mainContainer = (React.createElement("div", Object.assign({ className: css(styles.select, isOpen && styles.modifiers.expanded, validated === ValidatedOptions.success && styles.modifiers.success, validated === ValidatedOptions.warning && styles.modifiers.warning, validated === ValidatedOptions.error && styles.modifiers.invalid, direction === SelectDirection.up && styles.modifiers.top, className), ref: this.parentRef }, getOUIAProps(Select.displayName, ouiaId !== undefined ? ouiaId : this.state.ouiaStateId, ouiaSafe), (width && { style: { width } }), (validated !== ValidatedOptions.default && { 'aria-describedby': ariaDescribedby }), (validated !== ValidatedOptions.default && { 'aria-invalid': ariaInvalid })),
            React.createElement(SelectToggle, Object.assign({ id: selectToggleId, parentRef: this.parentRef, menuRef: this.menuComponentRef }, (footer && { footerRef: this.footerRef }), { isOpen: isOpen, isPlain: isPlain, onToggle: this.onToggle, onEnter: this.onEnter, onClose: this.onClose, variant: variant, "aria-labelledby": `${ariaLabelledBy || ''} ${selectToggleId}`, "aria-label": toggleAriaLabel, handleTypeaheadKeys: this.handleTypeaheadKeys, isDisabled: isDisabled, hasClearButton: hasOnClear, hasFooter: footer !== undefined, onClickTypeaheadToggleButton: this.onClickTypeaheadToggleButton }),
                customContent && (React.createElement("div", { className: css(styles.selectToggleWrapper) },
                    toggleIcon && React.createElement("span", { className: css(styles.selectToggleIcon) }, toggleIcon),
                    React.createElement("span", { className: css(styles.selectToggleText) }, placeholderText))),
                variant === SelectVariant.single && !customContent && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: css(styles.selectToggleWrapper) },
                        toggleIcon && React.createElement("span", { className: css(styles.selectToggleIcon) }, toggleIcon),
                        React.createElement("span", { className: css(styles.selectToggleText) }, this.getDisplay(selections[0], 'node') || placeholderText || childPlaceholderText)),
                    hasOnClear && hasAnySelections && clearBtn)),
                variant === SelectVariant.checkbox && !customContent && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: css(styles.selectToggleWrapper) },
                        toggleIcon && React.createElement("span", { className: css(styles.selectToggleIcon) }, toggleIcon),
                        React.createElement("span", { className: css(styles.selectToggleText) }, placeholderText),
                        !isCheckboxSelectionBadgeHidden && hasAnySelections && (React.createElement("div", { className: css(styles.selectToggleBadge) },
                            React.createElement("span", { className: css(badgeStyles.badge, badgeStyles.modifiers.read) }, this.generateSelectedBadge())))),
                    hasOnClear && hasAnySelections && clearBtn)),
                variant === SelectVariant.typeahead && !customContent && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: css(styles.selectToggleWrapper) },
                        toggleIcon && React.createElement("span", { className: css(styles.selectToggleIcon) }, toggleIcon),
                        React.createElement("input", { className: css(formStyles.formControl, styles.selectToggleTypeahead), "aria-activedescendant": typeaheadActiveChild && typeaheadActiveChild.id, id: `${selectToggleId}-select-typeahead`, "aria-label": typeAheadAriaLabel, placeholder: placeholderText, value: typeaheadInputValue !== null
                                ? typeaheadInputValue
                                : this.getDisplay(selections[0], 'text') || '', type: "text", onClick: this.onClick, onChange: this.onChange, autoComplete: "off", disabled: isDisabled, ref: this.inputRef })),
                    hasOnClear && (selections[0] || typeaheadInputValue) && clearBtn)),
                variant === SelectVariant.typeaheadMulti && !customContent && (React.createElement(React.Fragment, null,
                    React.createElement("div", { className: css(styles.selectToggleWrapper) },
                        toggleIcon && React.createElement("span", { className: css(styles.selectToggleIcon) }, toggleIcon),
                        selections && Array.isArray(selections) && selections.length > 0 && selectedChips,
                        React.createElement("input", { className: css(formStyles.formControl, styles.selectToggleTypeahead), "aria-activedescendant": typeaheadActiveChild && typeaheadActiveChild.id, id: `${selectToggleId}-select-multi-typeahead-typeahead`, "aria-label": typeAheadAriaLabel, "aria-invalid": validated === ValidatedOptions.error, placeholder: placeholderText, value: typeaheadInputValue !== null ? typeaheadInputValue : '', type: "text", onChange: this.onChange, onClick: this.onClick, autoComplete: "off", disabled: isDisabled, ref: this.inputRef })),
                    hasOnClear && ((selections && selections.length > 0) || typeaheadInputValue) && clearBtn)),
                validated === ValidatedOptions.success && (React.createElement("span", { className: css(styles.selectToggleStatusIcon) },
                    React.createElement(CheckCircleIcon, { "aria-hidden": "true" }))),
                validated === ValidatedOptions.error && (React.createElement("span", { className: css(styles.selectToggleStatusIcon) },
                    React.createElement(ExclamationCircleIcon, { "aria-hidden": "true" }))),
                validated === ValidatedOptions.warning && (React.createElement("span", { className: css(styles.selectToggleStatusIcon) },
                    React.createElement(ExclamationTriangleIcon, { "aria-hidden": "true" })))),
            isOpen && menuAppendTo === 'inline' && menuContainer));
        const getParentElement = () => {
            if (this.parentRef && this.parentRef.current) {
                return this.parentRef.current.parentElement;
            }
            return null;
        };
        return (React.createElement(GenerateId, null, randomId => (React.createElement(SelectContext.Provider, { value: { onSelect, onFavorite, onClose: this.onClose, variant, inputIdPrefix: inputIdPrefix || randomId } }, menuAppendTo === 'inline' ? (mainContainer) : (React.createElement(Popper, { trigger: mainContainer, popper: popperContainer, direction: direction, appendTo: menuAppendTo === 'parent' ? getParentElement() : menuAppendTo, isVisible: isOpen }))))));
    }
}
Select.displayName = 'Select';
Select.defaultProps = {
    children: [],
    className: '',
    direction: SelectDirection.down,
    toggleId: null,
    isOpen: false,
    isGrouped: false,
    isPlain: false,
    isDisabled: false,
    isCreatable: false,
    validated: 'default',
    'aria-label': '',
    'aria-labelledby': '',
    'aria-describedby': '',
    'aria-invalid': false,
    typeAheadAriaLabel: '',
    clearSelectionsAriaLabel: 'Clear all',
    toggleAriaLabel: 'Options menu',
    removeSelectionAriaLabel: 'Remove',
    selections: [],
    createText: 'Create',
    placeholderText: '',
    noResultsFoundText: 'No results found',
    variant: SelectVariant.single,
    width: '',
    onClear: () => undefined,
    onCreateOption: () => undefined,
    toggleIcon: null,
    onFilter: null,
    onTypeaheadInputChanged: null,
    customContent: null,
    hasInlineFilter: false,
    inlineFilterPlaceholderText: null,
    customBadgeText: null,
    inputIdPrefix: '',
    menuAppendTo: 'inline',
    favorites: [],
    favoritesLabel: 'Favorites',
    ouiaSafe: true,
    chipGroupComponent: null,
    isInputValuePersisted: false
};
//# sourceMappingURL=Select.js.map