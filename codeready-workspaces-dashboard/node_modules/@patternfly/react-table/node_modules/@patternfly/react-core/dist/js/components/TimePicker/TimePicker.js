"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimePicker = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const select_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Select/select"));
const date_picker_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DatePicker/date-picker"));
const form_control_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/FormControl/form-control"));
const helpers_1 = require("../../helpers");
const Popper_1 = require("../../helpers/Popper/Popper");
const TimeOption_1 = require("./TimeOption");
const Select_1 = require("../Select");
const InputGroup_1 = require("../InputGroup");
const TextInput_1 = require("../TextInput");
const TimePickerUtils_1 = require("./TimePickerUtils");
class TimePicker extends React.Component {
    constructor(props) {
        super(props);
        this.parentRef = React.createRef();
        this.toggleRef = React.createRef();
        this.inputRef = React.createRef();
        this.menuRef = React.createRef();
        this.onDocClick = (event) => {
            const clickedOnToggle = this.parentRef && this.parentRef.current && this.parentRef.current.contains(event.target);
            const clickedWithinMenu = this.menuRef &&
                this.menuRef.current &&
                this.menuRef.current.contains &&
                this.menuRef.current.contains(event.target);
            if (this.state.isOpen && !(clickedOnToggle || clickedWithinMenu)) {
                this.onToggle(false);
            }
        };
        this.handleGlobalKeys = (event) => {
            const { isOpen, focusedIndex } = this.state;
            // keyboard pressed while focus on toggle
            if (this.inputRef && this.inputRef.current && this.inputRef.current.contains(event.target)) {
                if (!isOpen && event.key !== Select_1.KeyTypes.Tab) {
                    this.onToggle(true);
                }
                else if (isOpen) {
                    if (event.key === Select_1.KeyTypes.Escape) {
                        this.onToggle(false);
                    }
                    else if (event.key === Select_1.KeyTypes.Tab) {
                        this.onToggle(false);
                    }
                    else if (event.key === Select_1.KeyTypes.Enter) {
                        if (focusedIndex !== null) {
                            this.onSelect(this.getOptions()[focusedIndex].innerText);
                            event.stopPropagation();
                        }
                        else {
                            this.onToggle(false);
                        }
                    }
                    else if (event.key === Select_1.KeyTypes.ArrowDown) {
                        this.updateFocusedIndex(1);
                        event.preventDefault();
                    }
                    else if (event.key === Select_1.KeyTypes.ArrowUp) {
                        this.updateFocusedIndex(-1);
                        event.preventDefault();
                    }
                }
            }
        };
        this.updateFocusedIndex = (increment) => {
            this.setState(prevState => {
                const maxIndex = this.getOptions().length - 1;
                let nextIndex = prevState.focusedIndex !== null ? prevState.focusedIndex + increment : prevState.scrollIndex;
                if (nextIndex < 0) {
                    nextIndex = maxIndex;
                }
                else if (nextIndex > maxIndex) {
                    nextIndex = 0;
                }
                this.scrollToIndex(nextIndex);
                return {
                    focusedIndex: nextIndex
                };
            });
        };
        this.scrollToIndex = (index) => {
            this.getOptions()[index].offsetParent.scrollTop = this.getOptions()[index].offsetTop;
        };
        this.scrollToSelection = (time) => {
            const { delimiter, is24Hour } = this.props;
            let splitTime = time.split(this.props.delimiter);
            let focusedIndex = null;
            // build out the rest of the time assuming hh:00 if it's a partial time
            if (splitTime.length < 2) {
                time = `${time}${delimiter}00`;
                splitTime = time.split(delimiter);
            }
            // for 12hr variant, autoscroll to pm if it's currently the afternoon, otherwise autoscroll to am
            if (!is24Hour && splitTime.length > 1 && splitTime[1].length < 2) {
                const minutes = splitTime[1].length === 0 ? '00' : splitTime[1] + '0';
                time = `${splitTime[0]}${delimiter}${minutes}${new Date().getHours() > 11 ? TimePickerUtils_1.pmSuffix : TimePickerUtils_1.amSuffix}`;
            }
            else if (!is24Hour &&
                splitTime.length > 1 &&
                splitTime[1].length === 2 &&
                !time.toUpperCase().includes(TimePickerUtils_1.amSuffix.toUpperCase().trim()) &&
                !time.toUpperCase().includes(TimePickerUtils_1.pmSuffix.toUpperCase().trim())) {
                time = `${time}${new Date().getHours() > 11 ? TimePickerUtils_1.pmSuffix : TimePickerUtils_1.amSuffix}`;
            }
            let scrollIndex = this.getOptions().findIndex(option => option.innerText.includes(time.toUpperCase()));
            // if we found an exact match, scroll to match and return index of match for focus
            if (scrollIndex !== -1) {
                this.scrollToIndex(scrollIndex);
                focusedIndex = scrollIndex;
            }
            else if (splitTime.length === 2) {
                // no exact match, scroll to closes match but don't return index for focus
                const minutes = splitTime[1].length === 1 ? splitTime[1] + '0' : '00';
                let amPm = '';
                if ((!is24Hour && splitTime[1].toUpperCase().includes('P')) || (is24Hour && new Date().getHours() > 11)) {
                    amPm = TimePickerUtils_1.pmSuffix;
                }
                else if ((!is24Hour && splitTime[1].toUpperCase().includes('A')) || (is24Hour && new Date().getHours() <= 12)) {
                    amPm = TimePickerUtils_1.amSuffix;
                }
                time = `${splitTime[0]}${delimiter}${minutes}${amPm}`;
                scrollIndex = this.getOptions().findIndex(option => option.innerText.includes(time));
                if (scrollIndex !== -1) {
                    this.scrollToIndex(scrollIndex);
                }
            }
            this.setState({
                focusedIndex,
                scrollIndex
            });
        };
        this.getRegExp = () => this.props.is24Hour
            ? new RegExp(`^\\s*(\\d\\d?)${this.props.delimiter}([0-5])(\\d)\\s*$`)
            : new RegExp(`^\\s*(\\d\\d?)${this.props.delimiter}([0-5])(\\d)\\s*([AaPp][Mm])?\\s*$`);
        this.getOptions = () => (this.menuRef && this.menuRef.current ? Array.from(this.menuRef.current.children) : []);
        this.onToggle = (isOpen) => {
            // on close, parse and validate input
            this.setState(prevState => {
                const { timeRegex, isInvalid } = prevState;
                const { delimiter, is24Hour } = this.props;
                const time = TimePickerUtils_1.parseTime(prevState.timeState, timeRegex, delimiter, !is24Hour);
                return {
                    isOpen,
                    timeState: time,
                    isInvalid: isOpen ? isInvalid : !TimePickerUtils_1.validateTime(time, timeRegex, delimiter, !is24Hour)
                };
            });
        };
        this.onSelect = (selection) => {
            const { timeRegex, timeState } = this.state;
            const { delimiter, is24Hour } = this.props;
            const time = TimePickerUtils_1.parseTime(selection, timeRegex, delimiter, !is24Hour);
            if (time !== timeState) {
                this.onInputChange(time);
            }
            this.setState({
                isOpen: false
            });
        };
        this.onInputFocus = (e) => {
            if (!this.state.isOpen) {
                this.onToggle(true);
            }
            e.stopPropagation();
        };
        this.onInputChange = (newTime) => {
            if (this.props.onChange) {
                this.props.onChange(newTime, TimePickerUtils_1.getHours(newTime, this.state.timeRegex), TimePickerUtils_1.getMinutes(newTime, this.state.timeRegex));
            }
            this.scrollToSelection(newTime);
            this.setState({
                timeState: newTime,
                isInvalid: false
            });
        };
        this.onBlur = (event) => {
            const { timeRegex } = this.state;
            const { delimiter, is24Hour } = this.props;
            this.setState({
                isInvalid: !TimePickerUtils_1.validateTime(TimePickerUtils_1.parseTime(event.currentTarget.value, timeRegex, delimiter, !is24Hour), timeRegex, delimiter, !is24Hour)
            });
        };
        const { is24Hour, delimiter, time } = this.props;
        const timeRegex = this.getRegExp();
        this.state = {
            isInvalid: false,
            isOpen: false,
            timeState: TimePickerUtils_1.parseTime(time, timeRegex, delimiter, !is24Hour),
            focusedIndex: null,
            scrollIndex: 0,
            timeRegex
        };
    }
    componentDidMount() {
        document.addEventListener('mousedown', this.onDocClick);
        document.addEventListener('touchstart', this.onDocClick);
        document.addEventListener('keydown', this.handleGlobalKeys);
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.onDocClick);
        document.removeEventListener('touchstart', this.onDocClick);
        document.removeEventListener('keydown', this.handleGlobalKeys);
    }
    componentDidUpdate(prevProps, prevState) {
        const { timeState, isOpen, isInvalid, timeRegex } = this.state;
        const { time, is24Hour, delimiter } = this.props;
        if (isOpen && !prevState.isOpen && timeState && !isInvalid) {
            this.scrollToSelection(timeState);
        }
        if (delimiter !== prevProps.delimiter) {
            this.setState({
                timeRegex: this.getRegExp()
            });
        }
        if (time !== '' && time !== prevProps.time) {
            this.setState({
                timeState: TimePickerUtils_1.parseTime(time, timeRegex, delimiter, !is24Hour)
            });
        }
    }
    render() {
        const _a = this.props, { 'aria-label': ariaLabel, isDisabled, className, placeholder, id, menuAppendTo, is24Hour, invalidFormatErrorMessage, direction, stepMinutes, width, delimiter, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onChange, time } = _a, props = tslib_1.__rest(_a, ['aria-label', "isDisabled", "className", "placeholder", "id", "menuAppendTo", "is24Hour", "invalidFormatErrorMessage", "direction", "stepMinutes", "width", "delimiter", "onChange", "time"]);
        const { timeState, isOpen, isInvalid, focusedIndex } = this.state;
        const style = { '--pf-c-date-picker__input--c-form-control--Width': width };
        const options = TimePickerUtils_1.makeTimeOptions(stepMinutes, !is24Hour, delimiter);
        const randomId = id || helpers_1.getUniqueId('time-picker');
        const menuContainer = (React.createElement("ul", { ref: this.menuRef, className: react_styles_1.css(select_1.default.selectMenu), role: "listbox", "aria-labelledby": `${id}-input`, style: { maxHeight: '200px', overflowY: 'auto' } }, options.map((option, index) => (React.createElement(TimeOption_1.TimeOption, { key: index, value: option, index: index, onSelect: this.onSelect, isFocused: index === focusedIndex, id: `${id}-option-${index}` })))));
        const inputAndToggle = (React.createElement("div", Object.assign({ className: react_styles_1.css(date_picker_1.default.datePickerInput), style: style }, props),
            React.createElement(InputGroup_1.InputGroup, null,
                React.createElement("div", { className: react_styles_1.css(select_1.default.select, isOpen && select_1.default.modifiers.expanded, direction === Select_1.SelectDirection.up && select_1.default.modifiers.top, className), id: randomId, ref: this.parentRef },
                    React.createElement("div", { ref: this.toggleRef, className: react_styles_1.css(select_1.default.selectToggle, isDisabled && select_1.default.modifiers.disabled, select_1.default.modifiers.typeahead), style: { paddingLeft: '0' } },
                        React.createElement(TextInput_1.TextInput, { className: react_styles_1.css(form_control_1.default.formControl, select_1.default.selectToggleTypeahead), id: `${randomId}-input`, "aria-label": ariaLabel, validated: isInvalid ? 'error' : 'default', placeholder: placeholder, value: timeState || '', type: "text", iconVariant: "clock", onClick: this.onInputFocus, onFocus: this.onInputFocus, onChange: this.onInputChange, onBlur: this.onBlur, autoComplete: "off", isDisabled: isDisabled, ref: this.inputRef })),
                    isOpen && menuAppendTo === 'inline' && menuContainer)),
            isInvalid && (React.createElement("div", { className: react_styles_1.css(date_picker_1.default.datePickerHelperText, date_picker_1.default.modifiers.error) }, invalidFormatErrorMessage))));
        const popperContainer = (React.createElement("div", { className: react_styles_1.css(select_1.default.select, isOpen && select_1.default.modifiers.expanded, className) }, isOpen && menuContainer));
        return (React.createElement("div", { className: react_styles_1.css(date_picker_1.default.datePicker, className) }, menuAppendTo === 'inline' ? (inputAndToggle) : (React.createElement(Popper_1.Popper, { trigger: inputAndToggle, popper: popperContainer, direction: direction, appendTo: menuAppendTo, isVisible: isOpen }))));
    }
}
exports.TimePicker = TimePicker;
TimePicker.displayName = 'TimePicker';
TimePicker.defaultProps = {
    className: '',
    isDisabled: false,
    time: '',
    is24Hour: false,
    invalidFormatErrorMessage: 'Invalid time format',
    placeholder: 'hh:mm',
    delimiter: ':',
    'aria-label': 'Time picker',
    menuAppendTo: 'inline',
    direction: 'down',
    width: 150,
    stepMinutes: 30
};
//# sourceMappingURL=TimePicker.js.map