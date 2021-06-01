import { __rest } from "tslib";
import * as React from 'react';
import Dropzone from 'react-dropzone';
import { FileUploadField } from './FileUploadField';
import { readFile, fileReaderType } from '../../helpers/fileUtils';
export const FileUpload = (_a) => {
    var { id, type, value = type === fileReaderType.text || type === fileReaderType.dataURL ? '' : null, filename = '', children = null, onChange = () => { }, onReadStarted = () => { }, onReadFinished = () => { }, onReadFailed = () => { }, dropzoneProps = {} } = _a, props = __rest(_a, ["id", "type", "value", "filename", "children", "onChange", "onReadStarted", "onReadFinished", "onReadFailed", "dropzoneProps"]);
    const onDropAccepted = (acceptedFiles, event) => {
        if (acceptedFiles.length > 0) {
            const fileHandle = acceptedFiles[0];
            if (type === fileReaderType.text || type === fileReaderType.dataURL) {
                onChange('', fileHandle.name, event); // Show the filename while reading
                onReadStarted(fileHandle);
                readFile(fileHandle, type)
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
    return (React.createElement(Dropzone, Object.assign({ multiple: false }, dropzoneProps, { onDropAccepted: onDropAccepted, onDropRejected: onDropRejected }), ({ getRootProps, getInputProps, isDragActive, open }) => (React.createElement(FileUploadField, Object.assign({}, getRootProps(Object.assign(Object.assign({}, props), { refKey: 'containerRef', onClick: event => event.preventDefault() // Prevents clicking TextArea from opening file dialog
     })), { tabIndex: null, id: id, type: type, filename: filename, value: value, onChange: onChange, isDragActive: isDragActive, onBrowseButtonClick: open, onClearButtonClick: onClearButtonClick }),
        React.createElement("input", Object.assign({}, getInputProps())),
        children))));
};
FileUpload.displayName = 'FileUpload';
//# sourceMappingURL=FileUpload.js.map