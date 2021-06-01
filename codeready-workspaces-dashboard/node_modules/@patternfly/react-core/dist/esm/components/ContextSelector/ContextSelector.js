import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/ContextSelector/context-selector';
import { css } from '@patternfly/react-styles';
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import { ContextSelectorToggle } from './ContextSelectorToggle';
import { ContextSelectorMenuList } from './ContextSelectorMenuList';
import { ContextSelectorContext } from './contextSelectorConstants';
import { Button, ButtonVariant } from '../Button';
import { TextInput } from '../TextInput';
import { InputGroup } from '../InputGroup';
import { KEY_CODES } from '../../helpers/constants';
import { FocusTrap } from '../../helpers';
import { Popper } from '../../helpers/Popper/Popper';
import { getOUIAProps, getDefaultOUIAId } from '../../helpers';
// seed for the aria-labelledby ID
let currentId = 0;
const newId = currentId++;
export class ContextSelector extends React.Component {
    constructor(props) {
        super(props);
        this.parentRef = React.createRef();
        this.onEnterPressed = (event) => {
            if (event.charCode === KEY_CODES.ENTER) {
                this.props.onSearchButtonClick();
            }
        };
        this.state = {
            ouiaStateId: getDefaultOUIAId(ContextSelector.displayName)
        };
    }
    render() {
        const toggleId = `pf-context-selector-toggle-id-${newId}`;
        const screenReaderLabelId = `pf-context-selector-label-id-${newId}`;
        const searchButtonId = `pf-context-selector-search-button-id-${newId}`;
        const _a = this.props, { children, className, isOpen, onToggle, onSelect, screenReaderLabel, toggleText, searchButtonAriaLabel, searchInputValue, onSearchInputChange, searchInputPlaceholder, onSearchButtonClick, menuAppendTo, ouiaId, ouiaSafe, footer } = _a, props = __rest(_a, ["children", "className", "isOpen", "onToggle", "onSelect", "screenReaderLabel", "toggleText", "searchButtonAriaLabel", "searchInputValue", "onSearchInputChange", "searchInputPlaceholder", "onSearchButtonClick", "menuAppendTo", "ouiaId", "ouiaSafe", "footer"]);
        const menuContainer = (React.createElement("div", { className: css(styles.contextSelectorMenu) }, isOpen && (React.createElement(FocusTrap, { focusTrapOptions: { clickOutsideDeactivates: true } },
            React.createElement("div", { className: css(styles.contextSelectorMenuSearch) },
                React.createElement(InputGroup, null,
                    React.createElement(TextInput, { value: searchInputValue, type: "search", placeholder: searchInputPlaceholder, onChange: onSearchInputChange, onKeyPress: this.onEnterPressed, "aria-labelledby": searchButtonId }),
                    React.createElement(Button, { variant: ButtonVariant.control, "aria-label": searchButtonAriaLabel, id: searchButtonId, onClick: onSearchButtonClick },
                        React.createElement(SearchIcon, { "aria-hidden": "true" })))),
            React.createElement(ContextSelectorContext.Provider, { value: { onSelect } },
                React.createElement(ContextSelectorMenuList, { isOpen: isOpen }, children)),
            footer))));
        const popperContainer = (React.createElement("div", Object.assign({ className: css(styles.contextSelector, isOpen && styles.modifiers.expanded, className), ref: this.parentRef }, props), isOpen && menuContainer));
        const mainContainer = (React.createElement("div", Object.assign({ className: css(styles.contextSelector, isOpen && styles.modifiers.expanded, className), ref: this.parentRef }, getOUIAProps(ContextSelector.displayName, ouiaId !== undefined ? ouiaId : this.state.ouiaStateId, ouiaSafe), props),
            screenReaderLabel && (React.createElement("span", { id: screenReaderLabelId, hidden: true }, screenReaderLabel)),
            React.createElement(ContextSelectorToggle, { onToggle: onToggle, isOpen: isOpen, toggleText: toggleText, id: toggleId, parentRef: this.parentRef.current, "aria-labelledby": `${screenReaderLabelId} ${toggleId}` }),
            isOpen && menuAppendTo === 'inline' && menuContainer));
        const getParentElement = () => {
            if (this.parentRef && this.parentRef.current) {
                return this.parentRef.current.parentElement;
            }
            return null;
        };
        return menuAppendTo === 'inline' ? (mainContainer) : (React.createElement(Popper, { trigger: mainContainer, popper: popperContainer, appendTo: menuAppendTo === 'parent' ? getParentElement() : menuAppendTo, isVisible: isOpen }));
    }
}
ContextSelector.displayName = 'ContextSelector';
ContextSelector.defaultProps = {
    children: null,
    className: '',
    isOpen: false,
    onToggle: () => undefined,
    onSelect: () => undefined,
    screenReaderLabel: '',
    toggleText: '',
    searchButtonAriaLabel: 'Search menu items',
    searchInputValue: '',
    onSearchInputChange: () => undefined,
    searchInputPlaceholder: 'Search',
    onSearchButtonClick: () => undefined,
    menuAppendTo: 'inline',
    ouiaSafe: true,
    footer: null
};
//# sourceMappingURL=ContextSelector.js.map