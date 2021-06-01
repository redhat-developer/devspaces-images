/**
 * body-row.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import isEqual from 'lodash/isEqual';
import * as React from 'react';
import { columnsAreEqual } from './columns-are-equal';
import { evaluateFormatters } from './evaluate-formatters';
import { evaluateTransforms } from './evaluate-transforms';
import { mergeProps } from './merge-props';
export class BodyRow extends React.Component {
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
        return !(columnsAreEqual(columns, nextProps.columns) && isEqual(rowData, nextProps.rowData));
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
            const transformed = evaluateTransforms(transforms, rowData[evaluatedProperty], extraParameters);
            if (!transformed) {
                // eslint-disable-next-line no-console
                console.warn('Table.Body - Failed to receive a transformed result');
            }
            let additionalFormaters = [];
            if (rowData[evaluatedProperty]) {
                additionalFormaters = rowData[evaluatedProperty].formatters;
            }
            return React.createElement(renderers.cell, Object.assign({ key: `col-${columnIndex}-row-${rowIndex}` }, mergeProps(props, cell && cell.props, transformed)), (!rowData.fullWidth && transformed.children) ||
                evaluateFormatters([...formatters, ...additionalFormaters])(rowData[`_${evaluatedProperty}`] || rowData[evaluatedProperty], extraParameters));
        }));
    }
}
BodyRow.displayName = 'BodyRow';
BodyRow.defaultProps = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRow: (...args) => Object
};
//# sourceMappingURL=body-row.js.map