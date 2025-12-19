import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import vue from "eslint-plugin-vue";
import tseslint from "@typescript-eslint/eslint-plugin";

export default [
    {
        files: ["**/*.vue", "**/*.ts"],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: "latest",
                sourceType: "module",
                extraFileExtensions: [".vue"],
            },
        },
        plugins: {
            vue,
            "@typescript-eslint": tseslint,
        },
        rules: {
            // optional
        },
    },
];
