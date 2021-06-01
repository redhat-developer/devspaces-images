import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import { CollapseColumn } from '../../CollapseColumn';
import { ExpandableRowContent } from '../../ExpandableRowContent';
export const collapsible = (value, { rowIndex, columnIndex, rowData, column, property }) => {
    const { extraParams: { onCollapse, rowLabeledBy = 'simple-node', expandId = 'expand-toggle' } } = column;
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
        onCollapse && onCollapse(event, rowIndex, rowData && !rowData.isOpen, rowData, extraData);
    }
    return {
        className: rowData.isOpen !== undefined && css(styles.tableToggle),
        isVisible: !rowData.fullWidth,
        children: (React.createElement(CollapseColumn, { "aria-labelledby": `${rowLabeledBy}${rowIndex} ${expandId}${rowIndex}`, onToggle: onToggle, id: expandId + rowIndex, isOpen: rowData && rowData.isOpen }, value))
    };
};
export const expandable = (value, { rowData }) => rowData && rowData.hasOwnProperty('parent') ? React.createElement(ExpandableRowContent, null, value) : value;
export const expandedRow = (colSpan) => {
    const expandedRowFormatter = (value, { columnIndex, rowIndex, rowData, column: { extraParams: { contentId = 'expanded-content' } } }) => value &&
        rowData.hasOwnProperty('parent') && {
        // todo: rewrite this logic, it is not type safe
        colSpan: !rowData.cells || rowData.cells.length === 1 ? colSpan + !!rowData.fullWidth : 1,
        id: contentId + rowIndex + (columnIndex ? '-' + columnIndex : ''),
        className: rowData.noPadding && css(styles.modifiers.noPadding)
    };
    return expandedRowFormatter;
};
//# sourceMappingURL=collapsible.js.map