import {
  emojiCount,
  emojiGraphemes,
  isPerson,
  sanitizeMeetup,
  type Meetup,
  type MeetupInput,
} from "./board.ts";

export type MeetupRow = {
  id?: string | number;
  day?: string;
  attendees?: unknown;
  emojis?: unknown;
  created_at?: string;
};

export type RemoteMeetup = Meetup & {
  remoteId: string | number | null;
  attendeeCells: string[];
  emojiCells: string[];
};

export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return error?.code === "PGRST205";
}

export function rowsToMeetups(rows: readonly MeetupRow[]): RemoteMeetup[] {
  const indexed = rows.map((row, index) => ({ row, index }));
  indexed.sort((a, b) => {
    const day = String(a.row.day ?? "").localeCompare(String(b.row.day ?? ""));
    if (day !== 0) return day;
    const created = String(a.row.created_at ?? "").localeCompare(String(b.row.created_at ?? ""));
    if (created !== 0) return created;
    return String(a.row.id ?? a.index).localeCompare(String(b.row.id ?? b.index));
  });
  return indexed.flatMap(({ row }, order) => {
    if (typeof row.day !== "string" || !Array.isArray(row.attendees) || !Array.isArray(row.emojis)) {
      return [];
    }
    const attendeeCells = row.attendees.filter((name): name is string => typeof name === "string");
    const emojiCells = row.emojis.filter((cell): cell is string => typeof cell === "string");
    const attendees = attendeeCells.filter(isPerson);
    const input: MeetupInput = {
      id: row.id != null && String(row.id) !== "" ? String(row.id) : `${row.day.slice(0, 10)}:${order}`,
      date: row.day.slice(0, 10),
      attendees,
      emojis: emojiCells.join(""),
      emojisArePlaceholder: emojiCells.length === emojiCount && emojiCells.every((cell) => cell === "❓"),
      sequence: order + 1,
    };
    const meetup = sanitizeMeetup(input, "shared");
    if (!meetup) return [];
    const remoteId = row.id != null && String(row.id) !== "" ? row.id : null;
    return [{ ...meetup, remoteId, attendeeCells, emojiCells }];
  });
}

export function emojiCells(input: string): string[] | null {
  return emojiGraphemes(input);
}
