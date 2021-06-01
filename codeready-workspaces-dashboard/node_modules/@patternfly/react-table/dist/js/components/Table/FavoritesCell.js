"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesCell = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const star_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/star-icon"));
const Button_1 = require("@patternfly/react-core/dist/js/components/Button/Button");
exports.FavoritesCell = (_a) => {
    var { className = '', onFavorite, isFavorited, rowIndex } = _a, props = tslib_1.__rest(_a, ["className", "onFavorite", "isFavorited", "rowIndex"]);
    const ariaProps = rowIndex === undefined
        ? {}
        : {
            id: `favorites-button-${rowIndex}`,
            'aria-labelledby': `favorites-button-${rowIndex}`
        };
    return (React.createElement(Button_1.Button, Object.assign({ variant: "plain", className: className, type: "button", "aria-label": isFavorited ? 'Starred' : 'Not starred', onClick: onFavorite }, ariaProps, props),
        React.createElement(star_icon_1.default, { "aria-hidden": true })));
};
exports.FavoritesCell.displayName = 'FavoritesCell';
//# sourceMappingURL=FavoritesCell.js.map