import * as React from 'react';
import { PickOptional } from '../../helpers/typeUtils';
import { OUIAProps } from '../../helpers';
export declare enum TabsComponent {
    div = "div",
    nav = "nav"
}
export interface TabsProps extends Omit<React.HTMLProps<HTMLElement | HTMLDivElement>, 'onSelect'>, OUIAProps {
    /** Content rendered inside the tabs component. Must be React.ReactElement<TabProps>[] */
    children: React.ReactNode;
    /** Additional classes added to the tabs */
    className?: string;
    /** Tabs background color variant */
    variant?: 'default' | 'light300';
    /** The index of the active tab */
    activeKey?: number | string;
    /** Callback to handle tab selection */
    onSelect?: (event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: number | string) => void;
    /** Uniquely identifies the tabs */
    id?: string;
    /** Enables the filled tab list layout */
    isFilled?: boolean;
    /** Enables secondary tab styling */
    isSecondary?: boolean;
    /** Enables box styling to the tab component */
    isBox?: boolean;
    /** Enables vertical tab styling */
    isVertical?: boolean;
    /** Aria-label for the left scroll button */
    leftScrollAriaLabel?: string;
    /** Aria-label for the right scroll button */
    rightScrollAriaLabel?: string;
    /** Determines what tag is used around the tabs. Use "nav" to define the tabs inside a navigation region */
    component?: 'div' | 'nav';
    /** Provides an accessible label for the tabs. Labels should be unique for each set of tabs that are present on a page. When component is set to nav, this prop should be defined to differentiate the tabs from other navigation regions on the page. */
    'aria-label'?: string;
    /** Waits until the first "enter" transition to mount tab children (add them to the DOM) */
    mountOnEnter?: boolean;
    /** Unmounts tab children (removes them from the DOM) when they are no longer visible */
    unmountOnExit?: boolean;
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
interface TabsState {
    showScrollButtons: boolean;
    disableLeftScrollButton: boolean;
    disableRightScrollButton: boolean;
    shownKeys: (string | number)[];
    ouiaStateId: string;
}
export declare class Tabs extends React.Component<TabsProps, TabsState> {
    static displayName: string;
    tabList: React.RefObject<HTMLUListElement>;
    constructor(props: TabsProps);
    static defaultProps: PickOptional<TabsProps>;
    handleTabClick(event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: number | string, tabContentRef: React.RefObject<any>, mountOnEnter: boolean): void;
    handleScrollButtons: () => void;
    scrollLeft: () => void;
    scrollRight: () => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    componentDidUpdate(prevProps: TabsProps): void;
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=Tabs.d.ts.map