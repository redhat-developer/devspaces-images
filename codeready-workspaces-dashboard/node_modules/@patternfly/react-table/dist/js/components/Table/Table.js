"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_core_1 = require("@patternfly/react-core");
const dropdownConstants_1 = require("@patternfly/react-core/dist/js/components/Dropdown/dropdownConstants");
const inline_edit_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/InlineEdit/inline-edit"));
const react_styles_1 = require("@patternfly/react-styles");
const base_1 = require("./base");
const BodyCell_1 = require("./BodyCell");
const HeaderCell_1 = require("./HeaderCell");
const RowWrapper_1 = require("./RowWrapper");
const BodyWrapper_1 = require("./BodyWrapper");
const headerUtils_1 = require("./utils/headerUtils");
const SelectColumn_1 = require("./SelectColumn");
const TableContext_1 = require("./TableContext");
const TableTypes_1 = require("./TableTypes");
const TreeRowWrapper_1 = require("./TreeRowWrapper");
class Table extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            ouiaStateId: react_core_1.getDefaultOUIAId(Table.displayName)
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
        const _a = this.props, { 'aria-label': ariaLabel, caption, header, onSort, onSelect, canSelectAll, selectVariant, sortBy, children, actions, actionResolver, areActionsDisabled, onCollapse, onExpand, onRowEdit, rowLabeledBy, dropdownPosition, dropdownDirection, actionsToggle, contentId, expandId, variant, rows, cells, bodyWrapper, rowWrapper, role, borders, onFavorite, canSortFavorites } = _a, props = tslib_1.__rest(_a, ['aria-label', "caption", "header", "onSort", "onSelect", "canSelectAll", "selectVariant", "sortBy", "children", "actions", "actionResolver", "areActionsDisabled", "onCollapse", "onExpand", "onRowEdit", "rowLabeledBy", "dropdownPosition", "dropdownDirection", "actionsToggle", "contentId", "expandId", "variant", "rows", "cells", "bodyWrapper", "rowWrapper", "role", "borders", "onFavorite", "canSortFavorites"]);
        if (!ariaLabel && !caption && !header && role !== 'presentation') {
            // eslint-disable-next-line no-console
            console.error('Table: Specify at least one of: header, caption, aria-label');
        }
        const headerData = headerUtils_1.calculateColumns(cells, {
            sortBy,
            onSort,
            onSelect,
            canSelectAll: selectVariant === SelectColumn_1.RowSelectVariant.radio ? false : canSelectAll,
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
        const table = (React.createElement(TableContext_1.TableContext.Provider, { value: {
                headerData,
                headerRows: null,
                rows
            } },
            header,
            React.createElement(base_1.Provider, Object.assign({}, props, { "aria-label": ariaLabel, renderers: {
                    body: {
                        wrapper: bodyWrapper || BodyWrapper_1.BodyWrapper,
                        row: rowWrapper || (this.props.isTreeTable ? TreeRowWrapper_1.TreeRowWrapper : RowWrapper_1.RowWrapper),
                        cell: BodyCell_1.BodyCell
                    },
                    header: {
                        cell: HeaderCell_1.HeaderCell
                    }
                }, columns: headerData, role: role, variant: variant, borders: borders }),
                caption && React.createElement("caption", null, caption),
                children)));
        if (onRowEdit) {
            return React.createElement("form", { className: react_styles_1.css(inline_edit_1.default.inlineEdit) }, table);
        }
        return table;
    }
}
exports.Table = Table;
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
    dropdownPosition: dropdownConstants_1.DropdownPosition.right,
    dropdownDirection: dropdownConstants_1.DropdownDirection.down,
    header: undefined,
    caption: undefined,
    'aria-label': undefined,
    gridBreakPoint: TableTypes_1.TableGridBreakpoint.gridMd,
    role: 'grid',
    canSelectAll: true,
    selectVariant: 'checkbox',
    ouiaSafe: true,
    isStickyHeader: false,
    canSortFavorites: true,
    isTreeTable: false
};
//# sourceMappingURL=Table.js.map