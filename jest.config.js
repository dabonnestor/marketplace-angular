const { createCjsPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
const config = {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/server/'],
};

module.exports = config;
