"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionList = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const description_list_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DescriptionList/description-list"));
const helpers_1 = require("../../helpers");
const setAutoFitMinModifiers = (autoFitMinModifier) => {
    const prefix = '--pf-c-description-list--GridTemplateColumns--min';
    const mods = autoFitMinModifier;
    return Object.keys(mods || {}).reduce((acc, curr) => curr === 'default' ? Object.assign(Object.assign({}, acc), { [prefix]: mods[curr] }) : Object.assign(Object.assign({}, acc), { [`${prefix}-on-${curr}`]: mods[curr] }), {});
};
exports.DescriptionList = (_a) => {
    var { className = '', children = null, isHorizontal = false, isAutoColumnWidths, isAutoFit, isInlineGrid, columnModifier, autoFitMinModifier, style } = _a, props = tslib_1.__rest(_a, ["className", "children", "isHorizontal", "isAutoColumnWidths", "isAutoFit", "isInlineGrid", "columnModifier", "autoFitMinModifier", "style"]);
    return (React.createElement("dl", Object.assign({ className: react_styles_1.css(description_list_1.default.descriptionList, isHorizontal && description_list_1.default.modifiers.horizontal, isAutoColumnWidths && description_list_1.default.modifiers.autoColumnWidths, isAutoFit && description_list_1.default.modifiers.autoFit, helpers_1.formatBreakpointMods(columnModifier, description_list_1.default), isInlineGrid && description_list_1.default.modifiers.inlineGrid, className), style: autoFitMinModifier || style
            ? Object.assign(Object.assign({}, (isAutoFit ? setAutoFitMinModifiers(autoFitMinModifier) : {})), style) : undefined }, props), children));
};
exports.DescriptionList.displayName = 'DescriptionList';
//# sourceMappingURL=DescriptionList.js.map