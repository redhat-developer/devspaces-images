"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritable = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const FavoritesCell_1 = require("../../FavoritesCell");
exports.favoritable = (value, { rowIndex, columnIndex, rowData, column, property }) => {
    const { extraParams: { onFavorite } } = column;
    const extraData = {
        rowIndex,
        columnIndex,
        column,
        property
    };
    // this is a child row which should not display the favorites icon
    if (rowData && rowData.hasOwnProperty('parent') && !rowData.fullWidth) {
        return {
            component: 'td',
            isVisible: true
        };
    }
    /**
     * @param {React.MouseEvent} event - Mouse event
     */
    function favoritesClick(event) {
        // tslint:disable-next-line:no-unused-expression
        onFavorite && onFavorite(event, rowData && !rowData.favorited, rowIndex, rowData, extraData);
    }
    const additionalProps = rowData.favoritesProps || {};
    return {
        className: react_styles_1.css(table_1.default.tableFavorite, rowData && rowData.favorited && table_1.default.modifiers.favorited),
        isVisible: !rowData || !rowData.fullWidth,
        children: (React.createElement(FavoritesCell_1.FavoritesCell, Object.assign({ rowIndex: rowIndex, onFavorite: favoritesClick, isFavorited: rowData && rowData.favorited }, additionalProps)))
    };
};
//# sourceMappingURL=favoritable.js.map