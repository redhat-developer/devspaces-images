import * as React from 'react';
export interface TimeOptionProps extends Omit<React.HTMLProps<HTMLLIElement>, 'onSelect' | 'value'> {
    /** Additional classes added to the time option. */
    className?: string;
    /** Optional alternate display for the option */
    children?: React.ReactNode;
    /** Internal index of the option */
    index?: number;
    /** The value for the option */
    value: string;
    /** Flag forcing the focused state */
    isFocused?: boolean;
    /** Optional callback for click event */
    onSelect?: (value: string, event: React.MouseEvent) => void;
    /** ID of the item. Required for tracking favorites */
    id?: string;
}
export declare const TimeOption: React.FunctionComponent<TimeOptionProps>;
//# sourceMappingURL=TimeOption.d.ts.map