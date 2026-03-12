const asyncStorageMock = {};

module.exports = {
  getItem: jest.fn((key) => Promise.resolve(asyncStorageMock[key] ?? null)),
  setItem: jest.fn((key, value) => {
    asyncStorageMock[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete asyncStorageMock[key];
    return Promise.resolve();
  }),
};
