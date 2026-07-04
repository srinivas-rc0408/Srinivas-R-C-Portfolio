// ponytail: Next.js ships no "exports" map for subpaths, so plain Node ESM
// can't resolve "next/server" without an extension. This appends .js and
// retries. It also maps the "@/*" tsconfig path alias (bundler-only feature)
// to real file URLs, since plain Node doesn't read tsconfig. Remove once we
// adopt a real test runner that bundles imports.
import { pathToFileURL } from "node:url";

const ROOT = pathToFileURL(`${process.cwd()}/`);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return nextResolve(new URL(`${specifier.slice(2)}.ts`, ROOT).href, context);
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith("next/") && !specifier.endsWith(".js")) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
