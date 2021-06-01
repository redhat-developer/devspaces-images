"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsColumn = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const Dropdown_1 = require("@patternfly/react-core/dist/js/components/Dropdown");
const KebabToggle_1 = require("@patternfly/react-core/dist/js/components/Dropdown/KebabToggle");
const DropdownItem_1 = require("@patternfly/react-core/dist/js/components/Dropdown/DropdownItem");
const DropdownSeparator_1 = require("@patternfly/react-core/dist/js/components/Dropdown/DropdownSeparator");
const Button_1 = require("@patternfly/react-core/dist/js/components/Button/Button");
const dropdownConstants_1 = require("@patternfly/react-core/dist/js/components/Dropdown/dropdownConstants");
class ActionsColumn extends React.Component {
    constructor(props) {
        super(props);
        this.onToggle = (isOpen) => {
            this.setState({
                isOpen
            });
        };
        this.onClick = (event, onClick) => {
            const { rowData, extraData } = this.props;
            // Only prevent default if onClick is provided.  This allows href support.
            if (onClick) {
                event.preventDefault();
                // tslint:disable-next-line:no-unused-expression
                onClick(event, extraData && extraData.rowIndex, rowData, extraData);
            }
        };
        this.state = {
            isOpen: false
        };
    }
    render() {
        const { isOpen } = this.state;
        const { items, children, dropdownPosition, dropdownDirection, isDisabled, rowData, actionsToggle } = this.props;
        const actionsToggleClone = actionsToggle ? (actionsToggle({ onToggle: this.onToggle, isOpen, isDisabled })) : (React.createElement(KebabToggle_1.KebabToggle, { isDisabled: isDisabled, onToggle: this.onToggle }));
        return (React.createElement(React.Fragment, null,
            items
                .filter(item => item.isOutsideDropdown)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .map((_a, key) => {
                var { title, itemKey, onClick, isOutsideDropdown } = _a, props = tslib_1.__rest(_a, ["title", "itemKey", "onClick", "isOutsideDropdown"]);
                return typeof title === 'string' ? (React.createElement(Button_1.Button, Object.assign({ onClick: event => this.onClick(event, onClick) }, props, { isDisabled: isDisabled, key: itemKey || `outside_dropdown_${key}`, "data-key": itemKey || `outside_dropdown_${key}` }), title)) : (React.cloneElement(title, Object.assign({ onClick, isDisabled }, props)));
            }),
            React.createElement(Dropdown_1.Dropdown, Object.assign({ toggle: actionsToggleClone, position: dropdownPosition, direction: dropdownDirection, isOpen: isOpen, dropdownItems: items
                    .filter(item => !item.isOutsideDropdown)
                    .map((_a, key) => {
                    var { title, itemKey, onClick, isSeparator } = _a, props = tslib_1.__rest(_a, ["title", "itemKey", "onClick", "isSeparator"]);
                    return isSeparator ? (React.createElement(DropdownSeparator_1.DropdownSeparator, Object.assign({}, props, { key: itemKey || key, "data-key": itemKey || key }))) : (React.createElement(DropdownItem_1.DropdownItem, Object.assign({ component: "button", onClick: event => {
                            this.onClick(event, onClick);
                            this.onToggle(!isOpen);
                        } }, props, { key: itemKey || key, "data-key": itemKey || key }), title));
                }), isPlain: true }, (rowData && rowData.actionProps))),
            children));
    }
}
exports.ActionsColumn = ActionsColumn;
ActionsColumn.displayName = 'ActionsColumn';
ActionsColumn.defaultProps = {
    children: null,
    items: [],
    dropdownPosition: dropdownConstants_1.DropdownPosition.right,
    dropdownDirection: dropdownConstants_1.DropdownDirection.down,
    rowData: {},
    extraData: {}
};
//# sourceMappingURL=ActionsColumn.js.map