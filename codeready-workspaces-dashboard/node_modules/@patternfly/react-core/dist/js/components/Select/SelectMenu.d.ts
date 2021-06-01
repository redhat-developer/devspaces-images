import * as React from 'react';
import { SelectOptionObject } from './SelectOption';
export interface SelectMenuProps extends Omit<React.HTMLProps<HTMLElement>, 'checked' | 'selected' | 'ref'> {
    /** Content rendered inside the SelectMenu */
    children: React.ReactElement[] | React.ReactNode;
    /** Flag indicating that the children is custom content to render inside the SelectMenu.  If true, variant prop is ignored. */
    isCustomContent?: boolean;
    /** Additional classes added to the SelectMenu control */
    className?: string;
    /** Flag indicating the Select is expanded */
    isExpanded?: boolean;
    /** Flag indicating the Select options are grouped */
    isGrouped?: boolean;
    /** Currently selected option (for single, typeahead variants) */
    selected?: string | SelectOptionObject | (string | SelectOptionObject)[];
    /** Currently checked options (for checkbox variant) */
    checked?: (string | SelectOptionObject)[];
    /** Internal flag for specifiying how the menu was opened */
    openedOnEnter?: boolean;
    /** Flag to specify the  maximum height of the menu, as a string percentage or number of pixels */
    maxHeight?: string | number;
    /** Inner prop passed from parent */
    noResultsFoundText?: string;
    /** Inner prop passed from parent */
    createText?: string;
    /** Internal callback for ref tracking */
    sendRef?: (ref: React.ReactNode, favoriteRef: React.ReactNode, index: number) => void;
    /** Internal callback for keyboard navigation */
    keyHandler?: (index: number, innerIndex: number, position: string) => void;
    /** Flag indicating select has an inline text input for filtering */
    hasInlineFilter?: boolean;
    innerRef?: any;
}
export declare const SelectMenu: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
//# sourceMappingURL=SelectMenu.d.ts.map