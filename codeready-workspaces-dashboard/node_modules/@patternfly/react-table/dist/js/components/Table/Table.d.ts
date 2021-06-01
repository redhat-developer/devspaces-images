import * as React from 'react';
import { OUIAProps } from '@patternfly/react-core';
import { RowWrapperProps } from './RowWrapper';
import { ISortBy, OnCollapse, OnExpand, OnSelect, OnRowEdit, OnSort, IActions, IActionsResolver, IAreActionsDisabled, IRow, ICell, OnFavorite } from './TableTypes';
export interface TableProps extends OUIAProps {
    /** Adds an accessible name for the Table */
    'aria-label'?: string;
    /** Content rendered inside the Table */
    children?: React.ReactNode;
    /** Additional classes added to the Table  */
    className?: string;
    /** Style variant for the Table  */
    variant?: 'compact';
    /**
     * Render borders
     * Borders can only currently be disabled if the variant is set to 'compact'
     * https://github.com/patternfly/patternfly/issues/3650
     */
    borders?: boolean;
    /** Specifies the grid breakpoints  */
    gridBreakPoint?: '' | 'grid' | 'grid-md' | 'grid-lg' | 'grid-xl' | 'grid-2xl';
    /** Specifies the initial sorting pattern for the table - asc/desc and the index of the column to sort by */
    sortBy?: ISortBy;
    /** Function triggered when an expandable content is collapsed. When this is used, one expandable toggle button will be positioned in the first cell of a non-expandable row, preceding an expandable row */
    onCollapse?: OnCollapse;
    /** Function triggered when a compound expandable item is clicked */
    onExpand?: OnExpand;
    /** Function triggered when a row's checkbox is selected. When this is used, one checkbox/radio button will be positioned in the first or second cell of a non-expandable row */
    onSelect?: OnSelect;
    /** Enables or Disables the ability to select all - this is mutually exclusive with radio button select variant */
    canSelectAll?: boolean;
    /** Specifies the type of the select element variant - can be one of checkbox or radio button */
    selectVariant?: 'checkbox' | 'radio';
    /** @beta Function triggered when a row's inline edit is activated. Adds a column for inline edit when present. */
    onRowEdit?: OnRowEdit;
    /** Function triggered when sort icon is clicked */
    onSort?: OnSort;
    /** Actions to add to the Table */
    actions?: IActions;
    /** Resolver for the given action  */
    actionResolver?: IActionsResolver;
    /** Specifies if the Kebab for actions is disabled */
    areActionsDisabled?: IAreActionsDisabled;
    /** Component to place in the header */
    header?: React.ReactNode;
    /** Component used for caption*/
    caption?: React.ReactNode;
    /** label for row */
    rowLabeledBy?: string;
    /** ID for expand */
    expandId?: string;
    /** ID for content */
    contentId?: string;
    /** The desired position to show the dropdown when clicking on the actions Kebab. Can only be used together with `actions` property */
    dropdownPosition?: 'right' | 'left';
    /** The desired direction to show the dropdown when clicking on the actions Kebab. Can only be used together with `actions` property */
    dropdownDirection?: 'up' | 'down';
    /** The toggle of the actions menu dropdown. A KebabToggle or DropdownToggle component */
    actionsToggle?: React.ReactElement;
    /** Row data */
    rows: (IRow | string[])[];
    /** Cell/column data */
    cells: (ICell | string)[];
    /** Wrapper for the body  */
    bodyWrapper?: Function;
    /** Wrapper for the row */
    rowWrapper?: (props: RowWrapperProps) => JSX.Element;
    /** A valid WAI-ARIA role to be applied to the table element */
    role?: string;
    /** If set to true, the table header sticks to the top of its container */
    isStickyHeader?: boolean;
    /**
     * Enables favorites column
     * Callback triggered when a row is favorited/unfavorited
     */
    onFavorite?: OnFavorite;
    /** Along with the onSort prop, enables favorites sorting, defaults to true */
    canSortFavorites?: boolean;
    /** Flag indicating table is a tree table */
    isTreeTable?: boolean;
}
export declare class Table extends React.Component<TableProps, {}> {
    static displayName: string;
    static hasWarnBeta: boolean;
    static defaultProps: Partial<TableProps>;
    state: {
        ouiaStateId: string;
    };
    isSelected: (row: IRow) => boolean;
    areAllRowsSelected: (rows: IRow[]) => boolean;
    componentDidMount(): void;
    render(): JSX.Element;
}
//# sourceMappingURL=Table.d.ts.map