"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollapseColumn = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const angle_down_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-down-icon"));
const react_styles_1 = require("@patternfly/react-styles");
const Button_1 = require("@patternfly/react-core/dist/js/components/Button/Button");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
exports.CollapseColumn = (_a) => {
    var { className = '', children = null, isOpen, onToggle } = _a, props = tslib_1.__rest(_a, ["className", "children", "isOpen", "onToggle"]);
    return (React.createElement(React.Fragment, null,
        isOpen !== undefined && (React.createElement(Button_1.Button, Object.assign({ className: react_styles_1.css(className, isOpen && table_1.default.modifiers.expanded) }, props, { variant: "plain", "aria-label": "Details", onClick: onToggle, "aria-expanded": isOpen }),
            React.createElement("div", { className: react_styles_1.css(table_1.default.tableToggleIcon) },
                React.createElement(angle_down_icon_1.default, null)))),
        children));
};
exports.CollapseColumn.displayName = 'CollapseColumn';
//# sourceMappingURL=CollapseColumn.js.map