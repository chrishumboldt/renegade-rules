/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@data/(.*)$': '<rootDir>/data/$1',
    '^@module/(.*)$': '<rootDir>/module/$1',
    '^@type/(.*)$': '<rootDir>/type/$1',
  },
};
