"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditableSelectInputCell = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const react_core_1 = require("@patternfly/react-core");
const inline_edit_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/InlineEdit/inline-edit"));
const form_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Form/form"));
exports.EditableSelectInputCell = ({ value, rowIndex, cellIndex, onSelect = () => { }, clearSelection, isOpen = false, onToggle = () => { }, selections = [''], options = [], props }) => {
    const onSelectHandler = (event, newValue, isPlaceholder) => {
        onSelect(newValue, event, rowIndex, cellIndex, isPlaceholder);
    };
    const onClear = (event) => {
        clearSelection(rowIndex, cellIndex, event);
    };
    const select = (React.createElement(react_core_1.Select, Object.assign({}, props.editableSelectProps, { onSelect: onSelectHandler }, (clearSelection && { onClear }), { isOpen: isOpen, onToggle: onToggle, selections: selections }), options));
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: inline_edit_1.default.inlineEditValue }, Array.isArray(value) ? value.join(', ') : value),
        React.createElement("div", { className: inline_edit_1.default.inlineEditInput },
            select,
            React.createElement("div", { className: react_styles_1.css(form_1.default.formHelperText, form_1.default.modifiers.error), "aria-live": "polite" }, props.errorText))));
};
exports.EditableSelectInputCell.displayName = 'EditableSelectInputCell';
//# sourceMappingURL=EditableSelectInputCell.js.map