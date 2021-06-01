"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeOption = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const select_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Select/select"));
exports.TimeOption = (_a) => {
    var { className = '', value = '', onSelect = () => { }, children, id, isFocused } = _a, props = tslib_1.__rest(_a, ["className", "value", "onSelect", "children", "id", "isFocused"]);
    return (React.createElement("li", Object.assign({ role: "presentation", className: react_styles_1.css(select_1.default.selectMenuWrapper, isFocused && select_1.default.modifiers.focus, className) }, props),
        React.createElement("button", { className: react_styles_1.css(select_1.default.selectMenuItem), onClick: event => {
                onSelect(value, event);
            }, role: "option", type: "button", id: id }, children || value.toString())));
};
exports.TimeOption.displayName = 'TimeOption';
//# sourceMappingURL=TimeOption.js.map