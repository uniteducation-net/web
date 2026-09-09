import type { MDXComponents } from "mdx/types";

// Required by the App Router — MDX pages will not work without this file.
// Element styling comes from the `prose` classes on the article wrapper
// (see src/app/[lang]/updates/[slug]/page.tsx); only custom component
// overrides belong here.
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
