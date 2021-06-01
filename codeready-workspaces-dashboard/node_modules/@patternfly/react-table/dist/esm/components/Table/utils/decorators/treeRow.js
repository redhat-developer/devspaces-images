import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import stylesTreeView from '@patternfly/react-styles/css/components/Table/table-tree-view';
import { Button, Checkbox } from '@patternfly/react-core';
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import EllipsisHIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-h-icon";
export const treeRow = (onCollapse, onCheckChange, onToggleRowDetails) => (value, { rowIndex, rowData }) => {
    const { isExpanded, isDetailsExpanded, 'aria-level': level, 'aria-setsize': setsize, toggleAriaLabel, checkAriaLabel, showDetailsAriaLabel, isChecked, checkboxId, icon } = rowData.props;
    const content = value.title || value;
    const text = (React.createElement("div", { className: css(stylesTreeView.tableTreeViewText) },
        icon && React.createElement("span", { className: css(stylesTreeView.tableTreeViewIcon) }, icon),
        React.createElement("span", { className: "pf-c-table__text" }, content)));
    const onChange = (isChecked, event) => {
        onCheckChange(event, isChecked, rowIndex, content, rowData);
    };
    return {
        component: 'th',
        className: 'pf-c-table__tree-view-title-cell',
        children: level !== undefined ? (React.createElement("div", { className: css(stylesTreeView.tableTreeViewMain) },
            setsize > 0 && (React.createElement("span", { className: css(stylesTreeView.tableToggle) },
                React.createElement(Button, { variant: "plain", onClick: event => onCollapse && onCollapse(event, rowIndex, content, rowData), className: css(isExpanded && styles.modifiers.expanded), "aria-expanded": isExpanded, "aria-label": toggleAriaLabel || `${isExpanded ? 'Collapse' : 'Expand'} row ${rowIndex}` },
                    React.createElement("div", { className: css(stylesTreeView.tableToggleIcon) },
                        React.createElement(AngleDownIcon, { "aria-hidden": "true" }))))),
            !!onCheckChange && (React.createElement("span", { className: css(stylesTreeView.tableCheck) },
                React.createElement(Checkbox, { id: checkboxId || `checkbox_${rowIndex}`, "aria-label": checkAriaLabel || `Row ${rowIndex} checkbox`, isChecked: isChecked, onChange: onChange }))),
            text,
            !!onToggleRowDetails && (React.createElement("span", { className: css(stylesTreeView.tableTreeViewDetailsToggle) },
                React.createElement(Button, { variant: "plain", "aria-expanded": isDetailsExpanded, "aria-label": showDetailsAriaLabel || 'Show row details', onClick: event => onToggleRowDetails && onToggleRowDetails(event, rowIndex, content, rowData) },
                    React.createElement("span", { className: "pf-c-table__details-toggle-icon" },
                        React.createElement(EllipsisHIcon, { "aria-hidden": true }))))))) : (text)
    };
};
//# sourceMappingURL=treeRow.js.map