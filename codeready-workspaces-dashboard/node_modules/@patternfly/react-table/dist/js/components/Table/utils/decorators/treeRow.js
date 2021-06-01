"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treeRow = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const table_tree_view_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table-tree-view"));
const react_core_1 = require("@patternfly/react-core");
const angle_down_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-down-icon"));
const ellipsis_h_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/ellipsis-h-icon"));
exports.treeRow = (onCollapse, onCheckChange, onToggleRowDetails) => (value, { rowIndex, rowData }) => {
    const { isExpanded, isDetailsExpanded, 'aria-level': level, 'aria-setsize': setsize, toggleAriaLabel, checkAriaLabel, showDetailsAriaLabel, isChecked, checkboxId, icon } = rowData.props;
    const content = value.title || value;
    const text = (React.createElement("div", { className: react_styles_1.css(table_tree_view_1.default.tableTreeViewText) },
        icon && React.createElement("span", { className: react_styles_1.css(table_tree_view_1.default.tableTreeViewIcon) }, icon),
        React.createElement("span", { className: "pf-c-table__text" }, content)));
    const onChange = (isChecked, event) => {
        onCheckChange(event, isChecked, rowIndex, content, rowData);
    };
    return {
        component: 'th',
        className: 'pf-c-table__tree-view-title-cell',
        children: level !== undefined ? (React.createElement("div", { className: react_styles_1.css(table_tree_view_1.default.tableTreeViewMain) },
            setsize > 0 && (React.createElement("span", { className: react_styles_1.css(table_tree_view_1.default.tableToggle) },
                React.createElement(react_core_1.Button, { variant: "plain", onClick: event => onCollapse && onCollapse(event, rowIndex, content, rowData), className: react_styles_1.css(isExpanded && table_1.default.modifiers.expanded), "aria-expanded": isExpanded, "aria-label": toggleAriaLabel || `${isExpanded ? 'Collapse' : 'Expand'} row ${rowIndex}` },
                    React.createElement("div", { className: react_styles_1.css(table_tree_view_1.default.tableToggleIcon) },
                        React.createElement(angle_down_icon_1.default, { "aria-hidden": "true" }))))),
            !!onCheckChange && (React.createElement("span", { className: react_styles_1.css(table_tree_view_1.default.tableCheck) },
                React.createElement(react_core_1.Checkbox, { id: checkboxId || `checkbox_${rowIndex}`, "aria-label": checkAriaLabel || `Row ${rowIndex} checkbox`, isChecked: isChecked, onChange: onChange }))),
            text,
            !!onToggleRowDetails && (React.createElement("span", { className: react_styles_1.css(table_tree_view_1.default.tableTreeViewDetailsToggle) },
                React.createElement(react_core_1.Button, { variant: "plain", "aria-expanded": isDetailsExpanded, "aria-label": showDetailsAriaLabel || 'Show row details', onClick: event => onToggleRowDetails && onToggleRowDetails(event, rowIndex, content, rowData) },
                    React.createElement("span", { className: "pf-c-table__details-toggle-icon" },
                        React.createElement(ellipsis_h_icon_1.default, { "aria-hidden": true }))))))) : (text)
    };
};
//# sourceMappingURL=treeRow.js.map