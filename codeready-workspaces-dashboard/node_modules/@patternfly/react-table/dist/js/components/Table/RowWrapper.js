"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RowWrapper = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const util_1 = require("@patternfly/react-core/dist/js/helpers/util");
const Tr_1 = require("../TableComposable/Tr");
class RowWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.handleScroll = (event) => {
            if (!this._unmounted) {
                this.props.onScroll(event);
            }
        };
        this.handleResize = (event) => {
            if (!this._unmounted) {
                this.props.onResize(event);
            }
        };
        if (props.onScroll) {
            this.handleScroll = util_1.debounce(this.handleScroll, 100);
        }
        if (props.onResize) {
            this.handleResize = util_1.debounce(this.handleResize, 100);
        }
    }
    componentDidMount() {
        this._unmounted = false;
        if (util_1.canUseDOM) {
            if (this.props.onScroll) {
                window.addEventListener('scroll', this.handleScroll);
            }
            if (this.props.onResize) {
                window.addEventListener('resize', this.handleResize);
            }
        }
    }
    componentWillUnmount() {
        this._unmounted = true;
        if (util_1.canUseDOM) {
            if (this.props.onScroll) {
                window.removeEventListener('scroll', this.handleScroll);
            }
            if (this.props.onResize) {
                window.removeEventListener('resize', this.handleResize);
            }
        }
    }
    render() {
        const _a = this.props, { 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onScroll, onResize, row: { isExpanded, isEditable }, rowProps, 
        /* eslint-enable @typescript-eslint/no-unused-vars */
        trRef, className, ouiaId } = _a, props = tslib_1.__rest(_a, ["onScroll", "onResize", "row", "rowProps", "trRef", "className", "ouiaId"]);
        return (React.createElement(Tr_1.Tr, Object.assign({}, props, { ref: trRef, isExpanded: isExpanded, isEditable: isEditable, className: className, ouiaId: ouiaId })));
    }
}
exports.RowWrapper = RowWrapper;
RowWrapper.displayName = 'RowWrapper';
RowWrapper.defaultProps = {
    className: '',
    row: {
        isOpen: undefined,
        isExpanded: undefined,
        isHeightAuto: undefined,
        isEditable: undefined
    },
    rowProps: null
};
//# sourceMappingURL=RowWrapper.js.map