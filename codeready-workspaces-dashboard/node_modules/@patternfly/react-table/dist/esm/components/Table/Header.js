import { __rest } from "tslib";
import * as React from 'react';
import { Header } from './base';
import { TableContext } from './TableContext';
const ContextHeader = (_a) => {
    var { className = '', headerRows = undefined } = _a, props = __rest(_a, ["className", "headerRows"]);
    return React.createElement(Header, Object.assign({}, props, { headerRows: headerRows, className: className }));
};
export const TableHeader = (_a) => {
    var props = __rest(_a, []);
    return (React.createElement(TableContext.Consumer, null, ({ headerRows }) => React.createElement(ContextHeader, Object.assign({}, props, { headerRows: headerRows }))));
};
TableHeader.displayName = 'TableHeader';
//# sourceMappingURL=Header.js.map