module.exports = {
  testEnvironment: "node",
  transform: {},
  testTimeout: 20000,
  watchman: false,
  moduleNameMapper: {
    "^\\.\\./models/User$": "<rootDir>/tests/mocks/User.js",
    "^\\.\\./models/Document$": "<rootDir>/tests/mocks/Document.js",
    "^\\.\\./models/ChatMessage$": "<rootDir>/tests/mocks/ChatMessage.js",
    "^\\.\\./models/Visit$": "<rootDir>/tests/mocks/Visit.js",
    "^\\./models/Visit$": "<rootDir>/tests/mocks/Visit.js",
  },
};
