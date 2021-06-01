import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Table/table';
import stylesGrid from '@patternfly/react-styles/css/components/Table/table-grid';
import stylesTreeView from '@patternfly/react-styles/css/components/Table/table-tree-view';
import { css } from '@patternfly/react-styles';
import { toCamel } from '../Table/utils/utils';
import { useOUIAProps } from '@patternfly/react-core';
import { TableGridBreakpoint } from '../Table/TableTypes';
const TableComposableBase = (_a) => {
    var _b, _c;
    var { children, className, variant, borders = true, isStickyHeader = false, gridBreakPoint = TableGridBreakpoint.gridMd, 'aria-label': ariaLabel, role = 'grid', innerRef, ouiaId, ouiaSafe = true, isTreeTable = false } = _a, props = __rest(_a, ["children", "className", "variant", "borders", "isStickyHeader", "gridBreakPoint", 'aria-label', "role", "innerRef", "ouiaId", "ouiaSafe", "isTreeTable"]);
    const ouiaProps = useOUIAProps('Table', ouiaId, ouiaSafe);
    const grid = (_b = stylesGrid.modifiers) === null || _b === void 0 ? void 0 : _b[toCamel(gridBreakPoint || '').replace(/-?2xl/, '_2xl')];
    const breakPointPrefix = `treeView${gridBreakPoint.charAt(0).toUpperCase() + gridBreakPoint.slice(1)}`;
    const treeGrid = (_c = stylesTreeView.modifiers) === null || _c === void 0 ? void 0 : _c[toCamel(breakPointPrefix || '').replace(/-?2xl/, '_2xl')];
    return (React.createElement("table", Object.assign({ "aria-label": ariaLabel, role: role, className: css(className, styles.table, isTreeTable ? treeGrid : grid, styles.modifiers[variant], !borders && styles.modifiers.noBorderRows, isStickyHeader && styles.modifiers.stickyHeader, isTreeTable && stylesTreeView.modifiers.treeView), ref: innerRef }, (isTreeTable && { role: 'treegrid' }), ouiaProps, props), children));
};
export const TableComposable = React.forwardRef((props, ref) => (React.createElement(TableComposableBase, Object.assign({}, props, { innerRef: ref }))));
TableComposable.displayName = 'TableComposable';
//# sourceMappingURL=TableComposable.js.map