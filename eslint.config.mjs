import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/canvas/**/*.{js,jsx,ts,tsx,mjs,cjs}", "components/canvas/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/components/sections/**", "@/components/sections/**", "@components/sections/**", "../sections/**", "../../sections/**"], message: "Canvas components must not depend on page sections." },
          { group: ["react-dom", "react-dom/**", "next/document", "next/navigation", "next/router"], message: "Canvas components must not import DOM or navigation APIs." },
        ],
      }],
      "no-restricted-globals": ["error",
        { name: "window", message: "Canvas components must not touch window directly; use R3F state or SSR-guarded hooks." },
        { name: "document", message: "Canvas components must not touch document directly; use R3F state or SSR-guarded hooks." },
      ],
    },
  },
  {
    files: ["components/sections/**/*.{js,jsx,ts,tsx,mjs,cjs}", "components/typography/**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["three", "three/**", "@react-three/*", "@react-three/**"], message: "Sections and typography must not depend on Three.js." }],
      }],
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
