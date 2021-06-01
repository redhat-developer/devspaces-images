import { ITransform } from '../../TableTypes';
export interface IVisibility {
    hidden?: string;
    hiddenOnSm?: string;
    hiddenOnMd?: string;
    hiddenOnLg?: string;
    hiddenOnXl?: string;
    hiddenOn2Xl?: string;
    visibleOnSm?: string;
    visibleOnMd?: string;
    visibleOnLg?: string;
    visibleOnXl?: string;
    visibleOn2Xl?: string;
}
export declare const Visibility: IVisibility;
export declare const classNames: (...classes: string[]) => ITransform;
//# sourceMappingURL=classNames.d.ts.map