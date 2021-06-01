"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const schemaRequestHandler_1 = require("../src/languageservice/services/schemaRequestHandler");
const sinon = require("sinon");
const fs = require("fs");
const assert = require("assert");
suite('Schema Request Handler Tests', () => {
    suite('schemaRequestHandler', () => {
        const sandbox = sinon.createSandbox();
        let readFileStub;
        setup(() => {
            readFileStub = sandbox.stub(fs, 'readFile');
        });
        teardown(() => {
            sandbox.restore();
        });
        test('Should care Win URI', () => __awaiter(void 0, void 0, void 0, function* () {
            const connection = {};
            const resultPromise = schemaRequestHandler_1.schemaRequestHandler(connection, 'c:\\some\\window\\path\\scheme.json');
            assert.ok(readFileStub.calledOnceWith('c:\\some\\window\\path\\scheme.json'));
            readFileStub.callArgWith(2, undefined, '{some: "json"}');
            const result = yield resultPromise;
            assert.equal(result, '{some: "json"}');
        }));
        test('UNIX URI should works', () => __awaiter(void 0, void 0, void 0, function* () {
            const connection = {};
            const resultPromise = schemaRequestHandler_1.schemaRequestHandler(connection, '/some/unix/path/');
            readFileStub.callArgWith(2, undefined, '{some: "json"}');
            const result = yield resultPromise;
            assert.equal(result, '{some: "json"}');
        }));
    });
});
//# sourceMappingURL=shemaRequestHandler.test.js.map