"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleGroup = exports.ToggleGroupVariant = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const toggle_group_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/ToggleGroup/toggle-group"));
const ToggleGroupContext_1 = tslib_1.__importDefault(require("./ToggleGroupContext"));
const Divider_1 = require("../Divider");
var ToggleGroupVariant;
(function (ToggleGroupVariant) {
    ToggleGroupVariant["default"] = "default";
    ToggleGroupVariant["light"] = "light";
})(ToggleGroupVariant = exports.ToggleGroupVariant || (exports.ToggleGroupVariant = {}));
exports.ToggleGroup = (_a) => {
    var { className, children, variant = ToggleGroupVariant.default, 'aria-label': ariaLabel } = _a, props = tslib_1.__rest(_a, ["className", "children", "variant", 'aria-label']);
    const toggleGroupItemList = [];
    const length = React.Children.count(children);
    React.Children.forEach(children, (child, index) => {
        toggleGroupItemList.push(child);
        const dividerKey = `${index} divider`;
        if (index !== length - 1) {
            toggleGroupItemList.push(React.createElement(Divider_1.Divider, { key: dividerKey, isVertical: true, component: "div" }));
        }
    });
    return (React.createElement(ToggleGroupContext_1.default.Provider, { value: { variant } },
        React.createElement("div", Object.assign({ className: react_styles_1.css(toggle_group_1.default.toggleGroup, className), role: "group", "aria-label": ariaLabel }, props), toggleGroupItemList)));
};
exports.ToggleGroup.displayName = 'ToggleGroup';
//# sourceMappingURL=ToggleGroup.js.map