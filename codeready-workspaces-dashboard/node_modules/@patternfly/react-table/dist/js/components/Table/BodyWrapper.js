"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyWrapper = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const headerUtils_1 = require("./utils/headerUtils");
const Tbody_1 = require("../TableComposable/Tbody");
exports.BodyWrapper = (_a) => {
    var { mappedRows, tbodyRef, 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    rows = [], onCollapse, headerRows } = _a, 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    props = tslib_1.__rest(_a, ["mappedRows", "tbodyRef", "rows", "onCollapse", "headerRows"]);
    if (mappedRows && mappedRows.some(row => row.hasOwnProperty('parent'))) {
        return (React.createElement(React.Fragment, null, headerUtils_1.mapOpenedRows(mappedRows, props.children).map((oneRow, key) => (React.createElement(Tbody_1.Tbody, Object.assign({}, props, { isExpanded: oneRow.isOpen, key: `tbody-${key}`, ref: tbodyRef }), oneRow.rows)))));
    }
    return React.createElement(Tbody_1.Tbody, Object.assign({}, props, { ref: tbodyRef }));
};
exports.BodyWrapper.displayName = 'BodyWrapper';
//# sourceMappingURL=BodyWrapper.js.map