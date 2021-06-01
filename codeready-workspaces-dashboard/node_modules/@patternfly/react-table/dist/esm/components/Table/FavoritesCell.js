import { __rest } from "tslib";
import * as React from 'react';
import StarIcon from "@patternfly/react-icons/dist/esm/icons/star-icon";
import { Button } from "@patternfly/react-core/dist/esm/components/Button/Button";
export const FavoritesCell = (_a) => {
    var { className = '', onFavorite, isFavorited, rowIndex } = _a, props = __rest(_a, ["className", "onFavorite", "isFavorited", "rowIndex"]);
    const ariaProps = rowIndex === undefined
        ? {}
        : {
            id: `favorites-button-${rowIndex}`,
            'aria-labelledby': `favorites-button-${rowIndex}`
        };
    return (React.createElement(Button, Object.assign({ variant: "plain", className: className, type: "button", "aria-label": isFavorited ? 'Starred' : 'Not starred', onClick: onFavorite }, ariaProps, props),
        React.createElement(StarIcon, { "aria-hidden": true })));
};
FavoritesCell.displayName = 'FavoritesCell';
//# sourceMappingURL=FavoritesCell.js.map