import * as React from 'react';
import { SelectProps } from '@patternfly/react-core';
export interface BodyCellProps {
    'data-label'?: string;
    className?: string;
    colSpan?: number;
    component?: React.ReactNode;
    errorText?: string;
    isVisible?: boolean;
    parentId?: number;
    textCenter?: boolean;
    isOpen?: boolean;
    ariaControls?: string;
    editableValue?: any;
    editableSelectProps?: SelectProps;
    options?: React.ReactElement[];
    isSelectOpen?: boolean;
    value?: any;
    isValid?: boolean;
    name?: string;
    tooltip?: string;
    onMouseEnter?: (event: any) => void;
    children: React.ReactNode;
}
export declare const BodyCell: React.FunctionComponent<BodyCellProps>;
//# sourceMappingURL=BodyCell.d.ts.map