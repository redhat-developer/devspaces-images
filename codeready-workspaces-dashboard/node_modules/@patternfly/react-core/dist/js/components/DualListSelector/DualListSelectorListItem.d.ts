import * as React from 'react';
export interface DualListSelectorListItemProps extends React.HTMLProps<HTMLLIElement> {
    /** Content rendered inside the dual list selector. */
    children?: React.ReactNode;
    /** Additional classes applied to the dual list selector. */
    className?: string;
    /** Flag indicating the list item is currently selected. */
    isSelected?: boolean;
    /** Flag indicating this list item is in the chosen pane. */
    isChosen?: boolean;
    /** Internal callback to pass this ref up to the parent. */
    sendRef?: (optionRef: React.ReactNode, index: number) => void;
    /** Internal field used to keep track of the order of filtered options. */
    filteredIndex?: number;
    /** Internal field used to keep track of order of unfiltered options. */
    orderIndex?: number;
    /** Callback fired when an option is selected.  */
    onOptionSelect?: (e: React.MouseEvent | React.ChangeEvent, index: number, isChosen: boolean) => void;
    /** ID of the option */
    id: string;
}
export declare class DualListSelectorListItem extends React.Component<DualListSelectorListItemProps> {
    private ref;
    static displayName: string;
    componentDidMount(): void;
    componentDidUpdate(): void;
    render(): JSX.Element;
}
//# sourceMappingURL=DualListSelectorListItem.d.ts.map