"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const flex_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/layouts/Flex/flex"));
const util_1 = require("../../helpers/util");
exports.FlexItem = (_a) => {
    var { children = null, className = '', spacer, grow, shrink, flex, alignSelf, align, fullWidth } = _a, props = tslib_1.__rest(_a, ["children", "className", "spacer", "grow", "shrink", "flex", "alignSelf", "align", "fullWidth"]);
    return (React.createElement("div", Object.assign({}, props, { className: react_styles_1.css(util_1.formatBreakpointMods(spacer, flex_1.default), util_1.formatBreakpointMods(grow, flex_1.default), util_1.formatBreakpointMods(shrink, flex_1.default), util_1.formatBreakpointMods(flex, flex_1.default), util_1.formatBreakpointMods(alignSelf, flex_1.default), util_1.formatBreakpointMods(align, flex_1.default), util_1.formatBreakpointMods(fullWidth, flex_1.default), className) }), children));
};
exports.FlexItem.displayName = 'FlexItem';
//# sourceMappingURL=FlexItem.js.map