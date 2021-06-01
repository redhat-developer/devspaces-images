"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertGroupInline = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const alert_group_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/AlertGroup/alert-group"));
exports.AlertGroupInline = (_a) => {
    var { className, children, isToast } = _a, rest = tslib_1.__rest(_a, ["className", "children", "isToast"]);
    return (React.createElement("ul", Object.assign({ className: react_styles_1.css(alert_group_1.default.alertGroup, className, isToast ? alert_group_1.default.modifiers.toast : '') }, rest), React.Children.toArray(children).map((Alert, index) => (React.createElement("li", { key: index }, Alert)))));
};
exports.AlertGroupInline.displayName = 'AlertGroupInline';
//# sourceMappingURL=AlertGroupInline.js.map