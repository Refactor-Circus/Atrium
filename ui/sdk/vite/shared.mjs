/*
 * The shared module API (D-082): the specifiers Atrium's page maps in its
 * import map, one instance each, and every module leaves out of its bundle.
 *
 * ATRIUM_SHARED_API is its version. A module's build records the version it
 * was built for (`dist/atrium/build.json`), and Atrium loads only modules
 * built for its own major: removing a specifier, or moving one to a new
 * major of its library, is a new major; adding one, or a minor or patch
 * update of a library, is not.
 */

/** The shared module API's version, `major.minor`. */
export const ATRIUM_SHARED_API = '1.0'

/** Each shared specifier, with the version Atrium's build carries. */
export const ATRIUM_SHARED = Object.freeze({
  vue: '3.5.46',
  'vue-router': '5.5.1',
  pinia: '3.0.4',
  'vue-i18n': '11.4.23',
  '@vueuse/core': '13.9.0',
  'openapi-fetch': '0.17.0',
  '@refactor-circus/atrium': '2.0.0',
  '@refactor-circus/atrium/ui': '2.0.0'
})

/** The shared specifiers, in import-map order. */
export const ATRIUM_SHARED_MODULES = Object.freeze(Object.keys(ATRIUM_SHARED))
