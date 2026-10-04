import { isMeetupDate, isPerson, type MeetupInput } from "@/lib/board";
import { emojiCells, rowsToMeetups, type MeetupRow, type RemoteMeetup } from "@/lib/rows";
import { supabase } from "@/lib/supabase";

export type { MeetupRow, RemoteMeetup };
export { isMissingTable, rowsToMeetups } from "@/lib/rows";

const READ_MESSAGE = "The shared log couldn't be read.";
const WRITE_MESSAGE = "The shared log couldn't save that.";

export async function loadShared(): Promise<{
  source: "remote" | "error";
  meetups: RemoteMeetup[];
  message: string | null;
}> {
  try {
    const { data, error } = await supabase.from("meetups").select("*");
    if (error || !Array.isArray(data)) {
      return { source: "error", meetups: [], message: READ_MESSAGE };
    }
    return { source: "remote", meetups: rowsToMeetups(data as MeetupRow[]), message: null };
  } catch {
    return { source: "error", meetups: [], message: READ_MESSAGE };
  }
}

export async function insertMeetup(
  input: MeetupInput,
): Promise<{ ok: true; meetup: RemoteMeetup } | { ok: false; message: string }> {
  const cells = emojiCells(input.emojis);
  if (!cells || !isMeetupDate(input.date)) return { ok: false, message: WRITE_MESSAGE };
  const attendees = input.attendees.filter(isPerson);
  try {
    const { data, error } = await supabase
      .from("meetups")
      .insert({ day: input.date, attendees, emojis: cells })
      .select("*");
    if (error || !Array.isArray(data) || data.length === 0) {
      return { ok: false, message: WRITE_MESSAGE };
    }
    const meetup = rowsToMeetups(data as MeetupRow[])[0];
    if (!meetup) return { ok: false, message: WRITE_MESSAGE };
    return { ok: true, meetup: { ...meetup, sequence: input.sequence } };
  } catch {
    return { ok: false, message: WRITE_MESSAGE };
  }
}

export async function updateMeetupEmojis(
  meetup: RemoteMeetup,
  emojis: string,
): Promise<{ ok: true; cells: string[] } | { ok: false; message: string }> {
  const cells = emojiCells(emojis);
  if (!cells || meetup.remoteId == null) return { ok: false, message: WRITE_MESSAGE };
  try {
    const { data, error } = await supabase
      .from("meetups")
      .update({ emojis: cells })
      .eq("id", meetup.remoteId)
      .select("*");
    if (error || !Array.isArray(data) || data.length === 0) {
      return { ok: false, message: WRITE_MESSAGE };
    }
    return { ok: true, cells };
  } catch {
    return { ok: false, message: WRITE_MESSAGE };
  }
}
