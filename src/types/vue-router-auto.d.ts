/**
 * types/vue-router-auto.d.ts
 *
 * `unplugin-vue-router` (v0.10) rewrites `vue-router/auto` imports at build
 * time, but those sub-path modules carry no `.d.ts` files and TypeScript 5.6
 * cannot resolve them. These declarations keep `vue-tsc` green; at runtime the
 * plugin still provides the real (generated) implementation.
 */

declare module 'vue-router/auto' {
  export * from 'vue-router'
}

declare module 'vue-router/auto-routes' {
  import type { RouteRecordRaw } from 'vue-router'

  export const routes: readonly RouteRecordRaw[]
}
