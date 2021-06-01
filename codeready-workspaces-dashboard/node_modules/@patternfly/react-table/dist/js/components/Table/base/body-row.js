"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyRow = void 0;
const tslib_1 = require("tslib");
/**
 * body-row.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
const isEqual_1 = tslib_1.__importDefault(require("lodash/isEqual"));
const React = tslib_1.__importStar(require("react"));
const columns_are_equal_1 = require("./columns-are-equal");
const evaluate_formatters_1 = require("./evaluate-formatters");
const evaluate_transforms_1 = require("./evaluate-transforms");
const merge_props_1 = require("./merge-props");
class BodyRow extends React.Component {
    shouldComponentUpdate(nextProps) {
        const { columns, rowData } = this.props;
        // Check for row based override.
        const { renderers } = nextProps;
        if (renderers && renderers.row && renderers.row.shouldComponentUpdate) {
            if (typeof renderers.row.shouldComponentUpdate === 'function') {
                return renderers.row.shouldComponentUpdate.call(this, nextProps, {}, {});
            }
            return true;
        }
        return !(columns_are_equal_1.columnsAreEqual(columns, nextProps.columns) && isEqual_1.default(rowData, nextProps.rowData));
    }
    render() {
        const { columns, renderers, onRow, rowKey, rowIndex, rowData } = this.props;
        return React.createElement(renderers.row, onRow(rowData, { rowIndex, rowKey }), columns.map((column, columnIndex) => {
            const { property, cell, props } = column;
            const evaluatedProperty = (property || (cell && cell.property));
            const { transforms = [], formatters = [] } = cell || {};
            const extraParameters = {
                columnIndex,
                property: evaluatedProperty,
                column,
                rowData,
                rowIndex,
                rowKey
            };
            const transformed = evaluate_transforms_1.evaluateTransforms(transforms, rowData[evaluatedProperty], extraParameters);
            if (!transformed) {
                // eslint-disable-next-line no-console
                console.warn('Table.Body - Failed to receive a transformed result');
            }
            let additionalFormaters = [];
            if (rowData[evaluatedProperty]) {
                additionalFormaters = rowData[evaluatedProperty].formatters;
            }
            return React.createElement(renderers.cell, Object.assign({ key: `col-${columnIndex}-row-${rowIndex}` }, merge_props_1.mergeProps(props, cell && cell.props, transformed)), (!rowData.fullWidth && transformed.children) ||
                evaluate_formatters_1.evaluateFormatters([...formatters, ...additionalFormaters])(rowData[`_${evaluatedProperty}`] || rowData[evaluatedProperty], extraParameters));
        }));
    }
}
exports.BodyRow = BodyRow;
BodyRow.displayName = 'BodyRow';
BodyRow.defaultProps = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRow: (...args) => Object
};
//# sourceMappingURL=body-row.js.map