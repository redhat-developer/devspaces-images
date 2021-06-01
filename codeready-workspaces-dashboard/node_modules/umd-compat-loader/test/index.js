const fs = require('fs');
const assert = require('assert');
const SourceMapConsumer = require('source-map').SourceMapConsumer
const index = require('../index');

describe('umd-compat-loader', function() {
	let loader,
		inputSource,
		outputSource,
		inputSourceMap,
		cjsSource,
		cjsSourceMap,
		outputAmdSource,
		outputAmdSourceMap;

	beforeEach(() => {
		inputSource = fs.readFileSync('./test/fixtures/umd.js', 'utf8');
		outputSource = fs.readFileSync('./test/fixtures/output.js', 'utf8');
		cjsSource = fs.readFileSync('./test/fixtures/commonjs.js', 'utf8');
		outputAmdSource = fs.readFileSync('./test/fixtures/output-amd.js', 'utf8');

		inputSourceMap = fs.readFileSync('./test/fixtures/umd.js.map', 'utf8');
		inputSourceMap = JSON.parse(inputSourceMap);

		outputSourceMap = fs.readFileSync('./test/fixtures/output.js.map', 'utf8');
		outputSourceMap = JSON.parse(outputSourceMap);

		outputAmdSourceMap = fs.readFileSync('./test/fixtures/output-amd.js.map', 'utf8');
		outputAmdSourceMap = JSON.parse(outputAmdSourceMap);

		cjsSourceMap = fs.readFileSync('./test/fixtures/commonjs.js.map', 'utf8');
		cjsSourceMap = JSON.parse(cjsSourceMap);

		loader = index.bind({ callback: () => {}, query: {} });
	});

	describe('content only', function () {
		it('should remove umd wrapper when sniffed', function() {
			assert.equal(loader(inputSource), outputSource);
		});

		it('should remove umd wrapper and re-wrap as amd when sniffed', function () {
			loader = index.bind({
				callback: () => {},
				query: '?amd=true'
			});
			assert.equal(loader(inputSource), outputAmdSource);
		});

		it('should not touch content when umd wrapper not sniffed', function() {
			assert.equal(loader(cjsSource), cjsSource);
		});

	});

	describe('content and sourcemap', function () {
		it('should remove umd wrapper when sniffed', function() {
			loader = index.bind({
				callback: (no, code, map) => {
					assert.equal(code, outputSource);
					assert.deepEqual(map, outputSourceMap);
				},
				query: {}
			});
			loader(inputSource, inputSourceMap);
		});

		it('should remove umd wrapper and re-wrap as amd when sniffed', function () {
			loader = index.bind({
				callback: (no, code, map) => {
					assert.equal(code, outputAmdSource);
					assert.deepEqual(map, outputAmdSourceMap);
				},
				query: '?amd=true'
			});
			loader(inputSource, inputSourceMap);
		});

		it('should not touch content or sourcemap when umd wrapper not sniffed', function() {
			loader = index.bind({
				callback: (no, code, map) => {
					assert.equal(code, cjsSource);
					assert.deepEqual(map, cjsSourceMap);
				}
			});
			loader(cjsSource, cjsSourceMap);
		});
	});

});
