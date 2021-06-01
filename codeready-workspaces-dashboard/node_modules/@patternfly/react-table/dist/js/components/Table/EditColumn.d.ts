import * as React from 'react';
import { OnRowEdit } from './TableTypes';
export interface EditColumnProps {
    name?: string;
    className?: string;
    onClick?: OnRowEdit;
    editing?: boolean;
    valid?: boolean;
    saveAriaLabel: string;
    cancelAriaLabel: string;
    editAriaLabel: string;
}
export declare const EditColumn: React.FunctionComponent<EditColumnProps>;
//# sourceMappingURL=EditColumn.d.ts.map