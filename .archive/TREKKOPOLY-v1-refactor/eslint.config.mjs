// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		ignores: ["build/**", "_site/**", "public/assets/**", "TREKPOLOGY/**"],
	},
	{
		rules: {
			"@typescript-eslint/no-explicit-any": [
				"warn",
				{
					ignoreRestArgs: false,
				},
			],
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_" },
			],
			"no-console": "off",
		},
	},
	// Allow (globalThis as any) pattern — required for inline onclick handlers
	{
		files: ["src/**/*.ts"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
);
