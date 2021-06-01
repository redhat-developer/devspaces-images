import * as React from 'react';
export interface NavListProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement> {
    /** Children nodes */
    children?: React.ReactNode;
    /** Additional classes added to the list */
    className?: string;
    /** Aria-label for the left scroll button */
    ariaLeftScroll?: string;
    /** Aria-label for the right scroll button */
    ariaRightScroll?: string;
}
export declare class NavList extends React.Component<NavListProps> {
    static displayName: string;
    static contextType: React.Context<{
        onSelect?: (event: React.FormEvent<HTMLInputElement>, groupId: React.ReactText, itemId: React.ReactText, to: string, preventDefault: boolean, onClick: (e: React.FormEvent<HTMLInputElement>, itemId: React.ReactText, groupId: React.ReactText, to: string) => void) => void;
        onToggle?: (event: React.MouseEvent<HTMLInputElement, MouseEvent>, groupId: React.ReactText, expanded: boolean) => void;
        updateIsScrollable?: (isScrollable: boolean) => void;
        isHorizontal?: boolean;
    }>;
    static defaultProps: NavListProps;
    state: {
        scrollViewAtStart: boolean;
        scrollViewAtEnd: boolean;
    };
    navList: React.RefObject<HTMLUListElement>;
    handleScrollButtons: () => void;
    scrollLeft: () => void;
    scrollRight: () => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
//# sourceMappingURL=NavList.d.ts.map