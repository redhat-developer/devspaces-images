"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopoverBody = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const popover_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Popover/popover"));
const react_styles_1 = require("@patternfly/react-styles");
exports.PopoverBody = (_a) => {
    var { children, id } = _a, props = tslib_1.__rest(_a, ["children", "id"]);
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(popover_1.default.popoverBody), id: id }, props), children));
};
exports.PopoverBody.displayName = 'PopoverBody';
//# sourceMappingURL=PopoverBody.js.map