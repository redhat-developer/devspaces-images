import * as React from 'react';
export interface ToolbarProps extends React.HTMLProps<HTMLDivElement> {
    /** Optional callback for clearing all filters in the toolbar */
    clearAllFilters?: () => void;
    /** Text to display in the clear all filters button */
    clearFiltersButtonText?: string;
    /** The breakpoint at which the listed fitlers in chip groups are collapsed down to a summary */
    collapseListedFiltersBreakpoint?: 'all' | 'md' | 'lg' | 'xl' | '2xl';
    /** Flag indicating if a data toolbar toggle group's expandable content is expanded */
    isExpanded?: boolean;
    /** A callback for setting the isExpanded flag */
    toggleIsExpanded?: () => void;
    /** Classes applied to root element of the data toolbar */
    className?: string;
    /** Content to be rendered as rows in the data toolbar */
    children?: React.ReactNode;
    /** Id of the data toolbar */
    id?: string;
    /** Flag indicating the toolbar should use the Page insets */
    usePageInsets?: boolean;
    /** Insets at various breakpoints. */
    inset?: {
        default?: 'insetNone' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl';
        sm?: 'insetNone' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl';
        md?: 'insetNone' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl';
        lg?: 'insetNone' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl';
        xl?: 'insetNone' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl';
        '2xl'?: 'insetNone' | 'insetSm' | 'insetMd' | 'insetLg' | 'insetXl' | 'inset2xl';
    };
}
export interface ToolbarState {
    /** Flag used if the user has opted NOT to manage the 'isExpanded' state of the toggle group.
     *  Indicates whether or not the toggle group is expanded. */
    isManagedToggleExpanded: boolean;
    /** Object managing information about how many chips are in each chip group */
    filterInfo: FilterInfo;
}
interface FilterInfo {
    [key: string]: number;
}
export declare class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
    static displayName: string;
    chipGroupContentRef: React.RefObject<HTMLDivElement>;
    staticFilterInfo: {};
    state: {
        isManagedToggleExpanded: boolean;
        filterInfo: {};
    };
    isToggleManaged: () => boolean;
    toggleIsExpanded: () => void;
    closeExpandableContent: () => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    updateNumberFilters: (categoryName: string, numberOfFilters: number) => void;
    getNumberOfFilters: () => number;
    renderToolbar: (randomId: string) => JSX.Element;
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=Toolbar.d.ts.map