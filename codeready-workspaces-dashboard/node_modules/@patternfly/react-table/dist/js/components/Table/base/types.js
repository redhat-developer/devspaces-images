"use strict";
/**
 * types.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableDefaults = void 0;
const TableComposable_1 = require("../../TableComposable/TableComposable");
const Thead_1 = require("../../TableComposable/Thead");
const Tbody_1 = require("../../TableComposable/Tbody");
const Tr_1 = require("../../TableComposable/Tr");
const Th_1 = require("../../TableComposable/Th");
const Td_1 = require("../../TableComposable/Td");
// Table Defaults
exports.TableDefaults = {
    renderers: {
        table: TableComposable_1.TableComposable,
        header: {
            wrapper: Thead_1.Thead,
            row: Tr_1.Tr,
            cell: Th_1.Th
        },
        body: {
            wrapper: Tbody_1.Tbody,
            row: Tr_1.Tr,
            cell: Td_1.Td
        }
    }
};
//# sourceMappingURL=types.js.map