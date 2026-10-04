import assert from "node:assert/strict";
import test from "node:test";

import { COIN_ANSWERS, coinKind, flipAnswer } from "../src/lib/coin.ts";

test("most coin answers send you out, with a few stay-in and batman lines", () => {
  assert.ok(COIN_ANSWERS.out.length > COIN_ANSWERS.in.length + COIN_ANSWERS.batman.length);
  assert.equal(coinKind(0.1), "out");
  assert.equal(coinKind(0.8), "in");
  assert.equal(coinKind(0.95), "batman");
  assert.match(COIN_ANSWERS.in.join(" "), /you do you, girl/i);
  assert.match(COIN_ANSWERS.in.join(" "), /self care/i);
  assert.match(COIN_ANSWERS.batman[0] ?? "", /stop trying to press this again and again/i);
  assert.match(COIN_ANSWERS.batman[1] ?? "", /please do whatever you want/i);
  assert.match(COIN_ANSWERS.batman[1] ?? "", /we're scared/i);
  const first = flipAnswer(0.95);
  assert.equal(first.kind, "batman");
  assert.equal(flipAnswer(0.95).text, first.text);
});
