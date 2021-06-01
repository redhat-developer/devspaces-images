import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/SearchInput/search-input';
import { css } from '@patternfly/react-styles';
import { Button, ButtonVariant } from '../Button';
import { Badge } from '../Badge';
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleUpIcon from "@patternfly/react-icons/dist/esm/icons/angle-up-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import CaretDownIcon from "@patternfly/react-icons/dist/esm/icons/caret-down-icon";
import ArrowRightIcon from "@patternfly/react-icons/dist/esm/icons/arrow-right-icon";
import { ActionGroup, Form, FormGroup } from '../Form';
import { InputGroup } from '../InputGroup';
import { TextInput } from '../TextInput';
import { GenerateId, KEY_CODES } from '../../helpers';
const SearchInputBase = (_a) => {
    var { className, value = '', attributes = [], hasWordsAttrLabel = 'Has words', advancedSearchDelimiter, placeholder, onChange, onSearch, onClear, resultsCount, onNextClick, onPreviousClick, innerRef, 'aria-label': ariaLabel = 'Search input', resetButtonLabel = 'Reset', openMenuButtonAriaLabel = 'Open advanced search', submitSearchButtonLabel = 'Search', isDisabled = false } = _a, props = __rest(_a, ["className", "value", "attributes", "hasWordsAttrLabel", "advancedSearchDelimiter", "placeholder", "onChange", "onSearch", "onClear", "resultsCount", "onNextClick", "onPreviousClick", "innerRef", 'aria-label', "resetButtonLabel", "openMenuButtonAriaLabel", "submitSearchButtonLabel", "isDisabled"]);
    const [showSearchMenu, setShowSearchMenu] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState(value);
    const firstAttrRef = React.useRef(null);
    const searchInputRef = React.useRef(null);
    const searchInputInputRef = innerRef || React.useRef(null);
    React.useEffect(() => {
        setSearchValue(value);
    }, [value]);
    React.useEffect(() => {
        if (attributes.length > 0 && !advancedSearchDelimiter) {
            // eslint-disable-next-line no-console
            console.error('An advancedSearchDelimiter prop is required when advanced search attributes are provided using the attributes prop');
        }
    });
    React.useEffect(() => {
        if (showSearchMenu && firstAttrRef && firstAttrRef.current) {
            firstAttrRef.current.focus();
        }
        else if (!showSearchMenu && searchInputRef && searchInputRef.current) {
            searchInputInputRef.current.focus();
        }
    }, [showSearchMenu]);
    React.useEffect(() => {
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('touchstart', onDocClick);
        document.addEventListener('keydown', onEscPress);
        return function cleanup() {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('touchstart', onDocClick);
            document.removeEventListener('keydown', onEscPress);
        };
    });
    const onDocClick = (event) => {
        const clickedWithinSearchInput = searchInputRef && searchInputRef.current && searchInputRef.current.contains(event.target);
        if (showSearchMenu && !clickedWithinSearchInput) {
            setShowSearchMenu(false);
        }
    };
    const onEscPress = (event) => {
        const keyCode = event.keyCode || event.which;
        if (showSearchMenu &&
            keyCode === KEY_CODES.ESCAPE_KEY &&
            searchInputRef &&
            searchInputRef.current &&
            searchInputRef.current.contains(event.target)) {
            setShowSearchMenu(false);
            if (searchInputInputRef && searchInputInputRef.current) {
                searchInputInputRef.current.focus();
            }
        }
    };
    const onChangeHandler = (event) => {
        if (onChange) {
            onChange(event.currentTarget.value, event);
        }
        setSearchValue(event.currentTarget.value);
    };
    const onToggle = () => {
        setShowSearchMenu(!showSearchMenu);
    };
    const onSearchHandler = (event) => {
        event.preventDefault();
        if (onSearch) {
            onSearch(value, event, getAttrValueMap());
        }
        setShowSearchMenu(false);
    };
    const getAttrValueMap = () => {
        const attrValue = {};
        const pairs = searchValue.split(' ');
        pairs.map(pair => {
            const splitPair = pair.split(advancedSearchDelimiter);
            if (splitPair.length === 2) {
                attrValue[splitPair[0]] = splitPair[1];
            }
            else if (splitPair.length === 1) {
                attrValue.haswords = attrValue.hasOwnProperty('haswords')
                    ? `${attrValue.haswords} ${splitPair[0]}`
                    : splitPair[0];
            }
        });
        return attrValue;
    };
    const getValue = (attribute) => {
        const map = getAttrValueMap();
        return map.hasOwnProperty(attribute) ? map[attribute] : '';
    };
    const handleValueChange = (attribute, newValue, event) => {
        const newMap = getAttrValueMap();
        newMap[attribute] = newValue;
        let updatedValue = '';
        Object.entries(newMap).forEach(([k, v]) => {
            if (v.trim() !== '') {
                if (k !== hasWordsAttrLabel.replace(' ', '').toLowerCase()) {
                    updatedValue = `${updatedValue} ${k}${advancedSearchDelimiter}${v}`;
                }
                else {
                    updatedValue = `${updatedValue} ${v}`;
                }
            }
        });
        updatedValue = updatedValue.replace(/^\s+/g, '');
        if (onChange) {
            onChange(updatedValue, event);
        }
        setSearchValue(updatedValue);
    };
    const buildFormGroups = () => {
        const formGroups = [];
        attributes.forEach((attribute, index) => {
            const display = typeof attribute === 'string' ? attribute : attribute.display;
            const queryAttr = typeof attribute === 'string' ? attribute : attribute.attr;
            if (index === 0) {
                formGroups.push(React.createElement(FormGroup, { label: display, fieldId: `${queryAttr}_${index}`, key: `${attribute}_${index}` },
                    React.createElement(TextInput, { ref: firstAttrRef, type: "text", id: `${queryAttr}_${index}`, value: getValue(queryAttr), onChange: (value, evt) => handleValueChange(queryAttr, value, evt) })));
            }
            else {
                formGroups.push(React.createElement(FormGroup, { label: display, fieldId: `${queryAttr}_${index}`, key: `${attribute}_${index}` },
                    React.createElement(TextInput, { type: "text", id: `${queryAttr}_${index}`, value: getValue(queryAttr), onChange: (value, evt) => handleValueChange(queryAttr, value, evt) })));
            }
        });
        formGroups.push(React.createElement(GenerateId, { key: 'hasWords' }, randomId => (React.createElement(FormGroup, { label: hasWordsAttrLabel, fieldId: randomId },
            React.createElement(TextInput, { type: "text", id: randomId, value: getValue('haswords'), onChange: (value, evt) => handleValueChange('haswords', value, evt) })))));
        return formGroups;
    };
    return (React.createElement("div", Object.assign({ className: css(className, styles.searchInput), ref: searchInputRef }, props),
        React.createElement(InputGroup, null,
            React.createElement("div", { className: css(styles.searchInputBar) },
                React.createElement("span", { className: css(styles.searchInputText) },
                    React.createElement("span", { className: css(styles.searchInputIcon) },
                        React.createElement(SearchIcon, null)),
                    React.createElement("input", { ref: searchInputInputRef, className: css(styles.searchInputTextInput), value: searchValue, placeholder: placeholder, "aria-label": ariaLabel, onChange: onChangeHandler, disabled: isDisabled })),
                value && (React.createElement("span", { className: css(styles.searchInputUtilities) },
                    resultsCount && (React.createElement("span", { className: css(styles.searchInputCount) },
                        React.createElement(Badge, { isRead: true }, resultsCount))),
                    !!onNextClick && !!onPreviousClick && (React.createElement("span", { className: css(styles.searchInputNav) },
                        React.createElement(Button, { variant: ButtonVariant.plain, "aria-label": "Previous", isDisabled: isDisabled, onClick: onPreviousClick },
                            React.createElement(AngleUpIcon, null)),
                        React.createElement(Button, { variant: ButtonVariant.plain, "aria-label": "Next", isDisabled: isDisabled, onClick: onNextClick },
                            React.createElement(AngleDownIcon, null)))),
                    !!onClear && (React.createElement("span", { className: "pf-c-search-input__clear" },
                        React.createElement(Button, { variant: ButtonVariant.plain, isDisabled: isDisabled, "aria-label": resetButtonLabel, onClick: onClear },
                            React.createElement(TimesIcon, null))))))),
            attributes.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement(Button, { className: showSearchMenu && 'pf-m-expanded', variant: ButtonVariant.control, "aria-label": openMenuButtonAriaLabel, onClick: onToggle, isDisabled: isDisabled, "aria-expanded": showSearchMenu },
                    React.createElement(CaretDownIcon, null)),
                !!onSearch && (React.createElement(Button, { type: "submit", variant: ButtonVariant.control, "aria-label": submitSearchButtonLabel, onClick: onSearchHandler, isDisabled: isDisabled },
                    React.createElement(ArrowRightIcon, null)))))),
        attributes.length > 0 && showSearchMenu && (React.createElement("div", { className: styles.searchInputMenu },
            React.createElement("div", { className: styles.searchInputMenuBody },
                React.createElement(Form, null,
                    buildFormGroups(),
                    React.createElement(ActionGroup, null,
                        React.createElement(Button, { variant: "primary", type: "submit", onClick: onSearchHandler }, submitSearchButtonLabel),
                        !!onClear && (React.createElement(Button, { variant: "link", type: "reset", onClick: onClear }, resetButtonLabel)))))))));
};
SearchInputBase.displayName = 'SearchInputBase';
export const SearchInput = React.forwardRef((props, ref) => (React.createElement(SearchInputBase, Object.assign({}, props, { innerRef: ref }))));
SearchInput.displayName = 'SearchInput';
//# sourceMappingURL=SearchInput.js.map