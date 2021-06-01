"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsToggle = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const options_menu_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/OptionsMenu/options-menu"));
const react_styles_1 = require("@patternfly/react-styles");
const helpers_1 = require("../../helpers");
const Dropdown_1 = require("../Dropdown");
let toggleId = 0;
exports.OptionsToggle = ({ itemsTitle = 'items', optionsToggle = 'Select', 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
itemsPerPageTitle = 'Items per page', firstIndex = 0, lastIndex = 0, itemCount = 0, widgetId = '', showToggle = true, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
onToggle = (_isOpen) => undefined, isOpen = false, isDisabled = false, parentRef = null, toggleTemplate: ToggleTemplate = '', onEnter = null }) => (React.createElement("div", { className: react_styles_1.css(options_menu_1.default.optionsMenuToggle, isDisabled && options_menu_1.default.modifiers.disabled, options_menu_1.default.modifiers.plain, options_menu_1.default.modifiers.text) }, showToggle && (React.createElement(React.Fragment, null,
    React.createElement("span", { className: react_styles_1.css(options_menu_1.default.optionsMenuToggleText) }, typeof ToggleTemplate === 'string' ? (helpers_1.fillTemplate(ToggleTemplate, { firstIndex, lastIndex, itemCount, itemsTitle })) : (React.createElement(ToggleTemplate, { firstIndex: firstIndex, lastIndex: lastIndex, itemCount: itemCount, itemsTitle: itemsTitle }))),
    React.createElement(Dropdown_1.DropdownToggle, { onEnter: onEnter, "aria-label": optionsToggle, onToggle: onToggle, isDisabled: isDisabled || itemCount <= 0, isOpen: isOpen, id: `${widgetId}-toggle-${toggleId++}`, className: options_menu_1.default.optionsMenuToggleButton, parentRef: parentRef })))));
exports.OptionsToggle.displayName = 'OptionsToggle';
//# sourceMappingURL=OptionsToggle.js.map