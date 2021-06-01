import * as React from 'react';
export interface TreeViewListProps {
    /** Flag indicating if the tree view is nested under another tree view */
    isNested?: boolean;
    /** Callback for search input */
    onSearch?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    /** Additional props for search input */
    searchProps?: any;
    /** Child nodes of the current tree view */
    children: React.ReactNode;
}
export declare const TreeViewList: React.FunctionComponent<TreeViewListProps>;
//# sourceMappingURL=TreeViewList.d.ts.map