import {
  isEmojiTrio,
  isValidDate,
  type LocalExtras,
  type MeetupInput,
} from "@/lib/board";

const STORAGE_KEY = "palmtree-pals.meetups";

export function emptyVault(): LocalExtras {
  return { meetups: [], emojiEdits: {} };
}

function isMeetupInput(value: unknown): value is MeetupInput {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.date === "string" &&
    isValidDate(record.date) &&
    Array.isArray(record.attendees) &&
    record.attendees.every((name) => typeof name === "string") &&
    typeof record.emojis === "string" &&
    typeof record.sequence === "number"
  );
}

export function readVault(): { vault: LocalExtras; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { vault: emptyVault(), error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {
        vault: emptyVault(),
        error: "This browser's saved meetups could not be read. The shared board is still here.",
      };
    }
    const record = parsed as { meetups?: unknown; emojiEdits?: unknown };
    const meetups = Array.isArray(record.meetups) ? record.meetups.filter(isMeetupInput) : [];
    const emojiEdits: Record<string, string> = {};
    if (record.emojiEdits && typeof record.emojiEdits === "object") {
      for (const [key, value] of Object.entries(record.emojiEdits)) {
        if (typeof value === "string" && isEmojiTrio(value)) emojiEdits[key] = value;
      }
    }
    return { vault: { meetups, emojiEdits }, error: null };
  } catch {
    return {
      vault: emptyVault(),
      error: "This browser's saved meetups could not be read. The shared board is still here.",
    };
  }
}

export function writeVault(vault: LocalExtras): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    return null;
  } catch {
    return "This browser couldn't save that. The shared board is still here.";
  }
}
