import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordHash,
  verifyConfiguredPassword,
} from "../src/lib/auth/password.ts";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session.ts";

test("verifies the configured password without accepting another password", () => {
  const hash = createPasswordHash("valid password");

  assert.equal(verifyConfiguredPassword("valid password", [hash]), true);
  assert.equal(verifyConfiguredPassword("wrong password", [hash]), false);
});

test("rejects malformed hashes and expired session tokens", () => {
  const now = new Date("2026-07-12T00:00:00.000Z");
  const token = createSessionToken("a test secret that is longer than thirty two bytes", now);

  assert.equal(verifyConfiguredPassword("anything", ["not-a-hash"]), false);
  assert.equal(
    verifySessionToken(token, "a test secret that is longer than thirty two bytes", new Date("2026-07-12T12:01:00.000Z")),
    false,
  );
});
