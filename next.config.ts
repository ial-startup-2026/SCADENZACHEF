import type { NextConfig } from "next";

/**
 * VETRINA=1 (`npm run build:vetrina`): esportazione statica per GitHub Pages.
 * Le pagine della vetrina sono i file `*.vetrina.tsx`: con `pageExtensions` Next ignora tutti gli
 * altri (login, proxy, Server Action…), che GitHub Pages non potrebbe far girare.
 * Il controllo dei tipi si fa prima, in modalità normale (`npm run typecheck`).
 */
const vetrina = process.env.VETRINA === "1";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(vetrina && {
    output: "export",
    basePath: "/SCADENZACHEF",
    trailingSlash: true,
    images: { unoptimized: true },
    pageExtensions: ["vetrina.tsx"],
    typescript: { ignoreBuildErrors: true },
  }),
};

export default nextConfig;
