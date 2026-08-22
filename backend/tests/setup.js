// Test environment setup. We use in-memory model mocks (see tests/mocks)
// instead of a real MongoDB connection, since this sandbox's network policy
// blocks downloading the mongodb-memory-server binary. The mocks implement
// the same create/findOne/find(...).select().sort() surface the routes use.

const User = require("./mocks/User");
const Document = require("./mocks/Document");
const ChatMessage = require("./mocks/ChatMessage");
const Visit = require("./mocks/Visit");

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

afterEach(() => {
  User.__reset();
  Document.__reset();
  ChatMessage.__reset();
  Visit.__reset();
});
