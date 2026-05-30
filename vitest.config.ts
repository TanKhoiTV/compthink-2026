import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.test.ts"],
	},
	resolve: {
		// Allow .ts extension in imports (matching tsconfig allowImportingTsExtensions)
		extensions: [".ts", ".js"],
	},
});
