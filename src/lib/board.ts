export const ROSTER = ["ninja", "louise", "joker", "batman"] as const;

export type Person = (typeof ROSTER)[number];

export type Buyer =
  | { kind: "person"; name: Person }
  | { kind: "group"; names: Person[] };

export type DrinkStop = {
  milestone: number;
  buyer: Buyer;
  skipped: Person | null;
};

export type MeetupInput = {
  id: string;
  date: string;
  attendees: readonly string[];
  emojis: string;
  emojisArePlaceholder?: boolean;
  sequence: number;
};

export type Meetup = {
  id: string;
  date: string;
  attendees: Person[];
  emojis: string;
  emojisArePlaceholder: boolean;
  sequence: number;
  source: "shared" | "local";
};

export type LocalExtras = {
  meetups: MeetupInput[];
  emojiEdits: Record<string, string>;
};

export type MilestoneKind = "batman" | "goa" | "draw";

export type Board = {
  meetups: Meetup[];
  scores: Record<Person, number>;
  ranking: { name: Person; points: number }[];
  total: number;
  next: number;
  previous: number;
  drinks: DrinkStop[];
};

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export function emptyScores(): Record<Person, number> {
  return { ninja: 0, louise: 0, joker: 0, batman: 0 };
}

export function isPerson(value: string): value is Person {
  return (ROSTER as readonly string[]).includes(value);
}

export function isEmojiGrapheme(grapheme: string): boolean {
  if (/^\p{Regional_Indicator}{2}$/u.test(grapheme.replace(/\uFE0F/g, ""))) {
    return true;
  }
  if (/^[#*0-9]\uFE0F?\u20E3$/u.test(grapheme)) return true;
  if (!/\p{Extended_Pictographic}/u.test(grapheme)) return false;
  if (/\p{Letter}/u.test(grapheme)) return false;
  return true;
}

/** Three emoji graphemes, and nothing else besides spaces. `null` means the text is not emoji-only. */
export function emojiGraphemes(input: string): string[] | null {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const emojis: string[] = [];
  for (const { segment } of segmenter.segment(trimmed)) {
    if (/^\s+$/u.test(segment)) continue;
    if (!isEmojiGrapheme(segment)) return null;
    emojis.push(segment);
  }
  return emojis;
}

export function isEmojiTrio(input: string): boolean {
  const emojis = emojiGraphemes(input);
  return emojis !== null && emojis.length === 3;
}

/** People and emojis for an edit. Order of the names is kept. `null` if it would not count. */
export function editedMeetup(
  attendees: readonly string[],
  emojis: string,
): { attendees: Person[]; emojis: string[] } | null {
  const people = attendees.filter(isPerson);
  const unique = people.filter((name, index) => people.indexOf(name) === index);
  const cells = emojiGraphemes(emojis);
  if (unique.length < 2 || cells === null || cells.length !== 3) return null;
  return { attendees: unique, emojis: cells };
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Meetups count from this day onward. Earlier dates are not logged or shown. */
export const EARLIEST_MEETUP = "2026-05-01";

export function isMeetupDate(value: string): boolean {
  return isValidDate(value) && value >= EARLIEST_MEETUP;
}

export function todayISO(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sanitizeMeetup(
  input: MeetupInput,
  source: "shared" | "local",
): Meetup | null {
  if (!input.id || !isMeetupDate(input.date) || !isEmojiTrio(input.emojis)) {
    return null;
  }
  const attendees = ROSTER.filter((name) => input.attendees.includes(name));
  if (attendees.length < 2) return null;
  return {
    id: input.id,
    date: input.date,
    attendees,
    emojis: input.emojis.trim(),
    emojisArePlaceholder: input.emojisArePlaceholder === true,
    sequence: input.sequence,
    source,
  };
}

export const GOA_POINTS = 300;

export function milestoneKind(milestone: number): MilestoneKind {
  if (milestone === 50 || milestone === 100) return "batman";
  if (milestone === GOA_POINTS) return "goa";
  return "draw";
}

function drawFromSeed(milestone: number, seed: string): Person {
  let hash = 0;
  const text = `${seed}:${milestone}`;
  for (let index = 0; index < text.length; index += 1) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  }
  return ROSTER[Math.abs(hash) % ROSTER.length] ?? "batman";
}

/** Saved draw from the shared file. The seed only fills a milestone that is not listed yet. */
export function surpriseOwner(
  milestone: number,
  surprises: Readonly<Record<string, string>>,
  seed: string,
): Person | null {
  const kind = milestoneKind(milestone);
  if (kind === "goa") return null;
  if (kind === "batman") return "batman";
  const saved = surprises[String(milestone)];
  if (saved && isPerson(saved)) return saved;
  return drawFromSeed(milestone, seed);
}

export function milestoneLine(milestone: number, owner: Person | null): string {
  if (milestoneKind(milestone) === "goa") return `${milestone} · Goa, for everyone`;
  return `${milestone} · ${owner} has a surprise`;
}

export function nextMilestone(total: number): number {
  return (Math.floor(total / 50) + 1) * 50;
}

export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function sumScores(scores: Record<Person, number>): number {
  return ROSTER.reduce((total, name) => total + scores[name], 0);
}

/** The person who bought the last three milestones, if that was the same person. */
export function cappedPerson(history: readonly Buyer[]): Person | null {
  if (history.length < 3) return null;
  const last = history.slice(-3);
  const first = last[0];
  if (!first || first.kind !== "person") return null;
  const stuck = last.every((item) => item.kind === "person" && item.name === first.name);
  return stuck ? first.name : null;
}

/**
 * Fewest points buys. A person who already bought the last three milestones is
 * skipped once, which resets that streak. A tie at the spot being filled is
 * left for the group.
 */
export function chooseBuyer(
  scores: Record<Person, number>,
  history: readonly Buyer[],
): { buyer: Buyer; skipped: Person | null } {
  const capped = cappedPerson(history);
  const levels = [...new Set(ROSTER.map((name) => scores[name]))].sort((a, b) => a - b);
  let skipped: Person | null = null;

  for (const level of levels) {
    const people = ROSTER.filter((name) => scores[name] === level);
    if (capped && people.length === 1 && people[0] === capped) {
      skipped = capped;
      continue;
    }
    if (people.length === 1) {
      const name = people[0];
      if (!name) break;
      return { buyer: { kind: "person", name }, skipped };
    }
    return { buyer: { kind: "group", names: people }, skipped };
  }

  return { buyer: { kind: "group", names: [...ROSTER] }, skipped };
}

export function drinkLine(stop: DrinkStop): string {
  const skip = stop.skipped ? ` ${stop.skipped} skipped after three.` : "";
  if (stop.buyer.kind === "person") {
    return `${stop.milestone} · ${stop.buyer.name} buys the round.${skip}`;
  }
  return `${stop.milestone} · tie, the group picks.${skip}`;
}

export function mergeMeetups(shared: readonly Meetup[], extras: LocalExtras): Meetup[] {
  const local = extras.meetups.flatMap((input) => {
    const meetup = sanitizeMeetup(input, "local");
    if (!meetup || shared.some((item) => item.id === meetup.id)) return [];
    return [meetup];
  });
  const edited = shared.map((meetup) => {
    const emojis = extras.emojiEdits[meetup.id];
    if (!emojis || !isEmojiTrio(emojis)) return meetup;
    return { ...meetup, emojis: emojis.trim(), emojisArePlaceholder: false };
  });
  return [...edited, ...local];
}

export function buildBoard(meetups: readonly Meetup[]): Board {
  const ordered = [...meetups].sort(
    (a, b) => a.date.localeCompare(b.date) || a.sequence - b.sequence || a.id.localeCompare(b.id),
  );
  const scores = emptyScores();
  const drinks: DrinkStop[] = [];
  let nextDrink = 50;

  for (const meetup of ordered) {
    for (const name of meetup.attendees) scores[name] += 1;
    const total = sumScores(scores);
    const tally = { ...scores };

    while (total >= nextDrink) {
      const choice = chooseBuyer(tally, drinks.map((stop) => stop.buyer));
      drinks.push({ milestone: nextDrink, buyer: choice.buyer, skipped: choice.skipped });
      nextDrink += 50;
    }
  }

  const total = sumScores(scores);
  const next = nextMilestone(total);
  const ranking = ROSTER.map((name) => ({ name, points: scores[name] })).sort(
    (a, b) => b.points - a.points || ROSTER.indexOf(a.name) - ROSTER.indexOf(b.name),
  );
  const visible = [...meetups].sort(
    (a, b) => b.date.localeCompare(a.date) || b.sequence - a.sequence || b.id.localeCompare(a.id),
  );

  return {
    meetups: visible,
    scores,
    ranking,
    total,
    next,
    previous: next - 50,
    drinks,
  };
}

export function dayNote(meetup: Meetup, meetups: readonly Meetup[]): string | null {
  const sameDay = meetups
    .filter((item) => item.date === meetup.date)
    .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
  if (sameDay.length < 2) return null;
  const index = sameDay.findIndex((item) => item.id === meetup.id);
  if (index === 0) return "First that day";
  if (index === 1) return "Second that day";
  return `Meetup ${index + 1} that day`;
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function displayEmojis(input: string): string {
  const emojis = emojiGraphemes(input);
  if (!emojis || emojis.length === 0) return input;
  return emojis.join(" ");
}
