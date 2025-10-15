module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
            tsconfig: {
                module: 'commonjs',
                moduleResolution: 'node',
            },
            diagnostics: {
                ignoreCodes: [151002],
            },
        }],
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    moduleFileExtensions: ['js', 'json', 'ts'],
    moduleNameMapper: {
        '^@lib/(.*)$': '<rootDir>/src/$1',
    },
    coveragePathIgnorePatterns: [
        'node_modules',
        'dist',
    ],
}; 