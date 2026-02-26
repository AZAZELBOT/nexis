import { useMDXComponents as getNextraMDXComponents } from "nextra/mdx-components";
import { useMDXComponents as getThemeMDXComponents } from "nextra-theme-docs";

export function useMDXComponents(components) {
  return {
    ...getThemeMDXComponents(),
    ...getNextraMDXComponents(),
    ...components,
  };
}
