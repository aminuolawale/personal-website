// Shared API response helpers.
// Import these in route handlers instead of writing NextResponse.json(...) inline.
// Consistent status codes and error shapes across every route.

import { NextResponse } from "next/server";

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const notFound = (msg = "Not found") =>
  NextResponse.json({ error: msg }, { status: 404 });

export const badRequest = (msg: string) =>
  NextResponse.json({ error: msg }, { status: 400 });

export const serverError = (msg = "Database error") =>
  NextResponse.json({ error: msg }, { status: 500 });

// Cache-Control value used on all public (non-admin) GET responses.
// CDN serves cached data for 60s; stale data is served for up to 5 min while revalidating.
export const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";
