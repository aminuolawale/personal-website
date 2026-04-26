// @vitest-environment node
import { describe, it, expect } from "vitest";
import { unauthorized, notFound, badRequest, serverError } from "@/lib/api";

describe("API helpers", () => {
  it("unauthorized returns 401", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("notFound returns 404 with default message", async () => {
    const res = notFound();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("notFound returns 404 with custom message", async () => {
    const res = notFound("Article missing");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Article missing" });
  });

  it("badRequest returns 400 with message", async () => {
    const res = badRequest("articleId required");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "articleId required" });
  });

  it("serverError returns 500", async () => {
    const res = serverError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
