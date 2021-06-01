"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInput = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const search_input_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/SearchInput/search-input"));
const react_styles_1 = require("@patternfly/react-styles");
const Button_1 = require("../Button");
const Badge_1 = require("../Badge");
const angle_down_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-down-icon"));
const angle_up_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-up-icon"));
const times_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/times-icon"));
const search_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/search-icon"));
const caret_down_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/caret-down-icon"));
const arrow_right_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/arrow-right-icon"));
const Form_1 = require("../Form");
const InputGroup_1 = require("../InputGroup");
const TextInput_1 = require("../TextInput");
const helpers_1 = require("../../helpers");
const SearchInputBase = (_a) => {
    var { className, value = '', attributes = [], hasWordsAttrLabel = 'Has words', advancedSearchDelimiter, placeholder, onChange, onSearch, onClear, resultsCount, onNextClick, onPreviousClick, innerRef, 'aria-label': ariaLabel = 'Search input', resetButtonLabel = 'Reset', openMenuButtonAriaLabel = 'Open advanced search', submitSearchButtonLabel = 'Search', isDisabled = false } = _a, props = tslib_1.__rest(_a, ["className", "value", "attributes", "hasWordsAttrLabel", "advancedSearchDelimiter", "placeholder", "onChange", "onSearch", "onClear", "resultsCount", "onNextClick", "onPreviousClick", "innerRef", 'aria-label', "resetButtonLabel", "openMenuButtonAriaLabel", "submitSearchButtonLabel", "isDisabled"]);
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
            keyCode === helpers_1.KEY_CODES.ESCAPE_KEY &&
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
                formGroups.push(React.createElement(Form_1.FormGroup, { label: display, fieldId: `${queryAttr}_${index}`, key: `${attribute}_${index}` },
                    React.createElement(TextInput_1.TextInput, { ref: firstAttrRef, type: "text", id: `${queryAttr}_${index}`, value: getValue(queryAttr), onChange: (value, evt) => handleValueChange(queryAttr, value, evt) })));
            }
            else {
                formGroups.push(React.createElement(Form_1.FormGroup, { label: display, fieldId: `${queryAttr}_${index}`, key: `${attribute}_${index}` },
                    React.createElement(TextInput_1.TextInput, { type: "text", id: `${queryAttr}_${index}`, value: getValue(queryAttr), onChange: (value, evt) => handleValueChange(queryAttr, value, evt) })));
            }
        });
        formGroups.push(React.createElement(helpers_1.GenerateId, { key: 'hasWords' }, randomId => (React.createElement(Form_1.FormGroup, { label: hasWordsAttrLabel, fieldId: randomId },
            React.createElement(TextInput_1.TextInput, { type: "text", id: randomId, value: getValue('haswords'), onChange: (value, evt) => handleValueChange('haswords', value, evt) })))));
        return formGroups;
    };
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(className, search_input_1.default.searchInput), ref: searchInputRef }, props),
        React.createElement(InputGroup_1.InputGroup, null,
            React.createElement("div", { className: react_styles_1.css(search_input_1.default.searchInputBar) },
                React.createElement("span", { className: react_styles_1.css(search_input_1.default.searchInputText) },
                    React.createElement("span", { className: react_styles_1.css(search_input_1.default.searchInputIcon) },
                        React.createElement(search_icon_1.default, null)),
                    React.createElement("input", { ref: searchInputInputRef, className: react_styles_1.css(search_input_1.default.searchInputTextInput), value: searchValue, placeholder: placeholder, "aria-label": ariaLabel, onChange: onChangeHandler, disabled: isDisabled })),
                value && (React.createElement("span", { className: react_styles_1.css(search_input_1.default.searchInputUtilities) },
                    resultsCount && (React.createElement("span", { className: react_styles_1.css(search_input_1.default.searchInputCount) },
                        React.createElement(Badge_1.Badge, { isRead: true }, resultsCount))),
                    !!onNextClick && !!onPreviousClick && (React.createElement("span", { className: react_styles_1.css(search_input_1.default.searchInputNav) },
                        React.createElement(Button_1.Button, { variant: Button_1.ButtonVariant.plain, "aria-label": "Previous", isDisabled: isDisabled, onClick: onPreviousClick },
                            React.createElement(angle_up_icon_1.default, null)),
                        React.createElement(Button_1.Button, { variant: Button_1.ButtonVariant.plain, "aria-label": "Next", isDisabled: isDisabled, onClick: onNextClick },
                            React.createElement(angle_down_icon_1.default, null)))),
                    !!onClear && (React.createElement("span", { className: "pf-c-search-input__clear" },
                        React.createElement(Button_1.Button, { variant: Button_1.ButtonVariant.plain, isDisabled: isDisabled, "aria-label": resetButtonLabel, onClick: onClear },
                            React.createElement(times_icon_1.default, null))))))),
            attributes.length > 0 && (React.createElement(React.Fragment, null,
                React.createElement(Button_1.Button, { className: showSearchMenu && 'pf-m-expanded', variant: Button_1.ButtonVariant.control, "aria-label": openMenuButtonAriaLabel, onClick: onToggle, isDisabled: isDisabled, "aria-expanded": showSearchMenu },
                    React.createElement(caret_down_icon_1.default, null)),
                !!onSearch && (React.createElement(Button_1.Button, { type: "submit", variant: Button_1.ButtonVariant.control, "aria-label": submitSearchButtonLabel, onClick: onSearchHandler, isDisabled: isDisabled },
                    React.createElement(arrow_right_icon_1.default, null)))))),
        attributes.length > 0 && showSearchMenu && (React.createElement("div", { className: search_input_1.default.searchInputMenu },
            React.createElement("div", { className: search_input_1.default.searchInputMenuBody },
                React.createElement(Form_1.Form, null,
                    buildFormGroups(),
                    React.createElement(Form_1.ActionGroup, null,
                        React.createElement(Button_1.Button, { variant: "primary", type: "submit", onClick: onSearchHandler }, submitSearchButtonLabel),
                        !!onClear && (React.createElement(Button_1.Button, { variant: "link", type: "reset", onClick: onClear }, resetButtonLabel)))))))));
};
SearchInputBase.displayName = 'SearchInputBase';
exports.SearchInput = React.forwardRef((props, ref) => (React.createElement(SearchInputBase, Object.assign({}, props, { innerRef: ref }))));
exports.SearchInput.displayName = 'SearchInput';
//# sourceMappingURL=SearchInput.js.map