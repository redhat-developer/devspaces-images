import * as React from 'react';
import { DualListSelectorTreeItemData } from './DualListSelectorTree';
export interface DualListSelectorTreeItemProps extends React.HTMLProps<HTMLLIElement> {
    /** Content rendered inside the dual list selector. */
    children?: React.ReactNode;
    /** Additional classes applied to the dual list selector. */
    className?: string;
    /** Flag indicating the option is currently selected. */
    isSelected?: boolean;
    /** Flag indicating this option is in the chosen pane. */
    isChosen?: boolean;
    /** Flag indicating this option is expanded by default. */
    defaultExpanded?: boolean;
    /** Flag indicating this option has a badge */
    hasBadge?: boolean;
    /** Callback fired when an option is selected.  */
    onOptionSelect?: (e: React.MouseEvent | React.ChangeEvent, index: number, isChosen: boolean, id?: string, itemData?: any, parentData?: any) => void;
    /** Callback fired when an option is checked */
    onOptionCheck?: (event: React.MouseEvent | React.ChangeEvent<HTMLInputElement>, isChecked: boolean, isChosen: boolean, itemData: DualListSelectorTreeItemData) => void;
    /** ID of the option */
    id: string;
    /** Text of the option */
    text: string;
    /** Parent item of the option */
    parentItem?: DualListSelectorTreeItemData;
    /** Flag indicating if this open is checked. */
    isChecked?: boolean;
    /** Additional properties to pass to the option checkbox */
    checkProps?: any;
    /** Additional properties to pass to the option badge */
    badgeProps?: any;
    /** Raw data of the option */
    itemData?: DualListSelectorTreeItemData;
}
export declare class DualListSelectorTreeItem extends React.Component<DualListSelectorTreeItemProps> {
    private ref;
    static displayName: string;
    state: {
        isExpanded: boolean;
    };
    render(): JSX.Element;
}
//# sourceMappingURL=DualListSelectorTreeItem.d.ts.map