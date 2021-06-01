import * as React from 'react';
export interface TimePickerProps extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange' | 'onFocus' | 'onBlur' | 'disabled' | 'ref'> {
    /** Additional classes added to the time picker. */
    className?: string;
    /** Accessible label for the time picker */
    'aria-label'?: string;
    /** Flag indicating the time picker is disabled */
    isDisabled?: boolean;
    /** String to display in the empty time picker field as a hint for the expected time format */
    placeholder?: string;
    /** Character to display between the hour and minute */
    delimiter?: string;
    /** A time string. The format could be  an ISO 8601 formatted date string or in 'HH{delimiter}MM' format */
    time?: string | Date;
    /** Error message to display when the time is provided in an invalid format. */
    invalidFormatErrorMessage?: string;
    /** True if the time is 24 hour time. False if the time is 12 hour time */
    is24Hour?: boolean;
    /** Optional event handler called each time the value in the time picker input changes. */
    onChange?: (time: string, hour?: number, minute?: number) => void;
    /** Optional validator can be provided to override the internal time validator. */
    validateTime?: (time: string) => boolean;
    /** Id of the time picker */
    id?: string;
    /** Width of the time picker. */
    width?: string;
    /** The container to append the menu to. Defaults to 'inline'
     * If your menu is being cut off you can append it to an element higher up the DOM tree.
     * Some examples:
     * menuAppendTo={() => document.body}
     * menuAppendTo={document.getElementById('target')}
     */
    menuAppendTo?: HTMLElement | (() => HTMLElement) | 'inline';
    /** Flag specifying which direction the time picker menu expands */
    direction?: 'up' | 'down';
    /** Size of step between time options in minutes.*/
    stepMinutes?: number;
}
interface TimePickerState {
    isInvalid: boolean;
    isOpen: boolean;
    timeState: string;
    focusedIndex: number;
    scrollIndex: number;
    timeRegex: RegExp;
}
export declare class TimePicker extends React.Component<TimePickerProps, TimePickerState> {
    static displayName: string;
    private parentRef;
    private toggleRef;
    private inputRef;
    private menuRef;
    static defaultProps: {
        className: string;
        isDisabled: boolean;
        time: string;
        is24Hour: boolean;
        invalidFormatErrorMessage: string;
        placeholder: string;
        delimiter: string;
        'aria-label': string;
        menuAppendTo: string;
        direction: string;
        width: number;
        stepMinutes: number;
    };
    constructor(props: TimePickerProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    onDocClick: (event: MouseEvent | TouchEvent) => void;
    handleGlobalKeys: (event: KeyboardEvent) => void;
    componentDidUpdate(prevProps: TimePickerProps, prevState: TimePickerState): void;
    updateFocusedIndex: (increment: number) => void;
    scrollToIndex: (index: number) => void;
    scrollToSelection: (time: string) => void;
    getRegExp: () => RegExp;
    getOptions: () => HTMLElement[];
    onToggle: (isOpen: boolean) => void;
    onSelect: (selection: string) => void;
    onInputFocus: (e: any) => void;
    onInputChange: (newTime: string) => void;
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=TimePicker.d.ts.map