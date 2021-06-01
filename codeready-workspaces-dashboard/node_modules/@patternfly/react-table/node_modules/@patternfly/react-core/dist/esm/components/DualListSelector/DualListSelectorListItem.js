import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/DualListSelector/dual-list-selector';
import { css } from '@patternfly/react-styles';
export class DualListSelectorListItem extends React.Component {
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
        sendRef, filteredIndex } = _a, props = __rest(_a, ["onOptionSelect", "orderIndex", "children", "className", "id", "isSelected", "isChosen", "sendRef", "filteredIndex"]);
        return (React.createElement("li", Object.assign({ className: css(styles.dualListSelectorListItem, className), key: orderIndex }, props, { "aria-selected": isSelected, role: "option" }),
            React.createElement("button", { className: css(styles.dualListSelectorItem, isSelected && styles.modifiers.selected), onClick: e => onOptionSelect(e, orderIndex, isChosen), id: id, ref: this.ref, tabIndex: -1, type: "button" },
                React.createElement("span", { className: css(styles.dualListSelectorItemMain) },
                    React.createElement("span", { className: css(styles.dualListSelectorItemText) }, children)))));
    }
}
DualListSelectorListItem.displayName = 'DualListSelectorListItem';
//# sourceMappingURL=DualListSelectorListItem.js.map