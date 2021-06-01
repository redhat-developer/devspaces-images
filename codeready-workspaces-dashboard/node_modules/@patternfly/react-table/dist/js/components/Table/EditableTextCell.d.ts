import * as React from 'react';
export interface IEditableTextCell extends React.HTMLProps<HTMLDivElement> {
    /** The current value of the text input */
    value: string;
    /** Row index of this text cell */
    rowIndex: number;
    /** Cell index of this text cell */
    cellIndex: number;
    /** Data structure containing:
     * value - to display in the cell,
     * name - of the text input,
     * arbitrary data to pass to the internal text input in the editable text cell */
    props: {
        name: string;
        value: string;
        [key: string]: any;
    };
    /** Event handler which fires when user changes the text in this cell */
    handleTextInputChange: (newValue: string, event: React.FormEvent<HTMLInputElement>, rowIndex: number, cellIndex: number) => void;
    /** accessible label of the text input */
    inputAriaLabel: string;
    /** flag indicating if the text input is disabled */
    isDisabled?: boolean;
}
export declare const EditableTextCell: React.FunctionComponent<IEditableTextCell>;
//# sourceMappingURL=EditableTextCell.d.ts.map