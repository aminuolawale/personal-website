import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";

// Wraps a route handler with session auth and error handling.
// Handlers wrapped with withAuth do not need their own auth check or try/catch.
export function withAuth<Args extends unknown[]>(
  handler: (req: NextRequest, ...args: Args) => Promise<Response>
): (req: NextRequest, ...args: Args) => Promise<Response> {
  return async (req, ...args) => {
    if (!(await getSession())) return unauthorized();
    try {
      return await handler(req, ...args);
    } catch (err) {
      console.error(err);
      return serverError();
    }
  };
}
