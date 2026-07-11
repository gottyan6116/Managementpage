import assert from "node:assert/strict";
import test from "node:test";
import { validatePresentationUpload } from "../src/lib/presentations/validation.ts";

test("accepts a pptx file with a ZIP signature", async () => {
  const file = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], "strategy.pptx", {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });

  assert.deepEqual(await validatePresentationUpload(file), { ok: true, extension: "pptx" });
});

test("rejects a renamed executable and unsupported extension", async () => {
  const executable = new File([new Uint8Array([0x4d, 0x5a])], "unsafe.pptx", {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "document.pdf", { type: "application/pdf" });

  assert.equal((await validatePresentationUpload(executable)).ok, false);
  assert.equal((await validatePresentationUpload(pdf)).ok, false);
});
