"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandedRow = exports.expandable = exports.collapsible = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const CollapseColumn_1 = require("../../CollapseColumn");
const ExpandableRowContent_1 = require("../../ExpandableRowContent");
exports.collapsible = (value, { rowIndex, columnIndex, rowData, column, property }) => {
    const { extraParams: { onCollapse, rowLabeledBy = 'simple-node', expandId = 'expand-toggle' } } = column;
    const extraData = {
        rowIndex,
        columnIndex,
        column,
        property
    };
    /**
     * @param {React.MouseEvent} event - Mouse event
     */
    function onToggle(event) {
        // tslint:disable-next-line:no-unused-expression
        onCollapse && onCollapse(event, rowIndex, rowData && !rowData.isOpen, rowData, extraData);
    }
    return {
        className: rowData.isOpen !== undefined && react_styles_1.css(table_1.default.tableToggle),
        isVisible: !rowData.fullWidth,
        children: (React.createElement(CollapseColumn_1.CollapseColumn, { "aria-labelledby": `${rowLabeledBy}${rowIndex} ${expandId}${rowIndex}`, onToggle: onToggle, id: expandId + rowIndex, isOpen: rowData && rowData.isOpen }, value))
    };
};
exports.expandable = (value, { rowData }) => rowData && rowData.hasOwnProperty('parent') ? React.createElement(ExpandableRowContent_1.ExpandableRowContent, null, value) : value;
exports.expandedRow = (colSpan) => {
    const expandedRowFormatter = (value, { columnIndex, rowIndex, rowData, column: { extraParams: { contentId = 'expanded-content' } } }) => value &&
        rowData.hasOwnProperty('parent') && {
        // todo: rewrite this logic, it is not type safe
        colSpan: !rowData.cells || rowData.cells.length === 1 ? colSpan + !!rowData.fullWidth : 1,
        id: contentId + rowIndex + (columnIndex ? '-' + columnIndex : ''),
        className: rowData.noPadding && react_styles_1.css(table_1.default.modifiers.noPadding)
    };
    return expandedRowFormatter;
};
//# sourceMappingURL=collapsible.js.map