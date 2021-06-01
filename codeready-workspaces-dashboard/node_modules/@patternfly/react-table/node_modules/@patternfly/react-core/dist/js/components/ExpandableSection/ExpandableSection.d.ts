import * as React from 'react';
import { PickOptional } from '../../helpers/typeUtils';
export interface ExpandableSectionProps extends React.HTMLProps<HTMLDivElement> {
    /** Content rendered inside the Expandable Component */
    children?: React.ReactNode;
    /** Additional classes added to the Expandable Component */
    className?: string;
    /** Flag to indicate if the content is expanded */
    isExpanded?: boolean;
    /** Text that appears in the attached toggle */
    toggleText?: string;
    /** Text that appears in the attached toggle when expanded (will override toggleText if both are specified; used for uncontrolled expandable with dynamic toggle text) */
    toggleTextExpanded?: string;
    /** Text that appears in the attached toggle when collapsed (will override toggleText if both are specified; used for uncontrolled expandable with dynamic toggle text) */
    toggleTextCollapsed?: string;
    /** Callback function to toggle the expandable content. Detached expandable sections should use the onToggle property of ExpandableSectionToggle. */
    onToggle?: (isExpanded: boolean) => void;
    /** Forces active state */
    isActive?: boolean;
    /** Indicates the expandable section has a detached toggle */
    isDetached?: boolean;
    /** ID of the content of the expandable section */
    contentId?: string;
}
interface ExpandableSectionState {
    isExpanded: boolean;
}
export declare class ExpandableSection extends React.Component<ExpandableSectionProps, ExpandableSectionState> {
    static displayName: string;
    constructor(props: ExpandableSectionProps);
    static defaultProps: PickOptional<ExpandableSectionProps>;
    private calculateToggleText;
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=ExpandableSection.d.ts.map