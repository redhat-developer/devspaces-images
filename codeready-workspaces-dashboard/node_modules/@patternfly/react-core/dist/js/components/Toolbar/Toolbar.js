"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const toolbar_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Toolbar/toolbar"));
const GenerateId_1 = require("../../helpers/GenerateId/GenerateId");
const react_styles_1 = require("@patternfly/react-styles");
const ToolbarUtils_1 = require("./ToolbarUtils");
const ToolbarChipGroupContent_1 = require("./ToolbarChipGroupContent");
const util_1 = require("../../helpers/util");
class Toolbar extends React.Component {
    constructor() {
        super(...arguments);
        this.chipGroupContentRef = React.createRef();
        this.staticFilterInfo = {};
        this.state = {
            isManagedToggleExpanded: false,
            filterInfo: {}
        };
        this.isToggleManaged = () => !(this.props.isExpanded || !!this.props.toggleIsExpanded);
        this.toggleIsExpanded = () => {
            this.setState(prevState => ({
                isManagedToggleExpanded: !prevState.isManagedToggleExpanded
            }));
        };
        this.closeExpandableContent = () => {
            this.setState(() => ({
                isManagedToggleExpanded: false
            }));
        };
        this.updateNumberFilters = (categoryName, numberOfFilters) => {
            const filterInfoToUpdate = Object.assign({}, this.staticFilterInfo);
            if (!filterInfoToUpdate.hasOwnProperty(categoryName) || filterInfoToUpdate[categoryName] !== numberOfFilters) {
                filterInfoToUpdate[categoryName] = numberOfFilters;
                this.staticFilterInfo = filterInfoToUpdate;
                this.setState({ filterInfo: filterInfoToUpdate });
            }
        };
        this.getNumberOfFilters = () => Object.values(this.state.filterInfo).reduce((acc, cur) => acc + cur, 0);
        this.renderToolbar = (randomId) => {
            const _a = this.props, { clearAllFilters, clearFiltersButtonText, collapseListedFiltersBreakpoint, isExpanded: isExpandedProp, toggleIsExpanded, className, children, inset, usePageInsets } = _a, props = tslib_1.__rest(_a, ["clearAllFilters", "clearFiltersButtonText", "collapseListedFiltersBreakpoint", "isExpanded", "toggleIsExpanded", "className", "children", "inset", "usePageInsets"]);
            const { isManagedToggleExpanded } = this.state;
            const isToggleManaged = this.isToggleManaged();
            const isExpanded = isToggleManaged ? isManagedToggleExpanded : isExpandedProp;
            const numberOfFilters = this.getNumberOfFilters();
            const showClearFiltersButton = numberOfFilters > 0;
            return (React.createElement("div", Object.assign({ className: react_styles_1.css(toolbar_1.default.toolbar, usePageInsets && toolbar_1.default.modifiers.pageInsets, util_1.formatBreakpointMods(inset, toolbar_1.default), className), id: randomId }, props),
                React.createElement(ToolbarUtils_1.ToolbarContext.Provider, { value: {
                        isExpanded,
                        toggleIsExpanded: isToggleManaged ? this.toggleIsExpanded : toggleIsExpanded,
                        chipGroupContentRef: this.chipGroupContentRef,
                        updateNumberFilters: this.updateNumberFilters,
                        numberOfFilters,
                        clearAllFilters,
                        clearFiltersButtonText,
                        showClearFiltersButton,
                        toolbarId: randomId
                    } },
                    children,
                    React.createElement(ToolbarChipGroupContent_1.ToolbarChipGroupContent, { isExpanded: isExpanded, chipGroupContentRef: this.chipGroupContentRef, clearAllFilters: clearAllFilters, showClearFiltersButton: showClearFiltersButton, clearFiltersButtonText: clearFiltersButtonText, numberOfFilters: numberOfFilters, collapseListedFiltersBreakpoint: collapseListedFiltersBreakpoint }))));
        };
    }
    componentDidMount() {
        if (this.isToggleManaged()) {
            window.addEventListener('resize', this.closeExpandableContent);
        }
    }
    componentWillUnmount() {
        if (this.isToggleManaged()) {
            window.removeEventListener('resize', this.closeExpandableContent);
        }
    }
    render() {
        return this.props.id ? (this.renderToolbar(this.props.id)) : (React.createElement(GenerateId_1.GenerateId, null, randomId => this.renderToolbar(randomId)));
    }
}
exports.Toolbar = Toolbar;
Toolbar.displayName = 'Toolbar';
//# sourceMappingURL=Toolbar.js.map