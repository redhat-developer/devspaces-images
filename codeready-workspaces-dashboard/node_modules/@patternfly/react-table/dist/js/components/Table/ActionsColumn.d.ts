import * as React from 'react';
import { DropdownDirection, DropdownPosition } from '@patternfly/react-core/dist/js/components/Dropdown/dropdownConstants';
import { IAction, IExtraData, IRowData } from './TableTypes';
export interface CustomActionsToggleProps {
    onToggle: (isOpen: boolean) => void;
    isOpen: boolean;
    isDisabled: boolean;
}
export interface ActionsColumnProps {
    children?: React.ReactNode;
    items: IAction[];
    isDisabled?: boolean;
    dropdownPosition?: DropdownPosition;
    dropdownDirection?: DropdownDirection;
    rowData?: IRowData;
    extraData?: IExtraData;
    actionsToggle?: (props: CustomActionsToggleProps) => React.ReactNode;
}
export interface ActionsColumnState {
    isOpen: boolean;
}
export declare class ActionsColumn extends React.Component<ActionsColumnProps, ActionsColumnState> {
    static displayName: string;
    static defaultProps: {
        children: React.ReactNode;
        items: IAction[];
        dropdownPosition: DropdownPosition;
        dropdownDirection: DropdownDirection;
        rowData: IRowData;
        extraData: IExtraData;
    };
    constructor(props: ActionsColumnProps);
    onToggle: (isOpen: boolean) => void;
    onClick: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, onClick: (event: React.MouseEvent, rowIndex: number | undefined, rowData: IRowData, extraData: IExtraData) => void) => void;
    render(): JSX.Element;
}
//# sourceMappingURL=ActionsColumn.d.ts.map