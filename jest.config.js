module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@babel/preset-env'] }]
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  roots: ['<rootDir>/tests']
};
