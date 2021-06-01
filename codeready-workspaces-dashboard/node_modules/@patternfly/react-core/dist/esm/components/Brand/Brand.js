import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
export const Brand = (_a) => {
    var { className = '', src = '', alt } = _a, props = __rest(_a, ["className", "src", "alt"]);
    return (
    /** the brand component currently contains no styling the 'pf-c-brand' string will be used for the className */
    React.createElement("img", Object.assign({}, props, { className: css('pf-c-brand', className), src: src, alt: alt })));
};
Brand.displayName = 'Brand';
//# sourceMappingURL=Brand.js.map