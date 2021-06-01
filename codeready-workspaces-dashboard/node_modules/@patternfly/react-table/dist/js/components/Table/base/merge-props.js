"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeProps = void 0;
const tslib_1 = require("tslib");
/**
 * merge-props.js
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
const React = tslib_1.__importStar(require("react"));
const mergeWith_1 = tslib_1.__importDefault(require("lodash/mergeWith"));
const react_styles_1 = require("@patternfly/react-styles");
/**
 * @param {any} props - Props
 */
function mergeProps(...props) {
    const firstProps = props[0];
    const restProps = props.slice(1);
    if (!restProps.length) {
        return mergeWith_1.default({}, firstProps);
    }
    // Avoid mutating the first prop collection
    return mergeWith_1.default(mergeWith_1.default({}, firstProps), ...restProps, (a, b, key) => {
        if (key === 'children') {
            if (a && b) {
                // compose the two
                return React.cloneElement(a, {
                    children: b
                });
            }
            // Children have to be merged in reverse order for Reactabular
            // logic to work.
            return Object.assign(Object.assign({}, b), a);
        }
        if (key === 'className') {
            // Process class names through classNames to merge properly
            // as a string.
            return react_styles_1.css(a, b);
        }
        return undefined;
    });
}
exports.mergeProps = mergeProps;
//# sourceMappingURL=merge-props.js.map