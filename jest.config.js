module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@lib/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    moduleFileExtensions: ['js', 'json', 'ts'],
    coveragePathIgnorePatterns: [
        'node_modules',
        'dist',
    ],
};