import { __rest } from "tslib";
import * as React from 'react';
import { Title, TitleSizes } from '../Title';
export const PopoverHeader = (_a) => {
    var { children, id } = _a, props = __rest(_a, ["children", "id"]);
    return (React.createElement(Title, Object.assign({ headingLevel: "h6", size: TitleSizes.md, id: id }, props), children));
};
PopoverHeader.displayName = 'PopoverHeader';
//# sourceMappingURL=PopoverHeader.js.map