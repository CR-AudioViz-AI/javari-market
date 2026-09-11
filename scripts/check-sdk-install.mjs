#!/usr/bin/env node
// scripts/check-sdk-install.mjs
// Purpose: fail the build if the installed @craudioviz/platform-sdk is not the pinned commit.
// Date: 2026-09-10
//
// On 2026-09-10 a production build restored Vercel's build cache, kept a STALE copy
// of the SDK in node_modules even though package.json pinned a newer commit, and
// shipped: "Attempted import error: 'EMBED_PREPAINT_SCRIPT' is not exported" was
// only a WARNING, the build went green, and every page answered 500 until it was
// rolled back two minutes later. The preview of the same commit had installed the
// right SDK - so this is intermittent, which is exactly why it needs a guard.
//
// A failed build is safe. A 500 in production is not.
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const fail = (m) => { console.error(`[check-sdk-install] FAIL: ${m}`); console.error("[check-sdk-install] Redeploy without the build cache (Vercel: forceNew / VERCEL_FORCE_NO_BUILD_CACHE=1)."); process.exit(1); };

const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const spec = pkg.dependencies?.["@craudioviz/platform-sdk"] ?? "";
const pinned = spec.match(/#([0-9a-f]{40})$/)?.[1];
if (!pinned) fail(`package.json must pin @craudioviz/platform-sdk to a full commit SHA (got "${spec}")`);

const lockPath = `${root}node_modules/.package-lock.json`;
if (existsSync(lockPath)) {
  const installed = JSON.parse(readFileSync(lockPath, "utf8")).packages?.["node_modules/@craudioviz/platform-sdk"]?.resolved ?? "";
  const installedSha = installed.match(/#([0-9a-f]{40})$/)?.[1];
  if (installedSha !== pinned) fail(`installed SDK is ${installedSha ?? "unknown"} but package.json pins ${pinned} (stale build cache)`);
} else {
  // pnpm/yarn keep no .package-lock.json; the export check below is the proof there.
  console.log("[check-sdk-install] no npm install record (pnpm/yarn) - checking the installed SDK's exports instead");
}

// Belt and braces: the exports this app imports must exist in what was installed.
const index = readFileSync(`${root}node_modules/@craudioviz/platform-sdk/index.ts`, "utf8");
for (const name of ["EMBED_PREPAINT_SCRIPT", "EmbedBridge", "isEmbedded", "parentAccessToken"]) {
  if (!index.includes(name)) fail(`installed SDK does not export ${name}`);
}
// 2026-09-11 - second layer. The files above can be right while the BUILD CACHE still
// holds code compiled from the previous SDK: Next's cache treats an installed package
// whose version is unchanged as unchanged, and the SDK stayed at 1.0.0 for 52 commits.
// javari-omni-media passed this guard and still shipped the old SDK (React #61). So when
// the installed SDK commit differs from the one the cache was built with, the compiled
// caches are dropped before the build. Images and fetched data are kept.
const cacheDir = `${root}.next/cache`;
if (existsSync(cacheDir)) {
  const marker = `${cacheDir}/.platform-sdk-commit`;
  const previous = existsSync(marker) ? readFileSync(marker, "utf8").trim() : "";
  if (previous !== pinned) {
    for (const d of ["webpack", "turbopack", "swc"]) rmSync(`${cacheDir}/${d}`, { recursive: true, force: true });
    writeFileSync(marker, pinned);
    console.log(`[check-sdk-install] SDK changed (${previous ? previous.slice(0, 8) : "unknown"} -> ${pinned.slice(0, 8)}): compiled build cache cleared`);
  }
}
console.log(`[check-sdk-install] OK: platform-sdk ${pinned.slice(0, 8)} installed as pinned`);
