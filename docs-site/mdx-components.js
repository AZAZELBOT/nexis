import { useMDXComponents as getNextraMDXComponents } from 'nextra/mdx-components'

export function useMDXComponents(components) {
  return {
    ...getNextraMDXComponents(),
    ...components
  }
}
