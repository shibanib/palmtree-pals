export const BUY_LINES = [
  "Love don't cost a thing.",
  "Can't buy my love.",
  "You will regret this.",
  "Nice try.",
  "Your money is no good here.",
  "The board does not take cards.",
  "Put the wallet down.",
  "Points are for showing up.",
  "Absolutely not.",
  "The palms cannot be bribed.",
  "Cute. Still no.",
  "We saw that.",
] as const;

export function buyAnswer(random = Math.random()): string {
  const index = Math.min(BUY_LINES.length - 1, Math.floor(random * BUY_LINES.length));
  return BUY_LINES[index] ?? BUY_LINES[0];
}
