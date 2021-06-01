"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditableTextCell = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const TextInput_1 = require("@patternfly/react-core/dist/js/components/TextInput");
const inline_edit_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/InlineEdit/inline-edit"));
const form_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Form/form"));
const react_styles_1 = require("@patternfly/react-styles");
exports.EditableTextCell = ({ value, rowIndex, cellIndex, props, handleTextInputChange, inputAriaLabel, isDisabled = false }) => (React.createElement(React.Fragment, null,
    React.createElement("div", { className: inline_edit_1.default.inlineEditValue }, value),
    React.createElement("div", { className: inline_edit_1.default.inlineEditInput },
        React.createElement(TextInput_1.TextInput, { isDisabled: isDisabled, value: props.editableValue !== undefined ? props.editableValue : value, validated: props.isValid !== false ? 'default' : 'error', type: "text", onChange: (newValue, event) => {
                handleTextInputChange(newValue, event, rowIndex, cellIndex);
            }, "aria-label": inputAriaLabel }),
        React.createElement("div", { className: react_styles_1.css(form_1.default.formHelperText, form_1.default.modifiers.error), "aria-live": "polite" }, props.errorText))));
exports.EditableTextCell.displayName = 'EditableTextCell';
//# sourceMappingURL=EditableTextCell.js.map