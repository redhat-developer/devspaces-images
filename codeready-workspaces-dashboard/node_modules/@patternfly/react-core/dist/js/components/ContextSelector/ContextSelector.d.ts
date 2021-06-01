import * as React from 'react';
import { ToggleMenuBaseProps } from '../../helpers/Popper/Popper';
import { OUIAProps } from '../../helpers';
export interface ContextSelectorProps extends ToggleMenuBaseProps, OUIAProps {
    /** content rendered inside the Context Selector */
    children?: React.ReactNode;
    /** Classes applied to root element of Context Selector */
    className?: string;
    /** Flag to indicate if Context Selector is opened */
    isOpen?: boolean;
    /** Function callback called when user clicks toggle button */
    onToggle?: (event: any, value: boolean) => void;
    /** Function callback called when user selects item */
    onSelect?: (event: any, value: React.ReactNode) => void;
    /** Labels the Context Selector for Screen Readers */
    screenReaderLabel?: string;
    /** Text that appears in the Context Selector Toggle */
    toggleText?: string;
    /** Aria-label for the Context Selector Search Button */
    searchButtonAriaLabel?: string;
    /** Value in the Search field */
    searchInputValue?: string;
    /** Function callback called when user changes the Search Input */
    onSearchInputChange?: (value: string) => void;
    /** Search Input placeholder */
    searchInputPlaceholder?: string;
    /** Function callback for when Search Button is clicked */
    onSearchButtonClick?: (event?: React.SyntheticEvent<HTMLButtonElement>) => void;
    /** Footer of the context selector */
    footer?: React.ReactNode;
}
export declare class ContextSelector extends React.Component<ContextSelectorProps, {
    ouiaStateId: string;
}> {
    static displayName: string;
    static defaultProps: ContextSelectorProps;
    constructor(props: ContextSelectorProps);
    parentRef: React.RefObject<HTMLDivElement>;
    onEnterPressed: (event: any) => void;
    render(): JSX.Element;
}
//# sourceMappingURL=ContextSelector.d.ts.map