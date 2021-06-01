import * as React from 'react';
import { DropdownPosition } from './dropdownConstants';
export interface DropdownMenuProps {
    /** Anything which can be rendered as dropdown items */
    children?: React.ReactNode;
    /** Classess applied to root element of dropdown menu */
    className?: string;
    /** Flag to indicate if menu is opened */
    isOpen?: boolean;
    /** @deprecated - no longer used */
    openedOnEnter?: boolean;
    /** Flag to indicate if the first dropdown item should gain initial focus, set false when adding
     * a specific auto-focus item (like a current selection) otherwise leave as true
     */
    autoFocus?: boolean;
    /** Indicates which component will be used as dropdown menu */
    component?: React.ReactNode;
    /** Indicates where menu will be alligned horizontally */
    position?: DropdownPosition | 'right' | 'left';
    /** Flag to indicate if menu is grouped */
    isGrouped?: boolean;
    setMenuComponentRef?: any;
}
export interface DropdownMenuItem extends React.HTMLAttributes<any> {
    isDisabled: boolean;
    disabled: boolean;
    isHovered: boolean;
    ref: HTMLElement;
}
export declare class DropdownMenu extends React.Component<DropdownMenuProps> {
    static displayName: string;
    refsCollection: HTMLElement[][];
    static defaultProps: DropdownMenuProps;
    componentDidMount(): void;
    componentWillUnmount: () => void;
    static validToggleClasses: string[];
    static focusFirstRef: (refCollection: HTMLElement[]) => void;
    onKeyDown: (event: any) => void;
    shouldComponentUpdate(): boolean;
    childKeyHandler: (index: number, innerIndex: number, position: string, custom?: boolean) => void;
    sendRef: (index: number, nodes: any[], isDisabled: boolean, isSeparator: boolean) => void;
    extendChildren(): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)>[];
    render(): JSX.Element;
}
//# sourceMappingURL=DropdownMenu.d.ts.map