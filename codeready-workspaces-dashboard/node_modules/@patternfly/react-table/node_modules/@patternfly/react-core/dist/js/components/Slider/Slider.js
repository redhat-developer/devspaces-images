"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slider = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_1 = require("react");
const slider_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Slider/slider"));
const react_styles_1 = require("@patternfly/react-styles");
const SliderStep_1 = require("./SliderStep");
const InputGroup_1 = require("../InputGroup");
const TextInput_1 = require("../TextInput");
const getPercentage = (current, max) => (100 * current) / max;
exports.Slider = (_a) => {
    var { className, value = 0, customSteps, areCustomStepsContinuous = false, isDisabled = false, isInputVisible = false, inputValue = 0, inputLabel, inputAriaLabel = 'Slider value input', thumbAriaLabel = 'Value', inputPosition = 'right', onChange, leftActions, rightActions, step = 1, min = 0, max = 100, showTicks = false, showBoundaries = true } = _a, props = tslib_1.__rest(_a, ["className", "value", "customSteps", "areCustomStepsContinuous", "isDisabled", "isInputVisible", "inputValue", "inputLabel", "inputAriaLabel", "thumbAriaLabel", "inputPosition", "onChange", "leftActions", "rightActions", "step", "min", "max", "showTicks", "showBoundaries"]);
    const sliderRailRef = React.useRef();
    const thumbRef = React.useRef();
    const [localValue, setValue] = react_1.useState(value);
    const [localInputValue, setLocalInputValue] = react_1.useState(inputValue);
    React.useEffect(() => {
        setValue(value);
    }, [value]);
    React.useEffect(() => {
        setLocalInputValue(inputValue);
    }, [inputValue]);
    let diff = 0;
    let snapValue;
    // calculate style value percentage
    const stylePercent = ((localValue - min) * 100) / (max - min);
    const style = { '--pf-c-slider--value': `${stylePercent}%` };
    const onChangeHandler = (value) => {
        setLocalInputValue(Number(value));
    };
    const handleKeyPressOnInput = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (onChange) {
                onChange(localValue, localInputValue);
            }
        }
    };
    const onInputFocus = (e) => {
        e.stopPropagation();
    };
    const onThumbClick = () => {
        thumbRef.current.focus();
    };
    const onBlur = () => {
        if (onChange) {
            onChange(localValue, localInputValue);
        }
    };
    const findAriaTextValue = () => {
        if (!areCustomStepsContinuous && customSteps) {
            const matchingStep = customSteps.find(stepObj => stepObj.value === localValue);
            if (matchingStep) {
                return matchingStep.label;
            }
        }
        return localValue.toString();
    };
    const handleThumbDragEnd = () => {
        document.removeEventListener('mousemove', callbackThumbMove);
        document.removeEventListener('mouseup', callbackThumbUp);
        document.removeEventListener('touchmove', callbackThumbMove);
        document.removeEventListener('touchend', callbackThumbUp);
        document.removeEventListener('touchcancel', callbackThumbUp);
    };
    const handleMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        diff = e.clientX - thumbRef.current.getBoundingClientRect().left;
        document.addEventListener('mousemove', callbackThumbMove);
        document.addEventListener('mouseup', callbackThumbUp);
    };
    const handleTouchStart = (e) => {
        e.stopPropagation();
        diff = e.touches[0].clientX - thumbRef.current.getBoundingClientRect().left;
        document.addEventListener('touchmove', callbackThumbMove, { passive: false });
        document.addEventListener('touchend', callbackThumbUp);
        document.addEventListener('touchcancel', callbackThumbUp);
    };
    const onSliderRailClick = (e) => {
        handleThumbMove(e);
        if (snapValue && !areCustomStepsContinuous) {
            thumbRef.current.style.setProperty('--pf-c-slider--value', `${snapValue}%`);
            setValue(snapValue);
            if (onChange) {
                onChange(snapValue);
            }
        }
    };
    const handleThumbMove = (e) => {
        if (e.type === 'touchmove') {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
        const clientPosition = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
        let newPosition = clientPosition - diff - sliderRailRef.current.getBoundingClientRect().left;
        const end = sliderRailRef.current.offsetWidth - thumbRef.current.offsetWidth;
        const start = 0;
        if (newPosition < start) {
            newPosition = 0;
        }
        if (newPosition > end) {
            newPosition = end;
        }
        const newPercentage = getPercentage(newPosition, end);
        thumbRef.current.style.setProperty('--pf-c-slider--value', `${newPercentage}%`);
        // convert percentage to value
        const newValue = (newPercentage * (max - min)) / 100 + min;
        setValue(newValue);
        if (!customSteps) {
            // snap to new value if not custom steps
            snapValue = Math.round((newValue - min) / step) * step + min;
            thumbRef.current.style.setProperty('--pf-c-slider--value', `${snapValue}%`);
            setValue(snapValue);
        }
        /* If custom steps are discrete, snap to closest step value */
        if (!areCustomStepsContinuous && customSteps) {
            const stepIndex = customSteps.findIndex(stepObj => stepObj.value >= newPercentage);
            if (customSteps[stepIndex].value === newPercentage) {
                snapValue = customSteps[stepIndex].value;
            }
            else {
                const midpoint = (customSteps[stepIndex].value + customSteps[stepIndex - 1].value) / 2;
                if (midpoint > newPercentage) {
                    snapValue = customSteps[stepIndex - 1].value;
                }
                else {
                    snapValue = customSteps[stepIndex].value;
                }
            }
            setValue(snapValue);
        }
        // Call onchange callback
        if (onChange) {
            if (snapValue !== undefined) {
                onChange(snapValue);
            }
            else {
                onChange(newValue);
            }
        }
    };
    const callbackThumbMove = React.useCallback(handleThumbMove, []);
    const callbackThumbUp = React.useCallback(handleThumbDragEnd, []);
    const handleThumbKeys = (e) => {
        const key = e.key;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') {
            return;
        }
        e.preventDefault();
        let newValue = localValue;
        if (!areCustomStepsContinuous && customSteps) {
            const stepIndex = customSteps.findIndex(stepObj => stepObj.value === localValue);
            if (key === 'ArrowRight') {
                if (stepIndex + 1 < customSteps.length) {
                    {
                        newValue = customSteps[stepIndex + 1].value;
                    }
                }
            }
            else if (key === 'ArrowLeft') {
                if (stepIndex - 1 >= 0) {
                    newValue = customSteps[stepIndex - 1].value;
                }
            }
        }
        else {
            if (key === 'ArrowRight') {
                newValue = localValue + step <= max ? localValue + step : max;
            }
            else if (key === 'ArrowLeft') {
                newValue = localValue - step >= min ? localValue - step : min;
            }
        }
        if (newValue !== localValue) {
            thumbRef.current.style.setProperty('--pf-c-slider--value', `${newValue}%`);
            setValue(newValue);
            if (onChange) {
                onChange(newValue);
            }
        }
    };
    const displayInput = () => {
        const textInput = (React.createElement(TextInput_1.TextInput, { className: react_styles_1.css(slider_1.default.formControl), isDisabled: isDisabled, type: "number", value: localInputValue, "aria-label": inputAriaLabel, onKeyDown: handleKeyPressOnInput, onChange: onChangeHandler, onClick: onInputFocus, onFocus: onInputFocus, onBlur: onBlur }));
        if (inputLabel) {
            return (React.createElement(InputGroup_1.InputGroup, null,
                textInput,
                React.createElement(InputGroup_1.InputGroupText, { variant: "plain" },
                    " ",
                    inputLabel)));
        }
        else {
            return textInput;
        }
    };
    const buildSteps = () => {
        const builtSteps = [];
        for (let i = min; i <= max; i = i + step) {
            const stepValue = ((i - min) * 100) / (max - min);
            builtSteps.push(React.createElement(SliderStep_1.SliderStep, { key: i, value: stepValue, label: i.toString(), isLabelHidden: (i === min || i === max) && showBoundaries ? false : true, isActive: i <= localValue }));
        }
        return builtSteps;
    };
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(slider_1.default.slider, className, isDisabled && slider_1.default.modifiers.disabled), style: style }, props),
        leftActions && React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderActions) }, leftActions),
        React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderMain) },
            React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderRail), ref: sliderRailRef, onClick: !isDisabled ? onSliderRailClick : null },
                React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderRailTrack) })),
            customSteps && (React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderSteps), "aria-hidden": "true" }, customSteps.map(stepObj => (React.createElement(SliderStep_1.SliderStep, { key: stepObj.value, value: stepObj.value, label: stepObj.label, isLabelHidden: stepObj.isLabelHidden, isActive: stepObj.value <= localValue }))))),
            !customSteps && showTicks && (React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderSteps), "aria-hidden": "true" }, buildSteps())),
            React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderThumb), ref: thumbRef, tabIndex: isDisabled ? -1 : 0, role: "slider", "aria-valuemin": customSteps ? customSteps[0].value : min, "aria-valuemax": customSteps ? customSteps[customSteps.length - 1].value : max, "aria-valuenow": localValue, "aria-valuetext": findAriaTextValue(), "aria-label": thumbAriaLabel, "aria-disabled": isDisabled, onMouseDown: !isDisabled ? handleMouseDown : null, onTouchStart: !isDisabled ? handleTouchStart : null, onKeyDown: !isDisabled ? handleThumbKeys : null, onClick: !isDisabled ? onThumbClick : null }),
            isInputVisible && inputPosition === 'aboveThumb' && (React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderValue, slider_1.default.modifiers.floating) }, displayInput()))),
        isInputVisible && inputPosition === 'right' && React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderValue) }, displayInput()),
        rightActions && React.createElement("div", { className: react_styles_1.css(slider_1.default.sliderActions) }, rightActions)));
};
exports.Slider.displayName = 'Slider';
//# sourceMappingURL=Slider.js.map