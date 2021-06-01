import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import { FavoritesCell } from '../../FavoritesCell';
export const favoritable = (value, { rowIndex, columnIndex, rowData, column, property }) => {
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
        className: css(styles.tableFavorite, rowData && rowData.favorited && styles.modifiers.favorited),
        isVisible: !rowData || !rowData.fullWidth,
        children: (React.createElement(FavoritesCell, Object.assign({ rowIndex: rowIndex, onFavorite: favoritesClick, isFavorited: rowData && rowData.favorited }, additionalProps)))
    };
};
//# sourceMappingURL=favoritable.js.map