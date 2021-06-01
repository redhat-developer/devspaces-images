"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarItem = exports.ToolbarItemVariant = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const toolbar_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Toolbar/toolbar"));
const react_styles_1 = require("@patternfly/react-styles");
const util_1 = require("../../helpers/util");
const Divider_1 = require("../Divider");
var ToolbarItemVariant;
(function (ToolbarItemVariant) {
    ToolbarItemVariant["separator"] = "separator";
    ToolbarItemVariant["bulk-select"] = "bulk-select";
    ToolbarItemVariant["overflow-menu"] = "overflow-menu";
    ToolbarItemVariant["pagination"] = "pagination";
    ToolbarItemVariant["search-filter"] = "search-filter";
    ToolbarItemVariant["label"] = "label";
    ToolbarItemVariant["chip-group"] = "chip-group";
    ToolbarItemVariant["expand-all"] = "expand-all";
})(ToolbarItemVariant = exports.ToolbarItemVariant || (exports.ToolbarItemVariant = {}));
exports.ToolbarItem = (_a) => {
    var { className, variant, visibility, visiblity, alignment, spacer, id, children, isAllExpanded } = _a, props = tslib_1.__rest(_a, ["className", "variant", "visibility", "visiblity", "alignment", "spacer", "id", "children", "isAllExpanded"]);
    if (variant === ToolbarItemVariant.separator) {
        return React.createElement(Divider_1.Divider, Object.assign({ className: react_styles_1.css(toolbar_1.default.modifiers.vertical, className) }, props));
    }
    if (visiblity !== undefined) {
        // eslint-disable-next-line no-console
        console.warn('The ToolbarItem visiblity prop has been deprecated. ' +
            'Please use the correctly spelled visibility prop instead.');
    }
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(toolbar_1.default.toolbarItem, variant &&
            toolbar_1.default.modifiers[util_1.toCamel(variant)], isAllExpanded && toolbar_1.default.modifiers.expanded, util_1.formatBreakpointMods(visibility || visiblity, toolbar_1.default), util_1.formatBreakpointMods(alignment, toolbar_1.default), util_1.formatBreakpointMods(spacer, toolbar_1.default), className) }, (variant === 'label' && { 'aria-hidden': true }), { id: id }, props), children));
};
exports.ToolbarItem.displayName = 'ToolbarItem';
//# sourceMappingURL=ToolbarItem.js.map