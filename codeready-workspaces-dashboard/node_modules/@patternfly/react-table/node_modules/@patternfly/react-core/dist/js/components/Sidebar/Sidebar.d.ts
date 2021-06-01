import * as React from 'react';
export interface SidebarProps extends React.HTMLProps<HTMLDivElement> {
    children?: React.ReactNode;
    orientation?: 'stack' | 'split';
    isPanelRight?: boolean;
    hasGutter?: boolean;
    hasNoBackground?: boolean;
}
export declare const Sidebar: React.FunctionComponent<SidebarProps>;
//# sourceMappingURL=Sidebar.d.ts.map