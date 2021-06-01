/**
 * types.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import { TableComposable } from '../../TableComposable/TableComposable';
import { Thead } from '../../TableComposable/Thead';
import { Tbody } from '../../TableComposable/Tbody';
import { Tr } from '../../TableComposable/Tr';
import { Th } from '../../TableComposable/Th';
import { Td } from '../../TableComposable/Td';
// Table Defaults
export const TableDefaults = {
    renderers: {
        table: TableComposable,
        header: {
            wrapper: Thead,
            row: Tr,
            cell: Th
        },
        body: {
            wrapper: Tbody,
            row: Tr,
            cell: Td
        }
    }
};
//# sourceMappingURL=types.js.map