import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/DualListSelector/dual-list-selector';
import { css } from '@patternfly/react-styles';
import { Button, ButtonVariant } from '../Button';
import AngleDoubleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-left-icon";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import AngleDoubleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-right-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import { DualListSelectorPane } from './DualListSelectorPane';
import { getUniqueId } from '../../helpers';
import { flattenTree, flattenTreeWithFolders, filterFolders, filterTreeItems, filterTreeItemsWithoutFolders, filterRestTreeItems } from './treeUtils';
import { canUseDOM } from '../../helpers/util';
export class DualListSelector extends React.Component {
    constructor(props) {
        super(props);
        this.controlsEl = React.createRef();
        this.originalCopy = this.props.availableOptions;
        this.addAll = () => {
            this.setState(prevState => {
                let newChosen = [];
                if (this.props.isTree) {
                    newChosen = this.originalCopy;
                }
                else {
                    newChosen = [...prevState.chosenOptions, ...prevState.availableOptions];
                }
                this.props.addAll && this.props.addAll([], newChosen);
                this.props.onListChange && this.props.onListChange([], newChosen);
                return {
                    availableOptions: [],
                    availableOptionsSelected: [],
                    chosenOptions: newChosen,
                    chosenOptionsSelected: []
                };
            });
        };
        this.removeAll = () => {
            this.setState(prevState => {
                let newAvailable = [];
                if (this.props.isTree) {
                    newAvailable = this.originalCopy;
                }
                else {
                    newAvailable = [...prevState.chosenOptions, ...prevState.availableOptions];
                }
                this.props.removeAll && this.props.removeAll(newAvailable, []);
                this.props.onListChange && this.props.onListChange(newAvailable, []);
                return {
                    availableOptions: newAvailable,
                    availableOptionsSelected: [],
                    chosenOptions: [],
                    chosenOptionsSelected: []
                };
            });
        };
        this.addSelected = () => {
            this.setState(prevState => {
                const itemsToRemove = [];
                const newAvailable = [];
                prevState.availableOptions.forEach((value, index) => {
                    if (prevState.availableOptionsSelected.indexOf(index) !== -1) {
                        itemsToRemove.push(value);
                    }
                    else {
                        newAvailable.push(value);
                    }
                });
                const newChosen = [...prevState.chosenOptions, ...itemsToRemove];
                this.props.addSelected && this.props.addSelected(newAvailable, newChosen);
                this.props.onListChange && this.props.onListChange(newAvailable, newChosen);
                return {
                    chosenOptionsSelected: [],
                    availableOptionsSelected: [],
                    chosenOptions: newChosen,
                    availableOptions: newAvailable
                };
            });
        };
        this.addTreeSelected = () => {
            this.setState(prevState => {
                // Remove selected available nodes from current available nodes
                const newAvailable = prevState.availableOptions
                    .map(opt => Object.assign({}, opt))
                    .filter(item => filterRestTreeItems(item, prevState.availableTreeOptionsSelected));
                // Get next chosen options from current + new nodes and remap from base
                const currChosen = flattenTree(prevState.chosenOptions);
                const nextChosenOptions = currChosen.concat(prevState.availableTreeOptionsSelected);
                const newChosen = this.originalCopy
                    .map(opt => Object.assign({}, opt))
                    .filter(item => filterTreeItemsWithoutFolders(item, nextChosenOptions));
                this.props.addSelected && this.props.addSelected(newAvailable, newChosen);
                this.props.onListChange && this.props.onListChange(newAvailable, newChosen);
                return {
                    availableTreeOptionsSelected: [],
                    chosenTreeOptionsSelected: [],
                    availableTreeOptionsChecked: [],
                    chosenTreeOptionsChecked: [],
                    availableOptions: newAvailable,
                    chosenOptions: newChosen
                };
            });
        };
        this.removeSelected = () => {
            this.setState(prevState => {
                const itemsToRemove = [];
                const newChosen = [];
                prevState.chosenOptions.forEach((value, index) => {
                    if (prevState.chosenOptionsSelected.indexOf(index) !== -1) {
                        itemsToRemove.push(value);
                    }
                    else {
                        newChosen.push(value);
                    }
                });
                const newAvailable = [...prevState.availableOptions, ...itemsToRemove];
                this.props.removeSelected && this.props.removeSelected(newAvailable, newChosen);
                this.props.onListChange && this.props.onListChange(newAvailable, newChosen);
                return {
                    chosenOptionsSelected: [],
                    availableOptionsSelected: [],
                    chosenOptions: newChosen,
                    availableOptions: newAvailable
                };
            });
        };
        this.removeTreeSelected = () => {
            this.setState(prevState => {
                // Remove selected chosen nodes from current chosen nodes
                const newChosen = prevState.chosenOptions
                    .map(opt => Object.assign({}, opt))
                    .filter(item => filterRestTreeItems(item, prevState.chosenTreeOptionsSelected));
                // Get next chosen options from current and remap from base
                const currAvailable = flattenTree(prevState.availableOptions);
                const nextAvailableOptions = currAvailable.concat(prevState.chosenTreeOptionsSelected);
                const newAvailable = this.originalCopy
                    .map(opt => Object.assign({}, opt))
                    .filter(item => filterTreeItemsWithoutFolders(item, nextAvailableOptions));
                this.props.removeSelected && this.props.removeSelected(newAvailable, newChosen);
                this.props.onListChange && this.props.onListChange(newAvailable, newChosen);
                return {
                    availableTreeOptionsSelected: [],
                    chosenTreeOptionsSelected: [],
                    availableTreeOptionsChecked: [],
                    chosenTreeOptionsChecked: [],
                    availableOptions: newAvailable,
                    chosenOptions: newChosen
                };
            });
        };
        this.onOptionSelect = (e, index, isChosen, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        id, itemData, parentData
        /* eslint-enable @typescript-eslint/no-unused-vars */
        ) => {
            this.setState(prevState => {
                const originalArray = isChosen ? prevState.chosenOptionsSelected : prevState.availableOptionsSelected;
                let updatedArray = null;
                if (originalArray.indexOf(index) !== -1) {
                    updatedArray = originalArray.filter(value => value !== index);
                }
                else {
                    updatedArray = [...originalArray, index];
                }
                return {
                    chosenOptionsSelected: isChosen ? updatedArray : prevState.chosenOptionsSelected,
                    availableOptionsSelected: isChosen ? prevState.availableOptionsSelected : updatedArray
                };
            });
            this.props.onOptionSelect && this.props.onOptionSelect(e);
        };
        this.onTreeOptionSelect = (e, index, isChosen, id, itemData, 
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        parentData) => {
            this.setState(prevState => {
                const selectedOptions = isChosen ? prevState.chosenTreeOptionsSelected : prevState.availableTreeOptionsSelected;
                let updatedArray = null;
                if (itemData.children) {
                    const panelOptions = isChosen ? this.state.chosenOptions : this.state.availableOptions;
                    const selectedOptionTree = panelOptions
                        .map(opt => Object.assign({}, opt))
                        .filter(item => filterTreeItems(item, [id]));
                    const flatSelectedItems = flattenTreeWithFolders(selectedOptionTree);
                    if (selectedOptions.includes(id)) {
                        updatedArray = selectedOptions.filter(id => !flatSelectedItems.includes(id));
                    }
                    else {
                        updatedArray = selectedOptions.concat(flatSelectedItems.filter(id => !selectedOptions.includes(id)));
                    }
                }
                else {
                    if (selectedOptions.includes(id)) {
                        updatedArray = selectedOptions.filter(id => !selectedOptions.includes(id));
                    }
                    else {
                        updatedArray = [...selectedOptions, id];
                    }
                }
                return {
                    chosenTreeOptionsSelected: isChosen ? updatedArray : prevState.chosenTreeOptionsSelected,
                    availableTreeOptionsSelected: isChosen ? prevState.availableTreeOptionsSelected : updatedArray
                };
            });
            this.props.onOptionSelect && this.props.onOptionSelect(e);
        };
        this.isChecked = (treeItem, isChosen) => isChosen
            ? this.state.chosenTreeOptionsChecked.includes(treeItem.id)
            : this.state.availableTreeOptionsChecked.includes(treeItem.id);
        this.areAllDescendantsChecked = (treeItem, isChosen) => treeItem.children
            ? treeItem.children.every(child => this.areAllDescendantsChecked(child, isChosen))
            : this.isChecked(treeItem, isChosen);
        this.areSomeDescendantsChecked = (treeItem, isChosen) => treeItem.children
            ? treeItem.children.some(child => this.areSomeDescendantsChecked(child, isChosen))
            : this.isChecked(treeItem, isChosen);
        this.mapChecked = (item, isChosen) => {
            const hasCheck = this.areAllDescendantsChecked(item, isChosen);
            item.isChecked = false;
            if (hasCheck) {
                item.isChecked = true;
            }
            else {
                const hasPartialCheck = this.areSomeDescendantsChecked(item, isChosen);
                if (hasPartialCheck) {
                    item.isChecked = null;
                }
            }
            if (item.children) {
                return Object.assign(Object.assign({}, item), { children: item.children.map(child => this.mapChecked(child, isChosen)) });
            }
            return item;
        };
        this.onTreeOptionCheck = (evt, isChecked, isChosen, itemData) => {
            const checked = evt.target.checked
                ? evt.target.checked
                : isChecked;
            const panelOptions = isChosen ? this.state.chosenOptions : this.state.availableOptions;
            const checkedOptionTree = panelOptions
                .map(opt => Object.assign({}, opt))
                .filter(item => filterTreeItems(item, [itemData.id]));
            const flatTree = flattenTreeWithFolders(checkedOptionTree);
            const prevChecked = isChosen ? this.state.chosenTreeOptionsChecked : this.state.availableTreeOptionsChecked;
            let updatedChecked = [];
            let updatedSelected = [];
            const selectedOptions = isChosen ? this.state.chosenTreeOptionsSelected : this.state.availableTreeOptionsSelected;
            if (checked) {
                updatedChecked = prevChecked.concat(flatTree.filter(id => !prevChecked.includes(id)));
                updatedSelected = selectedOptions.concat(flatTree.filter(id => !selectedOptions.includes(id)));
            }
            else {
                updatedChecked = prevChecked.filter(id => !flatTree.includes(id));
                updatedSelected = selectedOptions.filter(id => !flatTree.includes(id));
            }
            this.setState(prevState => ({
                availableTreeOptionsChecked: isChosen ? prevState.availableTreeOptionsChecked : updatedChecked,
                chosenTreeOptionsChecked: isChosen ? updatedChecked : prevState.chosenTreeOptionsChecked,
                availableTreeOptionsSelected: isChosen ? prevState.availableTreeOptionsSelected : updatedSelected,
                chosenTreeOptionsSelected: isChosen ? updatedSelected : prevState.chosenTreeOptionsSelected
            }), () => {
                this.props.onOptionCheck && this.props.onOptionCheck(evt, isChecked, itemData.id, updatedChecked);
            });
            this.props.onOptionSelect && this.props.onOptionSelect(evt);
        };
        this.handleKeys = (event) => {
            const key = event.key;
            let moveFocus = false;
            let currentIndex = -1;
            const controls = Array.from(this.controlsEl.current.getElementsByClassName('pf-c-button'));
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                if (document.activeElement === this.controlsEl.current) {
                    currentIndex = 0;
                    while (currentIndex < controls.length &&
                        currentIndex >= 0 &&
                        controls[currentIndex].classList.contains('pf-m-disabled')) {
                        currentIndex = currentIndex + 1;
                    }
                    moveFocus = true;
                    event.preventDefault();
                }
                else {
                    controls.forEach((control, index) => {
                        if (document.activeElement === control) {
                            const increment = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
                            currentIndex = index + increment;
                            while (currentIndex < controls.length &&
                                currentIndex >= 0 &&
                                controls[currentIndex].classList.contains('pf-m-disabled')) {
                                currentIndex = currentIndex + increment;
                            }
                            moveFocus = true;
                            event.preventDefault();
                        }
                    });
                }
            }
            if (moveFocus && controls[currentIndex]) {
                controls[currentIndex].focus();
            }
        };
        this.state = {
            availableOptions: [...this.props.availableOptions],
            availableOptionsSelected: [],
            chosenOptions: [...this.props.chosenOptions],
            chosenOptionsSelected: [],
            availableTreeOptionsSelected: [],
            chosenTreeOptionsSelected: [],
            availableTreeOptionsChecked: [],
            chosenTreeOptionsChecked: []
        };
    }
    componentDidUpdate() {
        if (JSON.stringify(this.props.availableOptions) !== JSON.stringify(this.state.availableOptions) ||
            JSON.stringify(this.props.chosenOptions) !== JSON.stringify(this.state.chosenOptions)) {
            this.setState({
                availableOptions: [...this.props.availableOptions],
                chosenOptions: [...this.props.chosenOptions]
            });
        }
    }
    componentDidMount() {
        if (canUseDOM) {
            window.addEventListener('keydown', this.handleKeys);
        }
    }
    componentWillUnmount() {
        if (canUseDOM) {
            window.removeEventListener('keydown', this.handleKeys);
        }
    }
    render() {
        const _a = this.props, { availableOptionsTitle, availableOptionsActions, availableOptionsSearchAriaLabel, className, chosenOptionsTitle, chosenOptionsActions, chosenOptionsSearchAriaLabel, filterOption, isSearchable, chosenOptionsStatus, availableOptionsStatus, controlsAriaLabel, addAllAriaLabel, addSelectedAriaLabel, removeSelectedAriaLabel, removeAllAriaLabel, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        availableOptions: consumerPassedAvailableOptions, chosenOptions: consumerPassedChosenOptions, removeSelected, addAll, removeAll, addSelected, onListChange, onAvailableOptionsSearchInputChanged, onChosenOptionsSearchInputChanged, onOptionSelect, onOptionCheck, id, isTree } = _a, props = __rest(_a, ["availableOptionsTitle", "availableOptionsActions", "availableOptionsSearchAriaLabel", "className", "chosenOptionsTitle", "chosenOptionsActions", "chosenOptionsSearchAriaLabel", "filterOption", "isSearchable", "chosenOptionsStatus", "availableOptionsStatus", "controlsAriaLabel", "addAllAriaLabel", "addSelectedAriaLabel", "removeSelectedAriaLabel", "removeAllAriaLabel", "availableOptions", "chosenOptions", "removeSelected", "addAll", "removeAll", "addSelected", "onListChange", "onAvailableOptionsSearchInputChanged", "onChosenOptionsSearchInputChanged", "onOptionSelect", "onOptionCheck", "id", "isTree"]);
        const { availableOptions, chosenOptions, chosenOptionsSelected, availableOptionsSelected, chosenTreeOptionsSelected, availableTreeOptionsSelected } = this.state;
        const availableOptionsStatusToDisplay = availableOptionsStatus ||
            (isTree
                ? `${filterFolders(availableOptions, availableTreeOptionsSelected).length} of ${flattenTree(availableOptions).length} items selected`
                : `${availableOptionsSelected.length} of ${availableOptions.length} items selected`);
        const chosenOptionsStatusToDisplay = chosenOptionsStatus ||
            (isTree
                ? `${filterFolders(chosenOptions, chosenTreeOptionsSelected).length} of ${flattenTree(chosenOptions).length} items selected`
                : `${chosenOptionsSelected.length} of ${chosenOptions.length} items selected`);
        const available = isTree
            ? availableOptions.map(item => this.mapChecked(item, false))
            : availableOptions;
        const chosen = isTree
            ? chosenOptions.map(item => this.mapChecked(item, true))
            : chosenOptions;
        return (React.createElement("div", Object.assign({ className: css(styles.dualListSelector, className), id: id }, props),
            React.createElement(DualListSelectorPane, { isSearchable: isSearchable, searchInputAriaLabel: availableOptionsSearchAriaLabel, filterOption: filterOption, onSearchInputChanged: onAvailableOptionsSearchInputChanged, status: availableOptionsStatusToDisplay, title: availableOptionsTitle, options: available, selectedOptions: isTree ? availableTreeOptionsSelected : availableOptionsSelected, onOptionSelect: isTree ? this.onTreeOptionSelect : this.onOptionSelect, onOptionCheck: this.onTreeOptionCheck, actions: availableOptionsActions, id: `${id}-available-pane`, isTree: isTree }),
            React.createElement("div", { className: css(styles.dualListSelectorControls), tabIndex: 0, ref: this.controlsEl, "aria-label": controlsAriaLabel },
                React.createElement("div", { className: css('pf-c-dual-list-selector__controls-item') },
                    React.createElement(Button, { isDisabled: availableOptions.length === 0, "aria-disabled": availableOptions.length === 0, variant: ButtonVariant.plain, onClick: this.addAll, "aria-label": addAllAriaLabel, tabIndex: -1 },
                        React.createElement(AngleDoubleRightIcon, null))),
                React.createElement("div", { className: css('pf-c-dual-list-selector__controls-item') },
                    React.createElement(Button, { isDisabled: isTree ? availableTreeOptionsSelected.length === 0 : availableOptionsSelected.length === 0, "aria-disabled": isTree ? availableTreeOptionsSelected.length === 0 : availableOptionsSelected.length === 0, variant: ButtonVariant.plain, onClick: isTree ? this.addTreeSelected : this.addSelected, "aria-label": addSelectedAriaLabel, tabIndex: -1 },
                        React.createElement(AngleRightIcon, null))),
                React.createElement("div", { className: css('pf-c-dual-list-selector__controls-item') },
                    React.createElement(Button, { variant: ButtonVariant.plain, onClick: isTree ? this.removeTreeSelected : this.removeSelected, "aria-label": removeSelectedAriaLabel, tabIndex: -1, isDisabled: isTree ? chosenTreeOptionsSelected.length === 0 : chosenOptionsSelected.length === 0, "aria-disabled": isTree ? chosenTreeOptionsSelected.length === 0 : chosenOptionsSelected.length === 0 },
                        React.createElement(AngleLeftIcon, null))),
                React.createElement("div", { className: css('pf-c-dual-list-selector__controls-item') },
                    React.createElement(Button, { isDisabled: chosenOptions.length === 0, "aria-disabled": chosenOptions.length === 0, variant: ButtonVariant.plain, onClick: this.removeAll, "aria-label": removeAllAriaLabel, tabIndex: -1 },
                        React.createElement(AngleDoubleLeftIcon, null)))),
            React.createElement(DualListSelectorPane, { isChosen: true, isSearchable: isSearchable, searchInputAriaLabel: chosenOptionsSearchAriaLabel, filterOption: filterOption, onSearchInputChanged: onChosenOptionsSearchInputChanged, title: chosenOptionsTitle, status: chosenOptionsStatusToDisplay, options: chosen, selectedOptions: isTree ? chosenTreeOptionsSelected : chosenOptionsSelected, onOptionSelect: isTree ? this.onTreeOptionSelect : this.onOptionSelect, onOptionCheck: this.onTreeOptionCheck, actions: chosenOptionsActions, id: `${id}-chosen-pane`, isTree: isTree })));
    }
}
DualListSelector.displayName = 'DualListSelector';
DualListSelector.defaultProps = {
    availableOptions: [],
    availableOptionsTitle: 'Available options',
    availableOptionsSearchAriaLabel: 'Available search input',
    chosenOptions: [],
    chosenOptionsTitle: 'Chosen options',
    chosenOptionsSearchAriaLabel: 'Chosen search input',
    id: getUniqueId('dual-list-selector'),
    controlsAriaLabel: 'Selector controls',
    addAllAriaLabel: 'Add all',
    addSelectedAriaLabel: 'Add selected',
    removeSelectedAriaLabel: 'Remove selected',
    removeAllAriaLabel: 'Remove all'
};
//# sourceMappingURL=DualListSelector.js.map