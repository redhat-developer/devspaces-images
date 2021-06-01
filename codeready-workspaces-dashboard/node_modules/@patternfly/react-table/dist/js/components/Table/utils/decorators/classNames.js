"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classNames = exports.Visibility = void 0;
const tslib_1 = require("tslib");
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const visibilityModifiers = [
    'hidden',
    'hiddenOnSm',
    'hiddenOnMd',
    'hiddenOnLg',
    'hiddenOnXl',
    'hiddenOn_2xl',
    'visibleOnSm',
    'visibleOnMd',
    'visibleOnLg',
    'visibleOnXl',
    'visibleOn_2xl'
];
exports.Visibility = visibilityModifiers
    .filter(key => table_1.default.modifiers[key])
    .reduce((acc, curr) => {
    const key2 = curr.replace('_2xl', '2Xl');
    acc[key2] = table_1.default.modifiers[curr];
    return acc;
}, {});
exports.classNames = (...classes) => () => ({
    className: react_styles_1.css(...classes)
});
//# sourceMappingURL=classNames.js.map