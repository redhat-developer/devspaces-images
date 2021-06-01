"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextInput = exports.TextInputBase = exports.TextInputTypes = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const form_control_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/FormControl/form-control"));
const react_styles_1 = require("@patternfly/react-styles");
const constants_1 = require("../../helpers/constants");
const util_1 = require("../../helpers/util");
var TextInputTypes;
(function (TextInputTypes) {
    TextInputTypes["text"] = "text";
    TextInputTypes["date"] = "date";
    TextInputTypes["datetimeLocal"] = "datetime-local";
    TextInputTypes["email"] = "email";
    TextInputTypes["month"] = "month";
    TextInputTypes["number"] = "number";
    TextInputTypes["password"] = "password";
    TextInputTypes["search"] = "search";
    TextInputTypes["tel"] = "tel";
    TextInputTypes["time"] = "time";
    TextInputTypes["url"] = "url";
})(TextInputTypes = exports.TextInputTypes || (exports.TextInputTypes = {}));
class TextInputBase extends React.Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.handleChange = (event) => {
            if (this.props.onChange) {
                this.props.onChange(event.currentTarget.value, event);
            }
        };
        this.handleResize = () => {
            const inputRef = this.props.innerRef || this.inputRef;
            if (inputRef && inputRef.current) {
                util_1.trimLeft(inputRef.current, String(this.props.value));
            }
        };
        this.restoreText = () => {
            const inputRef = this.props.innerRef || this.inputRef;
            // restore the value
            inputRef.current.value = String(this.props.value);
            // make sure we still see the rightmost value to preserve cursor click position
            inputRef.current.scrollLeft = inputRef.current.scrollWidth;
        };
        this.onFocus = (event) => {
            const { isLeftTruncated, onFocus } = this.props;
            if (isLeftTruncated) {
                this.restoreText();
            }
            onFocus && onFocus(event);
        };
        this.onBlur = (event) => {
            const { isLeftTruncated, onBlur } = this.props;
            if (isLeftTruncated) {
                this.handleResize();
            }
            onBlur && onBlur(event);
        };
        if (!props.id && !props['aria-label'] && !props['aria-labelledby']) {
            // eslint-disable-next-line no-console
            console.error('Text input:', 'Text input requires either an id or aria-label to be specified');
        }
    }
    componentDidMount() {
        if (this.props.isLeftTruncated) {
            this.handleResize();
            window.addEventListener('resize', util_1.debounce(this.handleResize, 250));
        }
    }
    componentWillUnmount() {
        if (this.props.isLeftTruncated) {
            window.removeEventListener('resize', util_1.debounce(this.handleResize, 250));
        }
    }
    render() {
        const _a = this.props, { innerRef, className, type, value, validated, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onChange, onFocus, onBlur, isLeftTruncated, 
        /* eslint-enable @typescript-eslint/no-unused-vars */
        isReadOnly, isRequired, isDisabled, iconVariant, customIconUrl, customIconDimensions } = _a, props = tslib_1.__rest(_a, ["innerRef", "className", "type", "value", "validated", "onChange", "onFocus", "onBlur", "isLeftTruncated", "isReadOnly", "isRequired", "isDisabled", "iconVariant", "customIconUrl", "customIconDimensions"]);
        const customIconStyle = {};
        if (customIconUrl) {
            customIconStyle.backgroundImage = `url('${customIconUrl}')`;
        }
        if (customIconDimensions) {
            customIconStyle.backgroundSize = customIconDimensions;
        }
        return (React.createElement("input", Object.assign({}, props, { onFocus: this.onFocus, onBlur: this.onBlur, className: react_styles_1.css(form_control_1.default.formControl, validated === constants_1.ValidatedOptions.success && form_control_1.default.modifiers.success, validated === constants_1.ValidatedOptions.warning && form_control_1.default.modifiers.warning, ((iconVariant && iconVariant !== 'search') || customIconUrl) && form_control_1.default.modifiers.icon, iconVariant && form_control_1.default.modifiers[iconVariant], className), onChange: this.handleChange, type: type, value: value, "aria-invalid": validated === constants_1.ValidatedOptions.error, required: isRequired, disabled: isDisabled, readOnly: isReadOnly, ref: innerRef || this.inputRef }, ((customIconUrl || customIconDimensions) && { style: customIconStyle }))));
    }
}
exports.TextInputBase = TextInputBase;
TextInputBase.displayName = 'TextInputBase';
TextInputBase.defaultProps = {
    'aria-label': null,
    className: '',
    isRequired: false,
    validated: 'default',
    isDisabled: false,
    isReadOnly: false,
    type: TextInputTypes.text,
    isLeftTruncated: false,
    onChange: () => undefined
};
exports.TextInput = React.forwardRef((props, ref) => (React.createElement(TextInputBase, Object.assign({}, props, { innerRef: ref }))));
exports.TextInput.displayName = 'TextInput';
//# sourceMappingURL=TextInput.js.map