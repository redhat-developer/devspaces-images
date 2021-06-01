import * as React from 'react';
export const headerCol = (id = 'simple-node') => {
    const headerColObj = (value, { rowIndex } = {}) => {
        const result = typeof value === 'object' ? value.title : value;
        return {
            component: 'th',
            children: React.createElement("div", { id: `${id}${rowIndex}` }, result)
        };
    };
    return headerColObj;
};
//# sourceMappingURL=headerCol.js.map