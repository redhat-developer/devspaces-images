"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatePicker = exports.yyyyMMddFormat = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const date_picker_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DatePicker/date-picker"));
const button_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Button/button"));
const TextInput_1 = require("../TextInput/TextInput");
const Popover_1 = require("../Popover/Popover");
const InputGroup_1 = require("../InputGroup/InputGroup");
const outlined_calendar_alt_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/outlined-calendar-alt-icon"));
const CalendarMonth_1 = require("../CalendarMonth");
exports.yyyyMMddFormat = (date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;
exports.DatePicker = (_a) => {
    var { className, locale = undefined, dateFormat = exports.yyyyMMddFormat, dateParse = (val) => new Date(`${val}T00:00:00`), isDisabled = false, placeholder = 'yyyy-MM-dd', value: valueProp = '', 'aria-label': ariaLabel = 'Date picker', buttonAriaLabel = 'Toggle date picker', onChange = () => undefined, invalidFormatText = 'Invalid date', helperText, appendTo, popoverProps, monthFormat, weekdayFormat, longWeekdayFormat, dayFormat, weekStart, validators = [], rangeStart, style = {} } = _a, props = tslib_1.__rest(_a, ["className", "locale", "dateFormat", "dateParse", "isDisabled", "placeholder", "value", 'aria-label', "buttonAriaLabel", "onChange", "invalidFormatText", "helperText", "appendTo", "popoverProps", "monthFormat", "weekdayFormat", "longWeekdayFormat", "dayFormat", "weekStart", "validators", "rangeStart", "style"]);
    const [value, setValue] = React.useState(valueProp);
    const [valueDate, setValueDate] = React.useState(dateParse(value));
    const [errorText, setErrorText] = React.useState('');
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const [selectOpen, setSelectOpen] = React.useState(false);
    const [pristine, setPristine] = React.useState(true);
    const widthChars = React.useMemo(() => Math.max(dateFormat(new Date()).length, placeholder.length), [dateFormat]);
    style['--pf-c-date-picker__input--c-form-control--width-chars'] = widthChars;
    const buttonRef = React.useRef();
    React.useEffect(() => {
        setValue(valueProp);
        setValueDate(dateParse(valueProp));
    }, [valueProp]);
    const setError = (date) => setErrorText(validators.map(validator => validator(date)).join('\n') || '');
    const onTextInput = (value) => {
        setPristine(false);
        setValue(value);
        const newValueDate = dateParse(value);
        setValueDate(newValueDate);
        if (CalendarMonth_1.isValidDate(newValueDate)) {
            onChange(value, new Date(newValueDate));
        }
        else {
            onChange(value);
        }
    };
    const onInputBlur = () => {
        if (pristine) {
            return;
        }
        const newValueDate = dateParse(value);
        if (CalendarMonth_1.isValidDate(newValueDate)) {
            setError(newValueDate);
        }
        else {
            setErrorText(invalidFormatText);
        }
    };
    const onDateClick = (newValueDate) => {
        const newValue = dateFormat(newValueDate);
        setValue(newValue);
        setValueDate(newValueDate);
        setError(newValueDate);
        setPopoverOpen(false);
        onChange(newValue, new Date(newValueDate));
    };
    const onKeyPress = (ev) => {
        if (ev.key === 'Enter' && value) {
            if (CalendarMonth_1.isValidDate(valueDate)) {
                setError(valueDate);
            }
            else {
                setErrorText(invalidFormatText);
            }
        }
    };
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(date_picker_1.default.datePicker, className), style: style }, props),
        React.createElement(Popover_1.Popover, Object.assign({ position: "bottom", bodyContent: React.createElement(CalendarMonth_1.CalendarMonth, { date: valueDate, onChange: onDateClick, locale: locale, 
                // Use truthy values of strings
                validators: validators.map(validator => (date) => !validator(date)), onSelectToggle: open => setSelectOpen(open), monthFormat: monthFormat, weekdayFormat: weekdayFormat, longWeekdayFormat: longWeekdayFormat, dayFormat: dayFormat, weekStart: weekStart, rangeStart: rangeStart }), showClose: false, isVisible: popoverOpen, shouldClose: (_1, _2, event) => {
                event = event;
                // Let the select menu close
                if (event.keyCode && event.keyCode === 27 && selectOpen) {
                    return false;
                }
                // Let our button handle toggling
                if (buttonRef.current && buttonRef.current.contains(event.target)) {
                    return false;
                }
                setPopoverOpen(false);
                return true;
            }, withFocusTrap: true, hasNoPadding: true, hasAutoWidth: true, appendTo: appendTo }, popoverProps),
            React.createElement("div", { className: date_picker_1.default.datePickerInput },
                React.createElement(InputGroup_1.InputGroup, null,
                    React.createElement(TextInput_1.TextInput, { isDisabled: isDisabled, "aria-label": ariaLabel, placeholder: placeholder, validated: errorText ? 'error' : 'default', value: value, onChange: onTextInput, onBlur: onInputBlur, onKeyPress: onKeyPress }),
                    React.createElement("button", { ref: buttonRef, className: react_styles_1.css(button_1.default.button, button_1.default.modifiers.control), "aria-label": buttonAriaLabel, type: "button", onClick: () => setPopoverOpen(!popoverOpen), disabled: isDisabled },
                        React.createElement(outlined_calendar_alt_icon_1.default, null))))),
        helperText && React.createElement("div", { className: date_picker_1.default.datePickerHelperText }, helperText),
        errorText.trim() && React.createElement("div", { className: react_styles_1.css(date_picker_1.default.datePickerHelperText, date_picker_1.default.modifiers.error) }, errorText)));
};
exports.DatePicker.displayName = 'DatePicker';
//# sourceMappingURL=DatePicker.js.map