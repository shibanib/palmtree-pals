import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildBoard,
  dayNote,
  chooseBuyer,
  drinkLine,
  milestoneLine,
  surpriseOwner,
  emojiChart,
  emojiGraphemes,
  emptyScores,
  isEmojiTrio,
  mergeMeetups,
  EARLIEST_MEETUP,
  isMeetupDate,
  editedMeetup,
  sanitizeMeetup,
  type Buyer,
  type Meetup,
  type MeetupInput,
  type Person,
} from "../src/lib/board.ts";

const file = JSON.parse(
  readFileSync(new URL("../src/data/meetups.json", import.meta.url), "utf8"),
) as { meetups: MeetupInput[]; surprises: Record<string, string>; surpriseSeed: string };

function asShared(inputs: MeetupInput[]): Meetup[] {
  return inputs.flatMap((input) => {
    const meetup = sanitizeMeetup(input, "shared");
    return meetup ? [meetup] : [];
  });
}

function made(
  sequence: number,
  attendees: Person[],
  id = `m-${sequence}`,
): Meetup {
  return {
    id,
    date: "2026-01-01",
    attendees,
    emojis: "❓❓❓",
    emojisArePlaceholder: false,
    sequence,
    source: "shared",
  };
}

test("seed history scores louise 3, ninja 3, batman 2, joker 0", () => {
  const board = buildBoard(asShared(file.meetups));
  assert.equal(board.meetups.length, 3);
  assert.deepEqual(board.scores, { ninja: 3, louise: 3, joker: 0, batman: 2 });
  assert.equal(board.total, 8);
  assert.equal(board.next, 50);
  assert.equal(board.drinks.length, 0);
  assert.equal(board.meetups[0]?.id, "2026-10-03-louise-ninja-batman-2");
  assert.equal(board.meetups[1]?.id, "2026-10-03-louise-ninja-batman-1");
  assert.equal(board.meetups[2]?.id, "2026-10-02-louise-ninja");
  assert.ok(board.meetups.every((meetup) => meetup.emojisArePlaceholder));
  assert.deepEqual(
    board.ranking.map((row) => row.name),
    ["ninja", "louise", "batman", "joker"],
  );
});

test("emoji graphemes accept exactly three and reject the rest", () => {
  assert.equal(isEmojiTrio("❓❓❓"), true);
  assert.equal(isEmojiTrio("🌴 ☀️ 🌊"), true);
  assert.equal(isEmojiTrio("👨‍👩‍👧‍👦👍🏽🇮🇳"), true);
  assert.equal(isEmojiTrio("1️⃣2️⃣3️⃣"), true);
  assert.equal(isEmojiTrio("🌴🌴"), false);
  assert.equal(isEmojiTrio("🌴🌴🌴🌴"), false);
  assert.equal(isEmojiTrio("abc"), false);
  assert.equal(isEmojiTrio("hi 🌴☀️🌊"), false);
  assert.equal(emojiGraphemes("🌴a🌊"), null);
});

test("meetup dates start in May 2026", () => {
  assert.equal(EARLIEST_MEETUP, "2026-05-01");
  assert.equal(isMeetupDate("2026-05-01"), true);
  assert.equal(isMeetupDate("2026-04-30"), false);
  assert.equal(isMeetupDate("2026-10-02"), true);
  assert.equal(
    sanitizeMeetup(
      {
        id: "early",
        date: "2026-04-30",
        attendees: ["ninja", "louise"],
        emojis: "🌴☀️🌊",
        sequence: 1,
      },
      "local",
    ),
    null,
  );
});

test("an edit can change who was there and keeps their order", () => {
  const same = editedMeetup(["louise", "ninja"], "🧺 🍹 😴");
  assert.deepEqual(same, { attendees: ["louise", "ninja"], emojis: ["🧺", "🍹", "😴"] });
  const added = editedMeetup(["louise", "ninja", "batman"], "🧺🍹😴");
  assert.deepEqual(added?.attendees, ["louise", "ninja", "batman"]);
  assert.equal(editedMeetup(["batman"], "🌴☀️🌊"), null);
  assert.equal(editedMeetup(["ninja", "louise"], "🌴🌴"), null);
});

test("several meetups on one day are round 1, round 2, and so on", () => {
  const early = made(1, ["louise", "ninja"], "early");
  const later = made(2, ["louise", "ninja", "batman"], "later");
  const last = made(3, ["ninja", "batman"], "last");
  const day = [later, early, last].map((meetup) => ({ ...meetup, date: "2026-10-03" }));
  const alone = made(4, ["louise", "joker"], "alone");
  assert.equal(dayNote(day[1]!, day), "Round 1");
  assert.equal(dayNote(day[0]!, day), "Round 2");
  assert.equal(dayNote(day[2]!, day), "Round 3");
  assert.equal(dayNote(alone, [alone]), null);
});

test("the emoji chart ranks what we use, most loved first", () => {
  const loved = made(1, ["ninja", "louise"], "loved");
  const again = made(2, ["ninja", "batman"], "again");
  const placeholder = made(3, ["louise", "joker"], "placeholders");
  const chart = emojiChart([
    { ...loved, emojis: "🌴☀️🌊", emojisArePlaceholder: false },
    { ...again, emojis: "🌴🌴😴", emojisArePlaceholder: false },
    { ...placeholder, emojis: "❓❓❓", emojisArePlaceholder: true },
  ]);
  assert.deepEqual(
    chart.map((row) => row.emoji),
    ["🌴", "☀️", "🌊", "😴"],
  );
  assert.equal(chart[0]?.count, 3);
  assert.ok(chart.slice(1).every((row) => row.count === 1));
  assert.equal(emojiChart([]).length, 0);
});

test("fewer than two attendees does not count", () => {
  assert.equal(
    sanitizeMeetup(
      {
        id: "solo",
        date: "2026-10-04",
        attendees: ["batman"],
        emojis: "🌴☀️🌊",
        sequence: 1,
      },
      "local",
    ),
    null,
  );
});

test("a three-in-a-row drink streak resets after a skip", () => {
  const meetups: Meetup[] = [];
  let sequence = 1;
  const push = (count: number, attendees: Person[]) => {
    for (let index = 0; index < count; index += 1) {
      meetups.push(made(sequence, attendees));
      sequence += 1;
    }
  };

  push(16, ["ninja", "louise", "joker"]);
  push(1, ["batman", "ninja"]);
  push(16, ["ninja", "louise", "joker"]);
  push(1, ["ninja", "louise"]);
  push(16, ["ninja", "louise", "joker"]);
  push(1, ["ninja", "louise"]);
  push(25, ["ninja", "louise"]);
  push(25, ["ninja", "louise"]);

  const board = buildBoard(meetups);
  assert.equal(board.total, 250);
  assert.deepEqual(
    board.drinks.map((stop) => stop.milestone),
    [50, 100, 150, 200, 250],
  );
  assert.equal(board.drinks[0]?.buyer.kind, "person");
  assert.equal(board.drinks[1]?.buyer.kind, "person");
  assert.equal(board.drinks[2]?.buyer.kind, "person");
  assert.equal(board.drinks[3]?.skipped, "batman");
  assert.equal(board.drinks[4]?.buyer.kind, "person");
  if (board.drinks[0]?.buyer.kind === "person") assert.equal(board.drinks[0].buyer.name, "batman");
  if (board.drinks[1]?.buyer.kind === "person") assert.equal(board.drinks[1].buyer.name, "batman");
  if (board.drinks[2]?.buyer.kind === "person") assert.equal(board.drinks[2].buyer.name, "batman");
  if (board.drinks[3]?.buyer.kind === "person") assert.equal(board.drinks[3].buyer.name, "joker");
  if (board.drinks[4]?.buyer.kind === "person") assert.equal(board.drinks[4].buyer.name, "batman");
  assert.match(drinkLine(board.drinks[3]!), /joker buys the round/);
  assert.match(drinkLine(board.drinks[3]!), /batman skipped after 3/);
});

test("a tie for fewest asks the group to pick", () => {
  const scores = emptyScores();
  scores.ninja = 4;
  scores.louise = 4;
  scores.joker = 1;
  scores.batman = 1;
  const choice = chooseBuyer(scores, []);
  assert.equal(choice.buyer.kind, "group");
  if (choice.buyer.kind === "group") {
    assert.deepEqual(choice.buyer.names, ["joker", "batman"]);
  }
});

test("later surprises are saved in the shared file and do not re-roll", () => {
  assert.equal(surpriseOwner(50, file.surprises, file.surpriseSeed), "batman");
  assert.equal(surpriseOwner(100, file.surprises, file.surpriseSeed), "batman");
  assert.equal(surpriseOwner(300, file.surprises, file.surpriseSeed), null);
  assert.equal(milestoneLine(50, "batman"), "50 · batman has a surprise");
  assert.equal(milestoneLine(300, null), "300 · Goa, for everyone");
  const at200 = surpriseOwner(200, file.surprises, file.surpriseSeed);
  assert.equal(at200, surpriseOwner(200, file.surprises, file.surpriseSeed));
  assert.ok(at200 === "ninja" || at200 === "louise" || at200 === "joker" || at200 === "batman");
  for (const milestone of [150, 350]) {
    const first = surpriseOwner(milestone, file.surprises, file.surpriseSeed);
    const second = surpriseOwner(milestone, file.surprises, file.surpriseSeed);
    assert.equal(first, second);
    assert.equal(first, file.surprises[String(milestone)]);
    assert.ok(first === "ninja" || first === "louise" || first === "joker" || first === "batman");
    assert.match(milestoneLine(milestone, first), new RegExp(`^${milestone} · ${first} has a surprise$`));
  }
  const beyond = surpriseOwner(1050, file.surprises, file.surpriseSeed);
  assert.equal(beyond, surpriseOwner(1050, file.surprises, file.surpriseSeed));
});

test("local meetups merge without duplicating a shared id", () => {
  const shared = asShared(file.meetups);
  const merged = mergeMeetups(shared, {
    meetups: [
      {
        id: "local-day",
        date: "2026-10-04",
        attendees: ["ninja", "batman"],
        emojis: "🌴☀️🌊",
        sequence: 9,
      },
      {
        id: shared[0]!.id,
        date: "2026-10-02",
        attendees: ["ninja", "louise"],
        emojis: "🌴☀️🌊",
        sequence: 1,
      },
    ],
    emojiEdits: { [shared[0]!.id]: "🌊🌙✨" },
  });
  assert.equal(merged.length, 4);
  assert.equal(merged.find((meetup) => meetup.id === shared[0]!.id)?.emojis, "🌊🌙✨");
  assert.equal(merged.find((meetup) => meetup.id === shared[0]!.id)?.emojisArePlaceholder, false);
  const board = buildBoard(merged);
  assert.equal(board.total, 10);
  assert.equal(board.scores.batman, 3);
  assert.equal(board.drinks.length, 0);
});

test("buyer history type stays a person across the cap", () => {
  const history: Buyer[] = [
    { kind: "person", name: "batman" },
    { kind: "person", name: "batman" },
    { kind: "person", name: "batman" },
  ];
  const scores = emptyScores();
  scores.ninja = 10;
  scores.louise = 9;
  scores.joker = 4;
  scores.batman = 1;
  const choice = chooseBuyer(scores, history);
  assert.equal(choice.skipped, "batman");
  assert.deepEqual(choice.buyer, { kind: "person", name: "joker" });
});
