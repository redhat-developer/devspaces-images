"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.info = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const HeaderCellInfoWrapper_1 = require("../../HeaderCellInfoWrapper");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
exports.info = ({ tooltip, tooltipProps, popover, popoverProps, className, ariaLabel }) => {
    const infoObj = (value) => ({
        className: table_1.default.modifiers.help,
        children: tooltip ? (React.createElement(HeaderCellInfoWrapper_1.HeaderCellInfoWrapper, { variant: "tooltip", info: tooltip, tooltipProps: tooltipProps, ariaLabel: ariaLabel, className: className }, value)) : (React.createElement(HeaderCellInfoWrapper_1.HeaderCellInfoWrapper, { variant: "popover", info: popover, popoverProps: popoverProps, ariaLabel: ariaLabel, className: className }, value))
    });
    return infoObj;
};
//# sourceMappingURL=info.js.map