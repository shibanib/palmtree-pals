export type CoinKind = "out" | "in" | "batman";

export const COIN_ANSWERS: Record<CoinKind, readonly string[]> = {
  out: [
    "Signs point to outside.",
    "Go out. The night already said yes.",
    "Shoes on. The palms agree.",
    "Outlook: a story and a snack.",
    "Yes. Leave the house.",
    "The door is the whole plan.",
    "A meetup is lurking. Go find it.",
    "Absolutely. The sunset is a hint.",
    "Don't negotiate with the couch.",
    "Ask again only after you're out.",
  ],
  in: [
    "You do you, girl. The blanket can win tonight.",
    "Self care counts. Stay in and mean it.",
  ],
  batman: [
    "If this is batman: stop trying to press this again and again.",
    "If this is batman: please do whatever you want. We're scared.",
  ],
};

export function coinKind(random: number): CoinKind {
  if (random < 0.72) return "out";
  if (random < 0.88) return "in";
  return "batman";
}

export function flipAnswer(random = Math.random()): { kind: CoinKind; text: string } {
  const kind = coinKind(random);
  const pool = COIN_ANSWERS[kind];
  const index = Math.floor(random * pool.length * 17) % pool.length;
  return { kind, text: pool[index] ?? pool[0] };
}
