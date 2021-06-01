import * as React from 'react';
export interface FavoritesCellProps {
    id?: string;
    className?: string;
    onFavorite?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    isFavorited?: boolean;
    rowIndex?: number;
}
export declare const FavoritesCell: React.FunctionComponent<FavoritesCellProps>;
//# sourceMappingURL=FavoritesCell.d.ts.map