export const emptyTD = () => ({
    component: 'td'
});
export const scopeColTransformer = () => ({
    scope: 'col'
});
export const emptyCol = (label) => (Object.assign({}, (label ? {} : { scope: '' })));
export const parentId = (_value, { rowData }) => ({
    parentId: rowData.parent
});
export const mapProps = (_label, { property, rowData }) => (Object.assign({}, (rowData[property] && rowData[property].props)));
//# sourceMappingURL=transformers.js.map