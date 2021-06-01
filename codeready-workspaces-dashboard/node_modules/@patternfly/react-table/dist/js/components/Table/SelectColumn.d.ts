import * as React from 'react';
export declare enum RowSelectVariant {
    radio = "radio",
    checkbox = "checkbox"
}
export interface SelectColumnProps {
    name?: string;
    children?: React.ReactNode;
    className?: string;
    onSelect?: (event: React.FormEvent<HTMLInputElement>) => void;
    selectVariant?: RowSelectVariant;
}
export declare const SelectColumn: React.FunctionComponent<SelectColumnProps>;
//# sourceMappingURL=SelectColumn.d.ts.map