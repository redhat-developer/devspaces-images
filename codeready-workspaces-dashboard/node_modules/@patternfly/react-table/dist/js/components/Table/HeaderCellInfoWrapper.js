"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderCellInfoWrapper = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const help_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/help-icon"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const react_core_1 = require("@patternfly/react-core");
const TableText_1 = require("./TableText");
exports.HeaderCellInfoWrapper = ({ children, info, className, variant = 'tooltip', popoverProps, tooltipProps, ariaLabel }) => (React.createElement("div", { className: react_styles_1.css(table_1.default.tableColumnHelp, className) },
    typeof children === 'string' ? React.createElement(TableText_1.TableText, null, children) : children,
    React.createElement("span", { className: react_styles_1.css(table_1.default.tableColumnHelpAction) }, variant === 'tooltip' ? (React.createElement(react_core_1.Tooltip, Object.assign({ content: info }, tooltipProps),
        React.createElement(react_core_1.Button, { variant: "plain", "aria-label": ariaLabel || (typeof info === 'string' && info) || 'More info' },
            React.createElement(help_icon_1.default, { noVerticalAlign: true })))) : (React.createElement(react_core_1.Popover, Object.assign({ bodyContent: info }, popoverProps),
        React.createElement(react_core_1.Button, { variant: "plain", "aria-label": ariaLabel || (typeof info === 'string' && info) || 'More info' },
            React.createElement(help_icon_1.default, { noVerticalAlign: true })))))));
exports.HeaderCellInfoWrapper.displayName = 'HeaderCellInfoWrapper';
//# sourceMappingURL=HeaderCellInfoWrapper.js.map