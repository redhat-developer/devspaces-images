"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDrawer = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const notification_drawer_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/NotificationDrawer/notification-drawer"));
const react_styles_1 = require("@patternfly/react-styles");
exports.NotificationDrawer = (_a) => {
    var { children, className = '' } = _a, props = tslib_1.__rest(_a, ["children", "className"]);
    return (React.createElement("div", Object.assign({}, props, { className: react_styles_1.css(notification_drawer_1.default.notificationDrawer, className) }), children));
};
exports.NotificationDrawer.displayName = 'NotificationDrawer';
//# sourceMappingURL=NotificationDrawer.js.map