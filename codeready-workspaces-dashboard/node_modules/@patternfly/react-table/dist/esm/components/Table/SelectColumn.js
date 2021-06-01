import { __rest } from "tslib";
import * as React from 'react';
export var RowSelectVariant;
(function (RowSelectVariant) {
    RowSelectVariant["radio"] = "radio";
    RowSelectVariant["checkbox"] = "checkbox";
})(RowSelectVariant || (RowSelectVariant = {}));
export const SelectColumn = (_a) => {
    var { children = null, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className, onSelect = null, selectVariant } = _a, props = __rest(_a, ["children", "className", "onSelect", "selectVariant"]);
    return (React.createElement(React.Fragment, null,
        React.createElement("input", Object.assign({}, props, { type: selectVariant, onChange: onSelect })),
        children));
};
SelectColumn.displayName = 'SelectColumn';
//# sourceMappingURL=SelectColumn.js.map