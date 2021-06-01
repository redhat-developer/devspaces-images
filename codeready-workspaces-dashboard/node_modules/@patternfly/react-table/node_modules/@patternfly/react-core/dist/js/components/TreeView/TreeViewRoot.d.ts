import * as React from 'react';
export interface TreeViewRootProps {
    /** Child nodes of the tree view */
    children: React.ReactNode;
    /** Flag indicating if the tree view has checkboxes */
    hasChecks?: boolean;
    /** Class to add to add if not passed a parentItem */
    className?: string;
}
export declare class TreeViewRoot extends React.Component<TreeViewRootProps> {
    displayName: string;
    private treeRef;
    componentDidMount(): void;
    componentWillUnmount(): void;
    handleKeys: (event: KeyboardEvent) => void;
    handleKeysCheckbox: (event: KeyboardEvent) => void;
    render(): JSX.Element;
}
//# sourceMappingURL=TreeViewRoot.d.ts.map