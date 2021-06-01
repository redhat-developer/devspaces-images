import { __rest } from "tslib";
import * as React from 'react';
import { getDefaultOUIAId } from '@patternfly/react-core';
import { DropdownDirection, DropdownPosition } from "@patternfly/react-core/dist/esm/components/Dropdown/dropdownConstants";
import inlineStyles from '@patternfly/react-styles/css/components/InlineEdit/inline-edit';
import { css } from '@patternfly/react-styles';
import { Provider } from './base';
import { BodyCell } from './BodyCell';
import { HeaderCell } from './HeaderCell';
import { RowWrapper } from './RowWrapper';
import { BodyWrapper } from './BodyWrapper';
import { calculateColumns } from './utils/headerUtils';
import { RowSelectVariant } from './SelectColumn';
import { TableContext } from './TableContext';
import { TableGridBreakpoint } from './TableTypes';
import { TreeRowWrapper } from './TreeRowWrapper';
export class Table extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            ouiaStateId: getDefaultOUIAId(Table.displayName)
        };
        this.isSelected = (row) => row.selected === true;
        this.areAllRowsSelected = (rows) => {
            if (rows === undefined || rows.length === 0) {
                return false;
            }
            return rows.every(row => this.isSelected(row) || (row.hasOwnProperty('parent') && !row.showSelect));
        };
    }
    componentDidMount() {
        if (this.props.onRowEdit && process.env.NODE_ENV !== 'production' && !Table.hasWarnBeta) {
            // eslint-disable-next-line no-console
            console.warn('You are using a beta component feature (onRowEdit). These api parts are subject to change in the future.');
            Table.hasWarnBeta = true;
        }
    }
    render() {
        const _a = this.props, { 'aria-label': ariaLabel, caption, header, onSort, onSelect, canSelectAll, selectVariant, sortBy, children, actions, actionResolver, areActionsDisabled, onCollapse, onExpand, onRowEdit, rowLabeledBy, dropdownPosition, dropdownDirection, actionsToggle, contentId, expandId, variant, rows, cells, bodyWrapper, rowWrapper, role, borders, onFavorite, canSortFavorites } = _a, props = __rest(_a, ['aria-label', "caption", "header", "onSort", "onSelect", "canSelectAll", "selectVariant", "sortBy", "children", "actions", "actionResolver", "areActionsDisabled", "onCollapse", "onExpand", "onRowEdit", "rowLabeledBy", "dropdownPosition", "dropdownDirection", "actionsToggle", "contentId", "expandId", "variant", "rows", "cells", "bodyWrapper", "rowWrapper", "role", "borders", "onFavorite", "canSortFavorites"]);
        if (!ariaLabel && !caption && !header && role !== 'presentation') {
            // eslint-disable-next-line no-console
            console.error('Table: Specify at least one of: header, caption, aria-label');
        }
        const headerData = calculateColumns(cells, {
            sortBy,
            onSort,
            onSelect,
            canSelectAll: selectVariant === RowSelectVariant.radio ? false : canSelectAll,
            selectVariant,
            allRowsSelected: onSelect ? this.areAllRowsSelected(rows) : false,
            actions,
            actionResolver,
            areActionsDisabled,
            onCollapse,
            onRowEdit,
            onExpand,
            rowLabeledBy,
            expandId,
            contentId,
            dropdownPosition,
            dropdownDirection,
            actionsToggle,
            onFavorite,
            canSortFavorites,
            // order of columns: Collapsible | Selectable | Favoritable
            firstUserColumnIndex: [onCollapse, onSelect, onFavorite].filter(callback => callback).length
        });
        const table = (React.createElement(TableContext.Provider, { value: {
                headerData,
                headerRows: null,
                rows
            } },
            header,
            React.createElement(Provider, Object.assign({}, props, { "aria-label": ariaLabel, renderers: {
                    body: {
                        wrapper: bodyWrapper || BodyWrapper,
                        row: rowWrapper || (this.props.isTreeTable ? TreeRowWrapper : RowWrapper),
                        cell: BodyCell
                    },
                    header: {
                        cell: HeaderCell
                    }
                }, columns: headerData, role: role, variant: variant, borders: borders }),
                caption && React.createElement("caption", null, caption),
                children)));
        if (onRowEdit) {
            return React.createElement("form", { className: css(inlineStyles.inlineEdit) }, table);
        }
        return table;
    }
}
Table.displayName = 'Table';
Table.hasWarnBeta = false;
Table.defaultProps = {
    children: null,
    className: '',
    variant: null,
    borders: true,
    rowLabeledBy: 'simple-node',
    expandId: 'expandable-toggle',
    contentId: 'expanded-content',
    dropdownPosition: DropdownPosition.right,
    dropdownDirection: DropdownDirection.down,
    header: undefined,
    caption: undefined,
    'aria-label': undefined,
    gridBreakPoint: TableGridBreakpoint.gridMd,
    role: 'grid',
    canSelectAll: true,
    selectVariant: 'checkbox',
    ouiaSafe: true,
    isStickyHeader: false,
    canSortFavorites: true,
    isTreeTable: false
};
//# sourceMappingURL=Table.js.map