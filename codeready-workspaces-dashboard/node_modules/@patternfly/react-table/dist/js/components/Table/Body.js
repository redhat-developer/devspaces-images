"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableBody = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const base_1 = require("./base");
const TableContext_1 = require("./TableContext");
const utils_1 = require("./utils");
const flagVisibility = (rows) => {
    const visibleRows = rows.filter((oneRow) => !oneRow.parent || oneRow.isExpanded);
    if (visibleRows.length > 0) {
        visibleRows[0].isFirstVisible = true;
        visibleRows[visibleRows.length - 1].isLastVisible = true;
    }
};
class ContextBody extends React.Component {
    constructor() {
        super(...arguments);
        this.onRow = (row, rowProps) => {
            const { onRowClick, onRow } = this.props;
            const extendedRowProps = Object.assign(Object.assign({}, rowProps), (onRow ? onRow(row, rowProps) : {}));
            return {
                row,
                rowProps: extendedRowProps,
                onMouseDown: (event) => {
                    const computedData = {
                        isInput: event.target.tagName !== 'INPUT',
                        isButton: event.target.tagName !== 'BUTTON'
                    };
                    onRowClick(event, row, rowProps, computedData);
                }
            };
        };
        this.mapCells = (headerData, row, rowKey) => {
            // column indexes start after generated optional columns like collapsible or select column(s)
            const { firstUserColumnIndex } = headerData[0].extraParams;
            const isFullWidth = row && row.fullWidth;
            // typically you'd want to map each cell to its column header, but in the case of fullWidth
            // the first column could be the Select and/or Expandable column
            let additionalColsIndexShift = isFullWidth ? 0 : firstUserColumnIndex;
            return Object.assign({}, (row &&
                (row.cells || row).reduce((acc, cell, cellIndex) => {
                    const isCellObject = cell === Object(cell);
                    const isCellFunction = cell && typeof cell.title === 'function';
                    let formatters = [];
                    if (isCellObject && cell.formatters) {
                        // give priority to formatters specified on the cell object
                        // expandable example:
                        // rows: [{ parent: 0, fullWidth: true, cells: [{ title: 'fullWidth, child - a', formatters: [expandable]}] }]
                        formatters = cell.formatters;
                    }
                    else if (isFullWidth && cellIndex < firstUserColumnIndex) {
                        // for backwards compatibility, map the cells that are not under user columns (like Select/Expandable)
                        // to the first user column's header formatters
                        formatters = headerData[firstUserColumnIndex].cell.formatters;
                    }
                    let mappedCellTitle = cell;
                    if (isCellObject && isCellFunction) {
                        mappedCellTitle = cell.title(cell.props.value, rowKey, cellIndex, cell.props);
                    }
                    else if (isCellObject) {
                        mappedCellTitle = cell.title;
                    }
                    const mappedCell = {
                        [headerData[cellIndex + additionalColsIndexShift].property]: {
                            title: mappedCellTitle,
                            formatters,
                            props: Object.assign({ isVisible: true }, (isCellObject ? cell.props : null))
                        }
                    };
                    // increment the shift index when a cell spans multiple columns
                    if (isCellObject && cell.props && cell.props.colSpan) {
                        additionalColsIndexShift += cell.props.colSpan - 1;
                    }
                    return Object.assign(Object.assign({}, acc), mappedCell);
                }, { secretTableRowKeyId: row.id !== undefined ? row.id : rowKey })));
        };
    }
    render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _a = this.props, { className, headerData, rows, rowKey, children, onRowClick } = _a, props = tslib_1.__rest(_a, ["className", "headerData", "rows", "rowKey", "children", "onRowClick"]);
        let mappedRows;
        if (headerData.length > 0) {
            mappedRows = rows.map((oneRow, oneRowKey) => (Object.assign(Object.assign(Object.assign({}, oneRow), this.mapCells(headerData, oneRow, oneRowKey)), { isExpanded: utils_1.isRowExpanded(oneRow, rows), isHeightAuto: oneRow.heightAuto || false, isFirst: oneRowKey === 0, isLast: oneRowKey === rows.length - 1, isFirstVisible: false, isLastVisible: false })));
            flagVisibility(mappedRows);
        }
        return (React.createElement(React.Fragment, null, mappedRows && (React.createElement(base_1.Body, Object.assign({}, props, { mappedRows: mappedRows, rows: mappedRows, onRow: this.onRow, rowKey: rowKey, className: className })))));
    }
}
exports.TableBody = (_a) => {
    var { className = '', children = null, rowKey = 'secretTableRowKeyId', 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    onRow = (...args) => Object, onRowClick = (event, row, rowProps, computedData) => 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    undefined } = _a, props = tslib_1.__rest(_a, ["className", "children", "rowKey", "onRow", "onRowClick"]);
    return (React.createElement(TableContext_1.TableContext.Consumer, null, (_a) => {
        var { headerData = [], rows = [] } = _a, rest = tslib_1.__rest(_a, ["headerData", "rows"]);
        return (React.createElement(ContextBody, Object.assign({ headerData: headerData, rows: rows, onRow: onRow, className: className, rowKey: rowKey, onRowClick: onRowClick }, props, rest), children));
    }));
};
//# sourceMappingURL=Body.js.map