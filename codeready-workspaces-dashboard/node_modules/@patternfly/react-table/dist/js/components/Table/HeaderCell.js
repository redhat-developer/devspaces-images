"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderCell = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const Th_1 = require("../TableComposable/Th");
exports.HeaderCell = (_a) => {
    var { className = '', component = 'th', scope = '', textCenter = false, tooltip = '', onMouseEnter = () => { }, children, 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    isVisible, dataLabel = '' } = _a, 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    props = tslib_1.__rest(_a, ["className", "component", "scope", "textCenter", "tooltip", "onMouseEnter", "children", "isVisible", "dataLabel"]);
    return (React.createElement(Th_1.Th, Object.assign({}, props, { scope: scope, tooltip: tooltip, onMouseEnter: onMouseEnter, textCenter: textCenter, component: component, className: className }), children));
};
exports.HeaderCell.displayName = 'HeaderCell';
//# sourceMappingURL=HeaderCell.js.map