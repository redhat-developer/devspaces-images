"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleGroup = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const toggle_group_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/ToggleGroup/toggle-group"));
exports.ToggleGroup = (_a) => {
    var { className, children, isCompact = false, 'aria-label': ariaLabel } = _a, props = tslib_1.__rest(_a, ["className", "children", "isCompact", 'aria-label']);
    const toggleGroupItemList = [];
    React.Children.forEach(children, child => {
        toggleGroupItemList.push(child);
    });
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(toggle_group_1.default.toggleGroup, isCompact && toggle_group_1.default.modifiers.compact, className), role: "group", "aria-label": ariaLabel }, props), toggleGroupItemList));
};
exports.ToggleGroup.displayName = 'ToggleGroup';
//# sourceMappingURL=ToggleGroup.js.map