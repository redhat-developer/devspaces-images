/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

declare module 'moxios' {
    export class Moxios {
        constructor(defaultInstance: any);
        /**
         * The mock adapter that gets installed.
         *
         * @param {Function} resolve The function to call when Promise is resolved
         * @param {Function} reject The function to call when Promise is rejected
         * @param {Object} config The config object to be used for the request
         */
        mockAdapter(config: any): any;
        /**
         * create common object for timeout response
         *
         * @param {object} config The config object to be used for the request
         */
        createTimeout(config: any): any;
        /**
         * throw common error for timeout response
         *
         * @param {object} config The config object to be used for the request
         */
        throwTimeout(config: any): void;
        install(axiosInstance: any): void;
        /**
         * Uninstall the mock adapter and reset state
         */
        uninstall(axiosInstance: any): void;
        /**
         * Stub a response to be used to respond to a request matching a method and a URL or RegExp
         *
         * @param {String} method An axios command
         * @param {String|RegExp} urlOrRegExp A URL or RegExp to test against
         * @param {Object} response The response to use when a match is made
         */
        stubRequest(method: any, urlOrRegExp: any, response: any): void;
        /**
         * Stub a response to be used one or more times to respond to a request matching a
         * method and a URL or RegExp.
         *
         * @param {String} method An axios command
         * @param {String|RegExp} urlOrRegExp A URL or RegExp to test against
         * @param {Object} response The response to use when a match is made
         */
        stubOnce(method: any, urlOrRegExp: any, response: any): any;
        /**
         * Stub a timed response to a request matching a method and a URL or RegExp. If
         * timer fires, reject with a TimeoutException for simple assertions. The goal is
         * to show that a certain request was not made.
         *
         * @param {String} method An axios command
         * @param {String|RegExp} urlOrRegExp A URL or RegExp to test against
         * @param {Object} response The response to use when a match is made
         */
        stubFailure(method: any, urlOrRegExp: any, response: any): any;
        /**
         * Stub a timeout to be used to respond to a request matching a URL or RegExp
         *
         * @param {String|RegExp} urlOrRegExp A URL or RegExp to test against
         */
        stubTimeout(urlOrRegExp: any): void;
        /**
         * Run a single test with mock adapter installed.
         * moxios will install the mock adapter, execute the function provided,
         * then uninstall the mock adapter once complete.
         *
         * @param {Function} fn The function to be executed
         */
        withMock(fn: any): void;
        /**
         * Wait for request to be made before proceding.
         * This is naively using a `setTimeout`.
         * May need to beef this up a bit in the future.
         *
         * @param {Function} fn Optional function to execute once waiting is over
         * @param {Number} delay How much time in milliseconds to wait
         *
         * @return {Object} Promise that gets resolved when waiting completed
         */
        wait(...args: any[]): any;
    }
    const defaultMoxiosInstance: any;
    export default defaultMoxiosInstance;
}
