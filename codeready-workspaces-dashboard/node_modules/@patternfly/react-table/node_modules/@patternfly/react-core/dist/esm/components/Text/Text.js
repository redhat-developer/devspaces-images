import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
export var TextVariants;
(function (TextVariants) {
    TextVariants["h1"] = "h1";
    TextVariants["h2"] = "h2";
    TextVariants["h3"] = "h3";
    TextVariants["h4"] = "h4";
    TextVariants["h5"] = "h5";
    TextVariants["h6"] = "h6";
    TextVariants["p"] = "p";
    TextVariants["a"] = "a";
    TextVariants["small"] = "small";
    TextVariants["blockquote"] = "blockquote";
    TextVariants["pre"] = "pre";
})(TextVariants || (TextVariants = {}));
export const Text = (_a) => {
    var { children = null, className = '', component = TextVariants.p } = _a, props = __rest(_a, ["children", "className", "component"]);
    const Component = component;
    return (React.createElement(Component, Object.assign({}, props, { "data-pf-content": true, className: css(className) }), children));
};
Text.displayName = 'Text';
//# sourceMappingURL=Text.js.map