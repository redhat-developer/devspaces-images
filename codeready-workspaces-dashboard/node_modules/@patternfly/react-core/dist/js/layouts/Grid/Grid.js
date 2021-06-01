"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const grid_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/layouts/Grid/grid"));
const react_styles_1 = require("@patternfly/react-styles");
const sizes_1 = require("../../styles/sizes");
exports.Grid = (_a) => {
    var { children = null, className = '', hasGutter, span = null } = _a, props = tslib_1.__rest(_a, ["children", "className", "hasGutter", "span"]);
    const classes = [grid_1.default.grid, span && grid_1.default.modifiers[`all_${span}Col`]];
    Object.entries(sizes_1.DeviceSizes).forEach(([propKey, gridSpanModifier]) => {
        const key = propKey;
        const propValue = props[key];
        if (propValue) {
            classes.push(grid_1.default.modifiers[`all_${propValue}ColOn${gridSpanModifier}`]);
        }
        delete props[key];
    });
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(...classes, hasGutter && grid_1.default.modifiers.gutter, className) }, props), children));
};
exports.Grid.displayName = 'Grid';
//# sourceMappingURL=Grid.js.map