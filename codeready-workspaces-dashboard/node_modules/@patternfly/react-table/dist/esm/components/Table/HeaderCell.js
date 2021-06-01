import { __rest } from "tslib";
import * as React from 'react';
import { Th } from '../TableComposable/Th';
export const HeaderCell = (_a) => {
    var { className = '', component = 'th', scope = '', textCenter = false, tooltip = '', onMouseEnter = () => { }, children, 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    isVisible, dataLabel = '' } = _a, 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    props = __rest(_a, ["className", "component", "scope", "textCenter", "tooltip", "onMouseEnter", "children", "isVisible", "dataLabel"]);
    return (React.createElement(Th, Object.assign({}, props, { scope: scope, tooltip: tooltip, onMouseEnter: onMouseEnter, textCenter: textCenter, component: component, className: className }), children));
};
HeaderCell.displayName = 'HeaderCell';
//# sourceMappingURL=HeaderCell.js.map