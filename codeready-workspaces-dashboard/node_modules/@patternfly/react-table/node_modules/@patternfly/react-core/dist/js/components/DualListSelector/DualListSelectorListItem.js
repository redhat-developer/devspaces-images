"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DualListSelectorListItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const dual_list_selector_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DualListSelector/dual-list-selector"));
const react_styles_1 = require("@patternfly/react-styles");
class DualListSelectorListItem extends React.Component {
    constructor() {
        super(...arguments);
        this.ref = React.createRef();
    }
    componentDidMount() {
        this.props.sendRef(this.ref.current, this.props.filteredIndex);
    }
    componentDidUpdate() {
        this.props.sendRef(this.ref.current, this.props.filteredIndex);
    }
    render() {
        const _a = this.props, { onOptionSelect, orderIndex, children, className, id, isSelected, isChosen, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        sendRef, filteredIndex } = _a, props = tslib_1.__rest(_a, ["onOptionSelect", "orderIndex", "children", "className", "id", "isSelected", "isChosen", "sendRef", "filteredIndex"]);
        return (React.createElement("li", Object.assign({ className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorListItem, className), key: orderIndex }, props, { "aria-selected": isSelected, role: "option" }),
            React.createElement("button", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItem, isSelected && dual_list_selector_1.default.modifiers.selected), onClick: e => onOptionSelect(e, orderIndex, isChosen), id: id, ref: this.ref, tabIndex: -1, type: "button" },
                React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemMain) },
                    React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemText) }, children)))));
    }
}
exports.DualListSelectorListItem = DualListSelectorListItem;
DualListSelectorListItem.displayName = 'DualListSelectorListItem';
//# sourceMappingURL=DualListSelectorListItem.js.map