import assert from "node:assert/strict";
import test from "node:test";

import { BUY_LINES, buyAnswer } from "../src/lib/buy.ts";

test("buying points is a joke and never a price", () => {
  const lines = BUY_LINES.join(" ");
  assert.match(lines, /Love don't cost a thing/);
  assert.match(lines, /Can't buy my love/);
  assert.match(lines, /You will regret this/);
  assert.match(lines, /Nice try/);
  assert.match(lines, /Your money is no good here/);
  assert.equal(new Set(BUY_LINES).size, BUY_LINES.length);
  assert.equal(buyAnswer(0), BUY_LINES[0]);
  assert.equal(buyAnswer(0.999), BUY_LINES[BUY_LINES.length - 1]);
  assert.equal(buyAnswer(0.4), buyAnswer(0.4));
});
