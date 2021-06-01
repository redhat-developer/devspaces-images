"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = exports.editableRows = exports.editableColumns = exports.rows = exports.columns = void 0;
const tslib_1 = require("tslib");
/* eslint-disable no-console */
const React = tslib_1.__importStar(require("react"));
const Table_1 = require("../components/Table");
exports.columns = [
    { title: 'Header cell' },
    'Branches',
    { title: 'Pull requests' },
    'Workspaces',
    {
        title: 'Last Commit'
    }
];
exports.rows = [
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    },
    {
        cells: ['one', 'two', 'three', 'four', 'five']
    }
];
exports.editableColumns = [
    'Text input col 1',
    'Disabled text input col 2',
    'Text input col 3',
    'Text input col 4'
];
exports.editableRows = [
    {
        isEditable: true,
        cells: [
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, handleTextInputChange: () => { }, inputAriaLabel: "Row 1 cell 1 content" })),
                props: {
                    value: 'Row 1 cell 1 content',
                    name: 'uniqueIdRow1Cell1'
                }
            },
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, isDisabled: true, handleTextInputChange: () => { }, inputAriaLabel: "Row 1 cell 2 content" })),
                props: {
                    value: 'Row 1 cell 2, disabled content',
                    name: 'uniqueIdRow1Cell2'
                }
            },
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, handleTextInputChange: () => { }, inputAriaLabel: "Row 1 cell 3 content" })),
                props: {
                    value: 'Row 1 cell 3 content',
                    name: 'uniqueIdRow1Cell3'
                }
            },
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, handleTextInputChange: () => { }, inputAriaLabel: "Row 1 cell 4 content" })),
                props: {
                    value: 'Row 1 cell 4 content',
                    name: 'uniqueIdRow1Cell4'
                }
            }
        ]
    },
    {
        isEditable: false,
        cells: [
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, handleTextInputChange: () => { }, inputAriaLabel: "Row 1 cell 1 content" })),
                props: {
                    value: 'Row 2 cell 1 content',
                    name: 'uniqueIdRow2Cell1'
                }
            },
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, isDisabled: true, handleTextInputChange: () => { }, inputAriaLabel: "Row 2 cell 2 content" })),
                props: {
                    value: 'Row 2 cell 2, disabled content',
                    name: 'uniqueIdRow2Cell2'
                }
            },
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, handleTextInputChange: () => { }, inputAriaLabel: "Row 2 cell 3 content" })),
                props: {
                    value: 'Row 2 cell 3 content',
                    name: 'uniqueIdRow2Cell3'
                }
            },
            {
                title: (value, rowIndex, cellIndex, props) => (React.createElement(Table_1.EditableTextCell, { value: value, rowIndex: rowIndex, cellIndex: cellIndex, props: props, handleTextInputChange: () => { }, inputAriaLabel: "Row 2 cell 4 content" })),
                props: {
                    value: 'Row 2 cell 4 content',
                    name: 'uniqueIdRow2Cell4'
                }
            }
        ]
    }
];
exports.actions = [
    {
        title: 'Some action',
        onClick: (event, rowId) => 
        // tslint:disable-next-line:no-console
        console.log('clicked on Some action, on row: ', rowId)
    },
    {
        title: React.createElement("div", null, "Another action"),
        onClick: (event, rowId) => 
        // tslint:disable-next-line:no-console
        console.log('clicked on Another action, on row: ', rowId)
    },
    {
        isSeparator: true,
        onClick: null
    },
    {
        title: 'Third action',
        onClick: (event, rowId) => 
        // tslint:disable-next-line:no-console
        console.log('clicked on Third action, on row: ', rowId)
    }
];
//# sourceMappingURL=data-sets.js.map