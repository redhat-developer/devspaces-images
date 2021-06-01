import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/List/list';
import { css } from '@patternfly/react-styles';
export var OrderType;
(function (OrderType) {
    OrderType["number"] = "1";
    OrderType["lowercaseLetter"] = "a";
    OrderType["uppercaseLetter"] = "A";
    OrderType["lowercaseRomanNumber"] = "i";
    OrderType["uppercaseRomanNumber"] = "I";
})(OrderType || (OrderType = {}));
export var ListVariant;
(function (ListVariant) {
    ListVariant["inline"] = "inline";
})(ListVariant || (ListVariant = {}));
export var ListComponent;
(function (ListComponent) {
    ListComponent["ol"] = "ol";
    ListComponent["ul"] = "ul";
})(ListComponent || (ListComponent = {}));
export const List = (_a) => {
    var { className = '', children = null, variant = null, type = OrderType.number, ref = null, component = ListComponent.ul } = _a, props = __rest(_a, ["className", "children", "variant", "type", "ref", "component"]);
    return component === ListComponent.ol ? (React.createElement("ol", Object.assign({ ref: ref, type: type }, props, { className: css(styles.list, variant && styles.modifiers[variant], className) }), children)) : (React.createElement("ul", Object.assign({ ref: ref }, props, { className: css(styles.list, variant && styles.modifiers[variant], className) }), children));
};
List.displayName = 'List';
//# sourceMappingURL=List.js.map