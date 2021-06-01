"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeaderToolsItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const page_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Page/page"));
const react_styles_1 = require("@patternfly/react-styles");
const util_1 = require("../../helpers/util");
exports.PageHeaderToolsItem = ({ children, id, className, visibility, isSelected }) => (React.createElement("div", { className: react_styles_1.css(page_1.default.pageHeaderToolsItem, isSelected && page_1.default.modifiers.selected, util_1.formatBreakpointMods(visibility, page_1.default), className), id: id }, children));
exports.PageHeaderToolsItem.displayName = 'PageHeaderToolsItem';
//# sourceMappingURL=PageHeaderToolsItem.js.map