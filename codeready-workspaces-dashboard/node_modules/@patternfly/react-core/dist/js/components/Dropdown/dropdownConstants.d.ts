import * as React from 'react';
import { OUIAProps } from '../../helpers';
export declare enum DropdownPosition {
    right = "right",
    left = "left"
}
export declare enum DropdownDirection {
    up = "up",
    down = "down"
}
export declare const DropdownContext: React.Context<{
    onSelect?: (event?: any) => void;
    id?: string;
    toggleIndicatorClass?: string;
    toggleIconClass?: string;
    toggleTextClass?: string;
    menuClass?: string;
    itemClass?: string;
    toggleClass?: string;
    baseClass?: string;
    baseComponent?: string;
    sectionClass?: string;
    sectionTitleClass?: string;
    sectionComponent?: string;
    disabledClass?: string;
    plainTextClass?: string;
    menuComponent?: string;
    ouiaComponentType?: string;
} & OUIAProps>;
export declare const DropdownArrowContext: React.Context<{
    keyHandler: any;
    sendRef: any;
}>;
//# sourceMappingURL=dropdownConstants.d.ts.map