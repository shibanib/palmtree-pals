import { buyLines } from "../data/settings.ts";

export const BUY_LINES = buyLines;

export function buyAnswer(random = Math.random()): string {
  const index = Math.min(BUY_LINES.length - 1, Math.floor(random * BUY_LINES.length));
  return BUY_LINES[index] ?? BUY_LINES[0];
}
