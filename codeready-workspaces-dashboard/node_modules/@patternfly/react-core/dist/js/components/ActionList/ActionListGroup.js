"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionListGroup = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const action_list_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/ActionList/action-list"));
exports.ActionListGroup = (_a) => {
    var { children } = _a, props = tslib_1.__rest(_a, ["children"]);
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(action_list_1.default.actionListGroup) }, props), children));
};
exports.ActionListGroup.displayName = 'ActionListGroup';
//# sourceMappingURL=ActionListGroup.js.map