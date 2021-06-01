"use strict";
/**
 * resolve-row-key.ts
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRowKey = void 0;
/**
 * @param {{rowData: RowType, rowIndex: number, rowKey: RowKeyType}} rowData - row data
 */
function resolveRowKey({ rowData, rowIndex, rowKey }) {
    if (typeof rowKey === 'function') {
        return `${rowKey({ rowData, rowIndex })}-row`;
    }
    else if (process.env.NODE_ENV !== 'production') {
        // Arrays cannot have rowKeys by definition so we have to go by index there.
        if (!Array.isArray(rowData) && rowData[rowKey] === undefined) {
            // eslint-disable-next-line no-console
            console.warn('Table.Body - Missing valid rowKey!', rowData, rowKey);
        }
    }
    if (rowData[rowKey] === 0) {
        return `${rowData[rowKey]}-row`;
    }
    return `${rowData[rowKey] || rowIndex}-row`;
}
exports.resolveRowKey = resolveRowKey;
//# sourceMappingURL=resolve-row-key.js.map