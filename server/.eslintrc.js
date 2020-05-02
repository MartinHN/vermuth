module.exports = {
    root:true,
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",

    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        
        "no-debugger":"off",
        "no-empty":"off",
        "@typescript-eslint/no-explicit-any":"off",
        "@typescript-eslint/no-unused-vars":"off",
        "@typescript-eslint/explicit-function-return-type":"off",
        "@typescript-eslint/no-var-requires":"off",
        
    }
};