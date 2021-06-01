import { __rest } from "tslib";
import * as React from 'react';
import { mapOpenedRows } from './utils/headerUtils';
import { Tbody } from '../TableComposable/Tbody';
export const BodyWrapper = (_a) => {
    var { mappedRows, tbodyRef, 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    rows = [], onCollapse, headerRows } = _a, 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    props = __rest(_a, ["mappedRows", "tbodyRef", "rows", "onCollapse", "headerRows"]);
    if (mappedRows && mappedRows.some(row => row.hasOwnProperty('parent'))) {
        return (React.createElement(React.Fragment, null, mapOpenedRows(mappedRows, props.children).map((oneRow, key) => (React.createElement(Tbody, Object.assign({}, props, { isExpanded: oneRow.isOpen, key: `tbody-${key}`, ref: tbodyRef }), oneRow.rows)))));
    }
    return React.createElement(Tbody, Object.assign({}, props, { ref: tbodyRef }));
};
BodyWrapper.displayName = 'BodyWrapper';
//# sourceMappingURL=BodyWrapper.js.map