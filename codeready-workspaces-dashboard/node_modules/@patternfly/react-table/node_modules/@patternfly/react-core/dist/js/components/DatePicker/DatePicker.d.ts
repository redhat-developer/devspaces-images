import * as React from 'react';
import { PopoverProps } from '../Popover/Popover';
import { CalendarFormat } from '../CalendarMonth';
export interface DatePickerProps extends CalendarFormat, Omit<React.HTMLProps<HTMLInputElement>, 'onChange' | 'onFocus' | 'onBlur' | 'disabled' | 'ref'> {
    /** Additional classes added to the date time picker. */
    className?: string;
    /** Accessible label for the date picker */
    'aria-label'?: string;
    /** How to format the date in the TextInput */
    dateFormat?: (date: Date) => string;
    /** How to format the date in the TextInput */
    dateParse?: (value: string) => Date;
    /** Flag indicating the date picker is disabled*/
    isDisabled?: boolean;
    /** String to display in the empty date picker field as a hint for the expected date format */
    placeholder?: string;
    /** Value of TextInput */
    value?: string;
    /** Error message to display when the TextInput cannot be parsed. */
    invalidFormatText?: string;
    /** Callback called every time the input value changes */
    onChange?: (value: string, date?: Date) => void;
    /** Text for label */
    helperText?: React.ReactNode;
    /** Aria label for the button to open the date picker */
    buttonAriaLabel?: string;
    /** The element to append the popover to */
    appendTo?: HTMLElement | ((ref?: HTMLElement) => HTMLElement);
    /** Props to pass to the Popover */
    popoverProps?: Omit<PopoverProps, 'appendTo'>;
    /** Functions that returns an error message if a date is invalid */
    validators?: ((date: Date) => string)[];
}
export declare const yyyyMMddFormat: (date: Date) => string;
export declare const DatePicker: React.FunctionComponent<DatePickerProps>;
//# sourceMappingURL=DatePicker.d.ts.map