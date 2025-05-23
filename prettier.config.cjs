module.exports = {
    printWidth: 100,
    semi: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-svelte'],
    importOrder: [
        '<BUILT_IN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@/(.*)$',
        '^~/(.*)$',
        '',
        '^[.]',
    ],
};
