import { coinBatman, coinOut, coinStay, goOutChance, stayInChance } from "../data/settings.ts";

export type CoinKind = "out" | "in" | "batman";

export const COIN_ANSWERS: Record<CoinKind, readonly string[]> = {
  out: coinOut,
  in: coinStay,
  batman: coinBatman,
};

export function coinKind(random: number): CoinKind {
  if (random < goOutChance) return "out";
  if (random < goOutChance + stayInChance) return "in";
  return "batman";
}

export function flipAnswer(random = Math.random()): { kind: CoinKind; text: string } {
  const kind = coinKind(random);
  const pool = COIN_ANSWERS[kind];
  const index = Math.floor(random * pool.length * 17) % pool.length;
  return { kind, text: pool[index] ?? pool[0] };
}
