import { __rest } from "tslib";
import * as React from 'react';
import { OUIAProps } from "@patternfly/react-core/dist/esm/helpers/OUIA/ouia";
import { debounce, canUseDOM } from "@patternfly/react-core/dist/esm/helpers/util";
import { Tr } from '../TableComposable/Tr';
export class RowWrapper extends React.Component {
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
            this.handleScroll = debounce(this.handleScroll, 100);
        }
        if (props.onResize) {
            this.handleResize = debounce(this.handleResize, 100);
        }
    }
    componentDidMount() {
        this._unmounted = false;
        if (canUseDOM) {
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
        if (canUseDOM) {
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
        trRef, className, ouiaId } = _a, props = __rest(_a, ["onScroll", "onResize", "row", "rowProps", "trRef", "className", "ouiaId"]);
        return (React.createElement(Tr, Object.assign({}, props, { ref: trRef, isExpanded: isExpanded, isEditable: isEditable, className: className, ouiaId: ouiaId })));
    }
}
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