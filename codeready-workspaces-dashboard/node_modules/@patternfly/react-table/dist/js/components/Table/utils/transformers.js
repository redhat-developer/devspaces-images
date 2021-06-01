"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapProps = exports.parentId = exports.emptyCol = exports.scopeColTransformer = exports.emptyTD = void 0;
exports.emptyTD = () => ({
    component: 'td'
});
exports.scopeColTransformer = () => ({
    scope: 'col'
});
exports.emptyCol = (label) => (Object.assign({}, (label ? {} : { scope: '' })));
exports.parentId = (_value, { rowData }) => ({
    parentId: rowData.parent
});
exports.mapProps = (_label, { property, rowData }) => (Object.assign({}, (rowData[property] && rowData[property].props)));
//# sourceMappingURL=transformers.js.map