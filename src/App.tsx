import { useEffect, useMemo, useState, type FormEvent } from "react";
import sharedFile from "@/data/meetups.json";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildBoard,
  dayNote,
  displayEmojis,
  drinkLine,
  emojiGraphemes,
  formatDate,
  isEmojiTrio,
  isValidDate,
  joinNames,
  mergeMeetups,
  milestoneLine,
  sanitizeMeetup,
  surpriseOwner,
  todayISO,
  type LocalExtras,
  type Meetup,
  type MeetupInput,
  type Person,
  ROSTER,
} from "@/lib/board";
import { playClick } from "@/lib/click";
import { burstConfetti } from "@/lib/confetti";
import { readVault, writeVault } from "@/lib/storage";

const sharedMeetups = sharedFile.meetups.flatMap((input) => {
  const meetup = sanitizeMeetup(input, "shared");
  return meetup ? [meetup] : [];
});

const drinkRule =
  "Fewest points buys the round — three in a row, then the next lowest.";

export default function App() {
  const stored = useState(() => readVault())[0];
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button")) playClick();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  const [vault, setVault] = useState<LocalExtras>(stored.vault);
  const [storageError, setStorageError] = useState<string | null>(stored.error);
  const board = useMemo(() => buildBoard(mergeMeetups(sharedMeetups, vault)), [vault]);
  const hasLocal =
    vault.meetups.length > 0 || Object.keys(vault.emojiEdits).length > 0;
  const span = board.next - board.previous;
  const filled = span === 0 ? 0 : ((board.total - board.previous) / span) * 100;
  const nextLine = milestoneLine(
    board.next,
    surpriseOwner(board.next, sharedFile.surprises, sharedFile.surpriseSeed),
  );

  function persist(next: LocalExtras) {
    const error = writeVault(next);
    if (error) {
      setStorageError(error);
      return;
    }
    setStorageError(null);
    setVault(next);
  }

  function addMeetup(input: MeetupInput) {
    persist({ ...vault, meetups: [...vault.meetups, input] });
  }

  function saveEmojis(id: string, emojis: string) {
    const localIndex = vault.meetups.findIndex((meetup) => meetup.id === id);
    if (localIndex >= 0) {
      const meetups = vault.meetups.map((meetup, index) =>
        index === localIndex ? { ...meetup, emojis, emojisArePlaceholder: false } : meetup,
      );
      persist({ ...vault, meetups });
      return;
    }
    persist({ ...vault, emojiEdits: { ...vault.emojiEdits, [id]: emojis } });
  }

  const drinkStatus =
    board.drinks.length === 0 ? `${drinkRule} No buyer yet.` : drinkRule;

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />
      <div className="palms" aria-hidden="true">
        <Palms />
      </div>
      <main className="shell">
        <p className="menubar">
          <span>PalmTree Pals</span>
          <span>summer ledger</span>
        </p>
        <header className="mast">
          <PalmMark />
          <h1>PalmTree Pals</h1>
        </header>

        <section className="panel milestone" data-window="Next" aria-labelledby="next-milestone">
          <div className="milestone-top">
            <h2 id="next-milestone">{nextLine}</h2>
            <p className="total" data-testid="group-total">
              <strong>{board.total}</strong>
              <span>group points</span>
            </p>
          </div>

          <div
            className="track"
            role="progressbar"
            aria-valuemin={board.previous}
            aria-valuemax={board.next}
            aria-valuenow={board.total}
            aria-label={`Progress to ${board.next} group points`}
          >
            <div className="fill" style={{ width: `${Math.min(100, Math.max(0, filled))}%` }} />
          </div>
          <p className="progress-copy" data-testid="milestone-progress">
            {board.total} of {board.next}
            <span>{board.next - board.total} to go</span>
          </p>
          <div data-testid="drink-rule">
            <p data-testid="drink-status">{drinkStatus}</p>
            {board.drinks.length > 0 ? (
              <ul className="drink-list">
                {board.drinks.map((stop) => (
                  <li key={stop.milestone}>{drinkLine(stop)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <div className="split">
          <section className="panel" data-window="Board" aria-labelledby="board-heading">
            <h2 id="board-heading">Board</h2>
            <ol className="ranking" data-testid="leaderboard">
              {board.ranking.map((row, index) => {
                const top = Math.max(...board.ranking.map((item) => item.points), 1);
                const width = row.points === 0 ? 0 : (row.points / top) * 100;
                return (
                  <li key={row.name} className="score-row">
                    <span className="rank">{index + 1}</span>
                    <span className="who">{row.name}</span>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${width}%` }} />
                    </span>
                    <span className="pts" data-testid={`score-${row.name}`}>
                      {row.points} {row.points === 1 ? "point" : "points"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <LogForm onAdd={addMeetup} storageError={storageError} />
        </div>

        <MeetupList meetups={board.meetups} onSaveEmojis={saveEmojis} />

        {hasLocal ? (
          <p className="quiet">On this browser until it's in the shared file.</p>
        ) : null}
      </main>
    </div>
  );
}

function LogForm({
  onAdd,
  storageError,
}: {
  onAdd: (meetup: MeetupInput) => void;
  storageError: string | null;
}) {
  const [date, setDate] = useState(todayISO);
  const [selected, setSelected] = useState<Person[]>([]);
  const [emojis, setEmojis] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = emojiGraphemes(emojis);
  const countLabel =
    parsed === null ? "Use only emojis." : `${parsed.length} of 3`;

  function toggle(name: Person, on: boolean) {
    setSelected((current) => {
      if (on) return ROSTER.filter((person) => current.includes(person) || person === name);
      return current.filter((person) => person !== name);
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const problems: string[] = [];
    if (!isValidDate(date)) problems.push("Choose a date.");
    if (selected.length < 2) problems.push("Pick at least two people.");
    if (!isEmojiTrio(emojis)) problems.push("Use exactly three emojis.");
    if (problems.length > 0) {
      setError(problems.join(" "));
      return;
    }
    onAdd({
      id: crypto.randomUUID(),
      date,
      attendees: selected,
      emojis: emojis.trim(),
      emojisArePlaceholder: false,
      sequence: Date.now(),
    });
    burstConfetti();
    setSelected([]);
    setEmojis("");
    setError(null);
  }

  return (
    <section className="panel" data-window="Log" aria-labelledby="log-heading">
      <h2 id="log-heading">Log a meetup</h2>
      <form className="log-form" onSubmit={submit} noValidate>
        <div className="field">
          <Label htmlFor="meetup-date">Date</Label>
          <Input
            id="meetup-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="field-control"
          />
        </div>
        <fieldset className="people" aria-describedby="people-hint">
          <legend>Who was there</legend>
          <p id="people-hint" className="hint">
            At least two.
          </p>
          <div className="people-grid">
            {ROSTER.map((name) => {
              const on = selected.includes(name);
              return (
                <Label
                  key={name}
                  className="person"
                  data-on={on ? "true" : "false"}
                  onClick={() => toggle(name, !on)}
                >
                  <Checkbox
                    checked={on}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={(value) => toggle(name, value === true)}
                    aria-label={name}
                  />
                  <span>{name}</span>
                </Label>
              );
            })}
          </div>
        </fieldset>
        <div className="field">
          <Label htmlFor="meetup-emojis">Three emojis</Label>
          <Input
            id="meetup-emojis"
            value={emojis}
            onChange={(event) => setEmojis(event.target.value)}
            placeholder="🌴 ☀️ 🌊"
            autoComplete="off"
            aria-describedby="emoji-count"
            aria-invalid={error?.includes("emoji") ? true : undefined}
            className="field-control"
          />
          <p id="emoji-count" className="hint">
            {countLabel}
          </p>
        </div>
        {error ? (
          <p className="form-error" role="alert" data-testid="form-error">
            {error}
          </p>
        ) : null}
        {storageError ? (
          <p className="form-error" role="alert">
            {storageError}
          </p>
        ) : null}
        <Button type="submit" className="submit">
          Log meetup
        </Button>
      </form>
    </section>
  );
}

function MeetupList({
  meetups,
  onSaveEmojis,
}: {
  meetups: Meetup[];
  onSaveEmojis: (id: string, emojis: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function start(meetup: Meetup) {
    setEditingId(meetup.id);
    setDraft(displayEmojis(meetup.emojis));
    setEditError(null);
  }

  function save(event: FormEvent, id: string) {
    event.preventDefault();
    if (!isEmojiTrio(draft)) {
      setEditError("Use exactly three emojis.");
      return;
    }
    onSaveEmojis(id, draft.trim());
    setEditingId(null);
    setEditError(null);
  }

  return (
    <section className="panel" data-window="Meetups" aria-labelledby="recent-heading">
      <h2 id="recent-heading">Meetups</h2>
      {meetups.length === 0 ? (
        <p className="section-note">No meetups yet.</p>
      ) : (
        <ul className="meetups" data-testid="meetup-list">
          {meetups.map((meetup) => {
            const note = dayNote(meetup, meetups);
            const editing = editingId === meetup.id;
            return (
              <li key={meetup.id} data-testid="meetup" data-date={meetup.date}>
                <div className="meetup-main">
                  <p className="when">
                    <time dateTime={meetup.date}>{formatDate(meetup.date)}</time>
                    {note ? <span>{note}</span> : null}
                  </p>
                  <p className="names">{joinNames(meetup.attendees)}</p>
                  {editing ? (
                    <form className="edit-form" onSubmit={(event) => save(event, meetup.id)}>
                      <Label htmlFor={`edit-${meetup.id}`}>Three emojis</Label>
                      <Input
                        id={`edit-${meetup.id}`}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        className="field-control"
                        autoComplete="off"
                        aria-invalid={editError ? true : undefined}
                      />
                      {editError ? (
                        <p className="form-error" role="alert">
                          {editError}
                        </p>
                      ) : null}
                      <div className="edit-actions">
                        <Button type="submit" className="submit">
                          Save emojis
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="submit ghost-button"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p
                        className={meetup.emojisArePlaceholder ? "emoji-placeholder" : "emoji-line"}
                      >
                        {displayEmojis(meetup.emojis)}
                      </p>
                      {meetup.emojisArePlaceholder ? (
                        <p className="placeholder-note">Placeholder. Edit later.</p>
                      ) : null}
                    </>
                  )}
                </div>
                {editing ? null : (
                  <Button
                    type="button"
                    variant="outline"
                    className="edit-button"
                    onClick={() => start(meetup)}
                  >
                    Edit emojis
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Palms() {
  return (
    <svg className="palm-row" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice">
      <path
        fill="#8ec9c6"
        d="M80 220c8-40 10-70 4-110-18 16-40 22-62 16 28-10 42-30 46-52-16 8-34 8-52-2 22 2 36-10 40-28-20 18-46 16-66-4 28 6 40-8 36-30-22 28-54 24-78-6 36 14 48-6 40-36 8 48 18 92 36 132 10 22 22 48 28 80h28zm220 0c6-36 4-72-8-108 22-8 48-6 70 10-20-22-28-46-20-72 18 6 36 4 54-8-24-8-36-28-32-52 20 14 42 12 62-6-28-2-44-20-40-44 26 16 52 10 74-12-34 2-52-16-48-42-8 50-20 96-40 136-12 24-28 52-36 80h-36zm260 0c10-48 8-90-4-130 24-4 50 4 70 22-16-28-14-54 4-80 16 10 36 8 52-4-22-16-28-40-16-66 22 10 44 4 62-14-30 0-48-18-46-44 24 18 50 14 72-8-8 54-22 100-46 140-14 22-30 50-40 84h-108zm280 0c4-32 2-70-10-104 20-10 46-8 66 8-18-24-22-50-10-76 18 8 38 6 54-6-22-12-30-36-20-62 22 12 46 8 64-10-28 0-46-16-42-40-6 46-18 90-38 128-14 26-30 54-40 82h-24zm250 0c8-44 6-84-6-122 22-6 48 0 68 16-18-26-16-52 2-78 18 8 36 6 52-6-20-14-26-38-14-64 20 12 44 8 62-12-26 2-44-14-40-38-10 52-24 98-48 138-12 20-26 46-34 72h-42z"
      />
    </svg>
  );
}

function PalmMark() {
  return (
    <svg className="palm" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="34" fill="rgba(255,252,247,0.55)" stroke="url(#rim)" />
      <path
        d="M36 54 V34"
        fill="none"
        stroke="#1f6f68"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M36 36c-8-10-18-8-20-3 7 1 14 3 20 3Z" fill="#7ebfb6" />
      <path d="M36 34c8-11 19-8 20-2-8 0-14 2-20 2Z" fill="#e7b2a8" />
      <path d="M36 32c-2-12-1-18 2-20 2 6 2 14-2 20Z" fill="#2f8f84" />
      <defs>
        <linearGradient id="rim" x1="8" y1="6" x2="64" y2="66">
          <stop stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#c5ced6" />
          <stop offset="1" stopColor="#f3e6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
