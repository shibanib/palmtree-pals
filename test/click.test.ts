import assert from "node:assert/strict";
import test from "node:test";

import { soundForButton } from "../src/lib/click.ts";

test("each button gets its own retro sound", () => {
  const sounds = ["Cancel", "Save emojis", "Edit emojis", "Log meetup"].map(soundForButton);
  assert.deepEqual(sounds, ["cancel", "save", "edit", "log"]);
  assert.equal(new Set(sounds).size, sounds.length);
  assert.equal(soundForButton("Buy more points"), "buy");
});
