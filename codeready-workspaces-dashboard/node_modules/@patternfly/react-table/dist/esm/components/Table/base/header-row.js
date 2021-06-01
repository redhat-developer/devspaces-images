/**
 * header-row.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import * as React from 'react';
import { evaluateFormatters } from './evaluate-formatters';
import { evaluateTransforms } from './evaluate-transforms';
import { mergeProps } from './merge-props';
import { HeaderCellInfoWrapper } from '../HeaderCellInfoWrapper';
export const HeaderRow = ({ rowData, rowIndex, renderers, onRow = () => Object }) => React.createElement(renderers.row, onRow(rowData, { rowIndex }), rowData.map((column, columnIndex) => {
    const { property, header = {}, props = {} } = column;
    const evaluatedProperty = property || (header && header.property);
    const { label, transforms = [], formatters = [], info = {} } = header;
    const extraParameters = {
        columnIndex,
        property: evaluatedProperty,
        column
    };
    const transformedProps = evaluateTransforms(transforms, label, extraParameters);
    if (!transformedProps) {
        // tslint:disable-next-line:no-console
        console.warn('Table.Header - Failed to receive a transformed result'); // eslint-disable-line max-len, no-console
    }
    let cellNode;
    const { tooltip, tooltipProps, popover, popoverProps, ariaLabel, className } = info;
    // consumer can specify header cell tooltip/popover in two ways, but the transforms approach is preferred,
    // especially for sorting tables that use `transforms: [sortable]`
    // {
    //   title: 'Repositories',
    //   header: {
    //     info: {
    //       tooltip: 'More information about repositories',
    //       className: 'repositories-info-tip',
    //       tooltipProps: {
    //         isContentLeftAligned: true
    //       }
    //     }
    //   }
    // }
    //
    // {
    //   title: 'Repositories',
    //   transforms: [
    //     info({
    //       tooltip: 'More information about repositories',
    //       className: 'repositories-info-tip',
    //       tooltipProps: {
    //         isContentLeftAligned: true
    //       }
    //     }),
    //     sortable
    //   ]
    // },
    if (tooltip) {
        cellNode = (React.createElement(HeaderCellInfoWrapper, { variant: "tooltip", info: tooltip, tooltipProps: tooltipProps, ariaLabel: ariaLabel, className: className }, transformedProps.children || evaluateFormatters(formatters)(label, extraParameters)));
    }
    else if (popover) {
        cellNode = (React.createElement(HeaderCellInfoWrapper, { variant: "popover", info: popover, popoverProps: popoverProps, ariaLabel: ariaLabel, className: className }, transformedProps.children || evaluateFormatters(formatters)(label, extraParameters)));
    }
    else {
        cellNode = transformedProps.children || evaluateFormatters(formatters)(label, extraParameters);
    }
    return React.createElement(renderers.cell, Object.assign({ key: `${columnIndex}-header` }, mergeProps(props, header && header.props, transformedProps)), cellNode);
}));
HeaderRow.displayName = 'HeaderRow';
//# sourceMappingURL=header-row.js.map