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
import type * as base from "../base.js";
import type * as crons from "../crons.js";
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
import type * as signIn_appleIdentity from "../signIn/appleIdentity.js";
import type * as signIn_appleNative from "../signIn/appleNative.js";
import type * as signIn_appleSecret from "../signIn/appleSecret.js";
import type * as signIn_appleTokens from "../signIn/appleTokens.js";
import type * as signIn_codes from "../signIn/codes.js";
import type * as signIn_emailCode from "../signIn/emailCode.js";
import type * as signIn_emails from "../signIn/emails.js";
import type * as signIn_functions from "../signIn/functions.js";
import type * as signIn_password from "../signIn/password.js";
import type * as signIn_providers from "../signIn/providers.js";
import type * as signIn_redirect from "../signIn/redirect.js";
import type * as signIn_social from "../signIn/social.js";
import type * as signIn_systemOwner from "../signIn/systemOwner.js";
import type * as signIn_users from "../signIn/users.js";
import type * as users from "../users.js";
import type * as versions from "../versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  base: typeof base;
  crons: typeof crons;
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
  "signIn/appleIdentity": typeof signIn_appleIdentity;
  "signIn/appleNative": typeof signIn_appleNative;
  "signIn/appleSecret": typeof signIn_appleSecret;
  "signIn/appleTokens": typeof signIn_appleTokens;
  "signIn/codes": typeof signIn_codes;
  "signIn/emailCode": typeof signIn_emailCode;
  "signIn/emails": typeof signIn_emails;
  "signIn/functions": typeof signIn_functions;
  "signIn/password": typeof signIn_password;
  "signIn/providers": typeof signIn_providers;
  "signIn/redirect": typeof signIn_redirect;
  "signIn/social": typeof signIn_social;
  "signIn/systemOwner": typeof signIn_systemOwner;
  "signIn/users": typeof signIn_users;
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
