const base = require('../../jest.config.base');

module.exports = {
  ...base,
  testRegex: '(__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|ts?)$',
  moduleFileExtensions: ['ts', 'js', 'node'],
  moduleDirectories: [
    'node_modules',
  ],
};
