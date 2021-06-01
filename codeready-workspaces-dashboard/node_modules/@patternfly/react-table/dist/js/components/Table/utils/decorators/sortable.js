"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortable = exports.sortableFavorites = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const SortColumn_1 = require("../../SortColumn");
const star_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/star-icon"));
exports.sortableFavorites = (sort) => () => exports.sortable(React.createElement(star_icon_1.default, { "aria-hidden": true }), {
    columnIndex: sort.columnIndex,
    className: table_1.default.modifiers.favorite,
    ariaLabel: 'Sort favorites',
    column: {
        extraParams: {
            sortBy: sort.sortBy,
            onSort: sort === null || sort === void 0 ? void 0 : sort.onSort
        }
    }
});
exports.sortable = (label, { columnIndex, column, property, className, ariaLabel }) => {
    const { extraParams: { sortBy, onSort } } = column;
    const extraData = {
        columnIndex,
        column,
        property
    };
    const isSortedBy = sortBy && columnIndex === sortBy.index;
    /**
     * @param {React.MouseEvent} event - React mouse event
     */
    function sortClicked(event) {
        let reversedDirection;
        if (!isSortedBy) {
            reversedDirection = SortColumn_1.SortByDirection.asc;
        }
        else {
            reversedDirection = sortBy.direction === SortColumn_1.SortByDirection.asc ? SortColumn_1.SortByDirection.desc : SortColumn_1.SortByDirection.asc;
        }
        // tslint:disable-next-line:no-unused-expression
        onSort && onSort(event, columnIndex, reversedDirection, extraData);
    }
    return {
        className: react_styles_1.css(table_1.default.tableSort, isSortedBy && table_1.default.modifiers.selected, className),
        'aria-sort': isSortedBy ? `${sortBy.direction}ending` : 'none',
        children: (React.createElement(SortColumn_1.SortColumn, { isSortedBy: isSortedBy, sortDirection: isSortedBy ? sortBy.direction : '', onSort: sortClicked, "aria-label": ariaLabel }, label))
    };
};
//# sourceMappingURL=sortable.js.map