"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationOptionsMenu = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const options_menu_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/OptionsMenu/options-menu"));
const react_styles_1 = require("@patternfly/react-styles");
const Dropdown_1 = require("../Dropdown");
const check_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/check-icon"));
const OptionsToggle_1 = require("./OptionsToggle");
class PaginationOptionsMenu extends React.Component {
    constructor(props) {
        super(props);
        this.parentRef = React.createRef();
        this.onToggle = (isOpen) => {
            this.setState({ isOpen });
        };
        this.onSelect = () => {
            this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
        };
        this.handleNewPerPage = (_evt, newPerPage) => {
            const { page, onPerPageSelect, itemCount, defaultToFullPage } = this.props;
            let newPage = page;
            while (Math.ceil(itemCount / newPerPage) < newPage) {
                newPage--;
            }
            if (defaultToFullPage) {
                if (itemCount / newPerPage !== newPage) {
                    while (newPage > 1 && itemCount - newPerPage * newPage < 0) {
                        newPage--;
                    }
                }
            }
            const startIdx = (newPage - 1) * newPerPage;
            const endIdx = newPage * newPerPage;
            return onPerPageSelect(_evt, newPerPage, newPage, startIdx, endIdx);
        };
        this.renderItems = () => {
            const { perPageOptions, perPage, perPageSuffix } = this.props;
            return perPageOptions.map(({ value, title }) => (React.createElement(Dropdown_1.DropdownItem, { key: value, component: "button", "data-action": `per-page-${value}`, className: react_styles_1.css(perPage === value && 'pf-m-selected'), onClick: event => this.handleNewPerPage(event, value) },
                title,
                ` ${perPageSuffix}`,
                perPage === value && (React.createElement("div", { className: react_styles_1.css(options_menu_1.default.optionsMenuMenuItemIcon) },
                    React.createElement(check_icon_1.default, null))))));
        };
        this.state = {
            isOpen: false
        };
    }
    render() {
        const { widgetId, isDisabled, itemsPerPageTitle, dropDirection, optionsToggle, perPageOptions, toggleTemplate, firstIndex, lastIndex, itemCount, itemsTitle } = this.props;
        const { isOpen } = this.state;
        return (React.createElement(Dropdown_1.DropdownContext.Provider, { value: {
                id: widgetId,
                onSelect: this.onSelect,
                toggleIndicatorClass: options_menu_1.default.optionsMenuToggleButtonIcon,
                toggleTextClass: options_menu_1.default.optionsMenuToggleText,
                menuClass: options_menu_1.default.optionsMenuMenu,
                itemClass: options_menu_1.default.optionsMenuMenuItem,
                toggleClass: ' ',
                baseClass: options_menu_1.default.optionsMenu,
                disabledClass: options_menu_1.default.modifiers.disabled,
                menuComponent: 'ul',
                baseComponent: 'div',
                ouiaComponentType: PaginationOptionsMenu.displayName
            } },
            React.createElement(Dropdown_1.DropdownWithContext, { direction: dropDirection, isOpen: isOpen, toggle: React.createElement(OptionsToggle_1.OptionsToggle, { optionsToggle: optionsToggle, itemsPerPageTitle: itemsPerPageTitle, showToggle: perPageOptions && perPageOptions.length > 0, onToggle: this.onToggle, isOpen: isOpen, widgetId: widgetId, firstIndex: firstIndex, lastIndex: lastIndex, itemCount: itemCount, itemsTitle: itemsTitle, toggleTemplate: toggleTemplate, parentRef: this.parentRef.current, isDisabled: isDisabled }), dropdownItems: this.renderItems(), isPlain: true })));
    }
}
exports.PaginationOptionsMenu = PaginationOptionsMenu;
PaginationOptionsMenu.displayName = 'PaginationOptionsMenu';
PaginationOptionsMenu.defaultProps = {
    className: '',
    widgetId: '',
    isDisabled: false,
    dropDirection: Dropdown_1.DropdownDirection.down,
    perPageOptions: [],
    itemsPerPageTitle: 'Items per page',
    perPageSuffix: 'per page',
    optionsToggle: 'Select',
    perPage: 0,
    firstIndex: 0,
    lastIndex: 0,
    defaultToFullPage: false,
    itemCount: 0,
    itemsTitle: 'items',
    toggleTemplate: ({ firstIndex, lastIndex, itemCount, itemsTitle }) => (React.createElement(React.Fragment, null,
        React.createElement("b", null,
            firstIndex,
            " - ",
            lastIndex),
        ' ',
        "of",
        React.createElement("b", null, itemCount),
        " ",
        itemsTitle)),
    onPerPageSelect: () => null
};
//# sourceMappingURL=PaginationOptionsMenu.js.map