import * as React from 'react';
export interface SearchAttribute {
    /** The search attribute's value to be provided in the search input's query string.
     * It should have no spaces and be unique for every attribute */
    attr: string;
    /** The search attribute's display name. It is used to label the field in the advanced search menu */
    display: React.ReactNode;
}
export interface SearchInputProps extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange' | 'results' | 'ref'> {
    /** Additional classes added to the banner */
    className?: string;
    /** Value of the search input */
    value?: string;
    /** Array of attribute values */
    attributes?: string[] | SearchAttribute[];
    /** Attribute label for strings unassociated with one of the provided listed attributes */
    hasWordsAttrLabel?: string;
    /** Delimiter in the query string for pairing attributes with search values.
     * Required whenever attributes are passed as props */
    advancedSearchDelimiter?: string;
    /** The number of search results returned. Either a total number of results,
     * or a string representing the current result over the total number of results. i.e. "1 / 5" */
    resultsCount?: number | string;
    /** An accessible label for the search input */
    'aria-label'?: string;
    /** placeholder text of the search input */
    placeholder?: string;
    /** A callback for when the input value changes */
    onChange?: (value: string, event: React.FormEvent<HTMLInputElement>) => void;
    /** A callback for when the search button clicked changes */
    onSearch?: (value: string, event: React.SyntheticEvent<HTMLButtonElement>, attrValueMap: {
        [key: string]: string;
    }) => void;
    /** A callback for when the user clicks the clear button */
    onClear?: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
    /** Function called when user clicks to navigate to next result */
    onNextClick?: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
    /** Function called when user clicks to navigate to previous result */
    onPreviousClick?: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
    /** A reference object to attach to the input box */
    innerRef?: React.RefObject<any>;
    /** Label for the buttons which reset the advanced search form and clear the search input */
    resetButtonLabel?: string;
    /** Label for the buttons which called the onSearch event handler */
    submitSearchButtonLabel?: string;
    /** Label for the button which opens the advanced search form menu */
    openMenuButtonAriaLabel?: string;
    /** Flag indicating if search input is disabled */
    isDisabled?: boolean;
}
export declare const SearchInput: React.ForwardRefExoticComponent<SearchInputProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=SearchInput.d.ts.map