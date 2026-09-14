import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'JSXOpeningElement[name.name="Image"] > JSXAttribute[name.name="width"], JSXOpeningElement[name.name="Image"] > JSXAttribute[name.name="height"]',
          message:
            "Don't pass width/height to Image — use `fill` inside a sized wrapper (see src/components/illustration-image.tsx) to avoid aspect-ratio warnings.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
