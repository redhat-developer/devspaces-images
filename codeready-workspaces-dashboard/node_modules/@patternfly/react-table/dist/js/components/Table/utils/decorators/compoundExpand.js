"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compoundExpand = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const TableText_1 = require("../../TableText");
exports.compoundExpand = (value, { rowIndex, columnIndex, rowData, column, property }) => {
    if (!value) {
        return null;
    }
    const { title, props } = value;
    const { extraParams: { onExpand } } = column;
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
        onExpand && onExpand(event, rowIndex, columnIndex, props.isOpen, rowData, extraData);
    }
    return {
        className: react_styles_1.css(table_1.default.tableCompoundExpansionToggle, props.isOpen && table_1.default.modifiers.expanded),
        children: props.isOpen !== undefined && (React.createElement("button", { type: "button", className: react_styles_1.css(table_1.default.tableButton), onClick: onToggle, "aria-expanded": props.isOpen, "aria-controls": props.ariaControls },
            React.createElement(TableText_1.TableText, null, title)))
    };
};
//# sourceMappingURL=compoundExpand.js.map