"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUpload = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_dropzone_1 = tslib_1.__importDefault(require("react-dropzone"));
const FileUploadField_1 = require("./FileUploadField");
const fileUtils_1 = require("../../helpers/fileUtils");
exports.FileUpload = (_a) => {
    var { id, type, value = type === fileUtils_1.fileReaderType.text || type === fileUtils_1.fileReaderType.dataURL ? '' : null, filename = '', children = null, onChange = () => { }, onReadStarted = () => { }, onReadFinished = () => { }, onReadFailed = () => { }, dropzoneProps = {} } = _a, props = tslib_1.__rest(_a, ["id", "type", "value", "filename", "children", "onChange", "onReadStarted", "onReadFinished", "onReadFailed", "dropzoneProps"]);
    const onDropAccepted = (acceptedFiles, event) => {
        if (acceptedFiles.length > 0) {
            const fileHandle = acceptedFiles[0];
            if (type === fileUtils_1.fileReaderType.text || type === fileUtils_1.fileReaderType.dataURL) {
                onChange('', fileHandle.name, event); // Show the filename while reading
                onReadStarted(fileHandle);
                fileUtils_1.readFile(fileHandle, type)
                    .then(data => {
                    onReadFinished(fileHandle);
                    onChange(data, fileHandle.name, event);
                })
                    .catch((error) => {
                    onReadFailed(error, fileHandle);
                    onReadFinished(fileHandle);
                    onChange('', '', event); // Clear the filename field on a failure
                });
            }
            else {
                onChange(fileHandle, fileHandle.name, event);
            }
        }
        dropzoneProps.onDropAccepted && dropzoneProps.onDropAccepted(acceptedFiles, event);
    };
    const onDropRejected = (rejectedFiles, event) => {
        if (rejectedFiles.length > 0) {
            onChange('', rejectedFiles[0].name, event);
        }
        dropzoneProps.onDropRejected && dropzoneProps.onDropRejected(rejectedFiles, event);
    };
    const onClearButtonClick = (event) => {
        onChange('', '', event);
    };
    return (React.createElement(react_dropzone_1.default, Object.assign({ multiple: false }, dropzoneProps, { onDropAccepted: onDropAccepted, onDropRejected: onDropRejected }), ({ getRootProps, getInputProps, isDragActive, open }) => (React.createElement(FileUploadField_1.FileUploadField, Object.assign({}, getRootProps(Object.assign(Object.assign({}, props), { refKey: 'containerRef', onClick: event => event.preventDefault() // Prevents clicking TextArea from opening file dialog
     })), { tabIndex: null, id: id, type: type, filename: filename, value: value, onChange: onChange, isDragActive: isDragActive, onBrowseButtonClick: open, onClearButtonClick: onClearButtonClick }),
        React.createElement("input", Object.assign({}, getInputProps())),
        children))));
};
exports.FileUpload.displayName = 'FileUpload';
//# sourceMappingURL=FileUpload.js.map