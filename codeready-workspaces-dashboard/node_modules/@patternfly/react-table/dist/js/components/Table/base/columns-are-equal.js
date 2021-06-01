"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.columnsAreEqual = void 0;
const tslib_1 = require("tslib");
/**
 * columns-are-equal.ts
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
const isEqualWith_1 = tslib_1.__importDefault(require("lodash/isEqualWith"));
/**
 * @param {ColumnsType} oldColumns - previous columns
 * @param {ColumnsType} newColumns - new columns
 */
function columnsAreEqual(oldColumns, newColumns) {
    return isEqualWith_1.default(oldColumns, newColumns, (a, b) => {
        if (typeof a === 'function' && typeof b === 'function') {
            return a === b;
        }
        return undefined;
    });
}
exports.columnsAreEqual = columnsAreEqual;
//# sourceMappingURL=columns-are-equal.js.map