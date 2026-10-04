import assert from "node:assert/strict";
import test from "node:test";

import { isMissingTable, rowsToMeetups, type MeetupRow } from "../src/lib/rows.ts";

const rows: MeetupRow[] = [
  {
    id: "f8759d6f-7818-4b94-b127-20e14a89dd39",
    day: "2026-10-03",
    attendees: ["louise", "ninja", "batman"],
    emojis: ["🍟", "🍩", "🍦"],
    created_at: "2026-10-04T09:11:19.052582+00:00",
  },
  {
    id: "23b5a76b-98f3-4b8e-973e-41cab7650b82",
    day: "2026-10-02",
    attendees: ["louise", "ninja"],
    emojis: ["🧺", "🍹", "😴"],
    created_at: "2026-10-04T09:11:19.052582+00:00",
  },
  {
    id: "3e3b6a20-a022-400f-b44e-8f5fb6a74eb2",
    day: "2026-10-03",
    attendees: ["louise", "ninja", "batman"],
    emojis: ["🥤", "🛏️", "🏝️"],
    created_at: "2026-10-04T09:11:19.052582+00:00",
  },
];

test("supabase rows become the board without adding meetups", () => {
  const meetups = rowsToMeetups(rows);
  assert.equal(meetups.length, 3);
  assert.deepEqual(
    meetups.map((meetup) => meetup.date),
    ["2026-10-02", "2026-10-03", "2026-10-03"],
  );
  assert.equal(meetups[1]?.id, "3e3b6a20-a022-400f-b44e-8f5fb6a74eb2");
  assert.equal(meetups[2]?.id, "f8759d6f-7818-4b94-b127-20e14a89dd39");
  assert.equal(meetups[0]?.emojis, "🧺🍹😴");
  assert.equal(meetups[1]?.emojis, "🥤🛏️🏝️");
  assert.equal(meetups[2]?.emojis, "🍟🍩🍦");
  assert.equal(meetups[0]?.emojisArePlaceholder, false);
  assert.equal(meetups[0]?.remoteId, "23b5a76b-98f3-4b8e-973e-41cab7650b82");
});

test("rows before May 2026 are left off the board", () => {
  const meetups = rowsToMeetups([
    ...rows,
    {
      id: "early-day",
      day: "2026-04-30",
      attendees: ["louise", "ninja"],
      emojis: ["🌴", "☀️", "🌊"],
      created_at: "2026-04-30T12:00:00.000Z",
    },
  ]);
  assert.equal(meetups.length, 3);
  assert.ok(meetups.every((meetup) => meetup.date >= "2026-05-01"));
});

test("a missing table is recognized and not treated as an empty log", () => {
  assert.equal(isMissingTable({ code: "PGRST205" }), true);
  assert.equal(isMissingTable({ code: "42501" }), false);
  assert.equal(rowsToMeetups([]).length, 0);
});
