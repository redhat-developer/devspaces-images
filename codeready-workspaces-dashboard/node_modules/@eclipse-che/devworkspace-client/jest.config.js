module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|ts?)$",
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  moduleFileExtensions: ["ts", "js", "node"],
  moduleDirectories: [
    'node_modules',
  ],
  setupFiles: ['./src/node/inversify.config.ts']
};
