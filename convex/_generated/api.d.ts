/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as devLinks from "../devLinks.js";
import type * as http from "../http.js";
import type * as lib_artifacts from "../lib/artifacts.js";
import type * as lib_escape from "../lib/escape.js";
import type * as lib_hash from "../lib/hash.js";
import type * as lib_ids from "../lib/ids.js";
import type * as lib_libraryState from "../lib/libraryState.js";
import type * as lib_mail from "../lib/mail.js";
import type * as lib_token from "../lib/token.js";
import type * as libraries from "../libraries.js";
import type * as publish from "../publish.js";
import type * as users from "../users.js";
import type * as versions from "../versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  devLinks: typeof devLinks;
  http: typeof http;
  "lib/artifacts": typeof lib_artifacts;
  "lib/escape": typeof lib_escape;
  "lib/hash": typeof lib_hash;
  "lib/ids": typeof lib_ids;
  "lib/libraryState": typeof lib_libraryState;
  "lib/mail": typeof lib_mail;
  "lib/token": typeof lib_token;
  libraries: typeof libraries;
  publish: typeof publish;
  users: typeof users;
  versions: typeof versions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
