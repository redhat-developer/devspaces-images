import * as React from 'react';
export interface SidebarPanelProps extends Omit<React.HTMLProps<HTMLDivElement>, 'width'> {
    children: React.ReactNode;
    variant?: 'default' | 'sticky' | 'static';
    hasNoBackground?: boolean;
    width?: {
        default?: 'default' | 'width_25' | 'width_33' | 'width_50' | 'width_66' | 'width_75' | 'width_100';
        sm?: 'default' | 'width_25' | 'width_33' | 'width_50' | 'width_66' | 'width_75' | 'width_100';
        md?: 'default' | 'width_25' | 'width_33' | 'width_50' | 'width_66' | 'width_75' | 'width_100';
        lg?: 'default' | 'width_25' | 'width_33' | 'width_50' | 'width_66' | 'width_75' | 'width_100';
        xl?: 'default' | 'width_25' | 'width_33' | 'width_50' | 'width_66' | 'width_75' | 'width_100';
        '2xl'?: 'default' | 'width_25' | 'width_33' | 'width_50' | 'width_66' | 'width_75' | 'width_100';
    };
}
export declare const SidebarPanel: React.FunctionComponent<SidebarPanelProps>;
//# sourceMappingURL=SidebarPanel.d.ts.map