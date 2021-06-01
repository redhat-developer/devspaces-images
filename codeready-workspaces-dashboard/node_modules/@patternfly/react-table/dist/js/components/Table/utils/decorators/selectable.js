"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectable = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const SelectColumn_1 = require("../../SelectColumn");
const check_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Check/check"));
exports.selectable = (label, { rowIndex, columnIndex, rowData, column, property }) => {
    const { extraParams: { onSelect, selectVariant, allRowsSelected } } = column;
    const extraData = {
        rowIndex,
        columnIndex,
        column,
        property
    };
    if (rowData && rowData.hasOwnProperty('parent') && !rowData.showSelect && !rowData.fullWidth) {
        return {
            component: 'td',
            isVisible: true
        };
    }
    const rowId = rowIndex !== undefined ? rowIndex : -1;
    /**
     * @param {React.FormEvent} event - React form event
     */
    function selectClick(event) {
        const selected = rowIndex === undefined ? event.currentTarget.checked : rowData && !rowData.selected;
        // tslint:disable-next-line:no-unused-expression
        onSelect && onSelect(event, selected, rowId, rowData, extraData);
    }
    const customProps = Object.assign(Object.assign({}, (rowId !== -1
        ? {
            checked: rowData && !!rowData.selected,
            'aria-label': `Select row ${rowIndex}`
        }
        : {
            checked: allRowsSelected,
            'aria-label': 'Select all rows'
        })), (rowData &&
        (rowData.disableCheckbox || rowData.disableSelection) && {
        disabled: true,
        className: check_1.default.checkInput
    }));
    let selectName = 'check-all';
    if (rowId !== -1 && selectVariant === SelectColumn_1.RowSelectVariant.checkbox) {
        selectName = `checkrow${rowIndex}`;
    }
    else if (rowId !== -1) {
        selectName = 'radioGroup';
    }
    return {
        className: react_styles_1.css(table_1.default.tableCheck),
        component: 'td',
        isVisible: !rowData || !rowData.fullWidth,
        children: (React.createElement(SelectColumn_1.SelectColumn, Object.assign({}, customProps, { selectVariant: selectVariant, onSelect: selectClick, name: selectName }), label))
    };
};
//# sourceMappingURL=selectable.js.map