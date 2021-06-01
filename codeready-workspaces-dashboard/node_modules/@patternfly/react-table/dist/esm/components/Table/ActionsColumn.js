import { __rest } from "tslib";
import * as React from 'react';
import { Dropdown } from "@patternfly/react-core/dist/esm/components/Dropdown";
import { KebabToggle } from "@patternfly/react-core/dist/esm/components/Dropdown/KebabToggle";
import { DropdownItem } from "@patternfly/react-core/dist/esm/components/Dropdown/DropdownItem";
import { DropdownSeparator } from "@patternfly/react-core/dist/esm/components/Dropdown/DropdownSeparator";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/Button";
import { DropdownDirection, DropdownPosition } from "@patternfly/react-core/dist/esm/components/Dropdown/dropdownConstants";
export class ActionsColumn extends React.Component {
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
        const actionsToggleClone = actionsToggle ? (actionsToggle({ onToggle: this.onToggle, isOpen, isDisabled })) : (React.createElement(KebabToggle, { isDisabled: isDisabled, onToggle: this.onToggle }));
        return (React.createElement(React.Fragment, null,
            items
                .filter(item => item.isOutsideDropdown)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .map((_a, key) => {
                var { title, itemKey, onClick, isOutsideDropdown } = _a, props = __rest(_a, ["title", "itemKey", "onClick", "isOutsideDropdown"]);
                return typeof title === 'string' ? (React.createElement(Button, Object.assign({ onClick: event => this.onClick(event, onClick) }, props, { isDisabled: isDisabled, key: itemKey || `outside_dropdown_${key}`, "data-key": itemKey || `outside_dropdown_${key}` }), title)) : (React.cloneElement(title, Object.assign({ onClick, isDisabled }, props)));
            }),
            React.createElement(Dropdown, Object.assign({ toggle: actionsToggleClone, position: dropdownPosition, direction: dropdownDirection, isOpen: isOpen, dropdownItems: items
                    .filter(item => !item.isOutsideDropdown)
                    .map((_a, key) => {
                    var { title, itemKey, onClick, isSeparator } = _a, props = __rest(_a, ["title", "itemKey", "onClick", "isSeparator"]);
                    return isSeparator ? (React.createElement(DropdownSeparator, Object.assign({}, props, { key: itemKey || key, "data-key": itemKey || key }))) : (React.createElement(DropdownItem, Object.assign({ component: "button", onClick: event => {
                            this.onClick(event, onClick);
                            this.onToggle(!isOpen);
                        } }, props, { key: itemKey || key, "data-key": itemKey || key }), title));
                }), isPlain: true }, (rowData && rowData.actionProps))),
            children));
    }
}
ActionsColumn.displayName = 'ActionsColumn';
ActionsColumn.defaultProps = {
    children: null,
    items: [],
    dropdownPosition: DropdownPosition.right,
    dropdownDirection: DropdownDirection.down,
    rowData: {},
    extraData: {}
};
//# sourceMappingURL=ActionsColumn.js.map