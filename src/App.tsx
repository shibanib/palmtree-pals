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
  GOA_POINTS,
  joinNames,
  milestoneLine,
  surpriseOwner,
  todayISO,
  type Meetup,
  type MeetupInput,
  type Person,
  ROSTER,
} from "@/lib/board";
import { playSound, soundForButton } from "@/lib/click";
import { burstConfetti } from "@/lib/confetti";
import {
  insertMeetup,
  loadShared,
  updateMeetupEmojis,
  type RemoteMeetup,
} from "@/lib/remote";

const sharedUnavailable = "The shared log couldn't be read.";

const drinkRule =
  "Fewest points buys the round — three in a row, then the next lowest.";

export default function App() {
  const [meetups, setMeetups] = useState<RemoteMeetup[]>([]);
  const [writable, setWritable] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest(".person")) return;
      const button = target.closest("button");
      if (button) {
        playSound(soundForButton(button.textContent ?? ""));
        return;
      }
      if (target.closest('input[type="date"]')) playSound("date");
      else if (target.closest("input, textarea")) playSound("key");
    };
    const onInput = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type !== "date") playSound("key");
    };
    const onChange = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.type === "date") playSound("dateSet");
    };
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("input", onInput);
      document.removeEventListener("change", onChange);
    };
  }, []);
  useEffect(() => {
    let live = true;
    loadShared().then((result) => {
      if (!live) return;
      setMeetups(result.meetups);
      setWritable(result.source === "remote");
      setStorageError(result.message);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  const board = useMemo(() => buildBoard(meetups), [meetups]);
  const span = board.next - board.previous;
  const filled = span === 0 ? 0 : ((board.total - board.previous) / span) * 100;
  const nextLine = milestoneLine(
    board.next,
    surpriseOwner(board.next, sharedFile.surprises, sharedFile.surpriseSeed),
  );

  async function addMeetup(input: MeetupInput): Promise<boolean> {
    if (!writable) {
      setStorageError(sharedUnavailable);
      return false;
    }
    const result = await insertMeetup(input);
    if (!result.ok) {
      setStorageError(result.message);
      return false;
    }
    setStorageError(null);
    setMeetups((current) => [...current, result.meetup]);
    return true;
  }

  async function saveEmojis(id: string, emojis: string): Promise<boolean> {
    const meetup = meetups.find((item) => item.id === id);
    if (!writable || !meetup) {
      setStorageError(sharedUnavailable);
      return false;
    }
    const result = await updateMeetupEmojis(meetup, emojis);
    if (!result.ok) {
      setStorageError(result.message);
      return false;
    }
    setStorageError(null);
    setMeetups((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, emojis: emojis.trim(), emojisArePlaceholder: false, emojiCells: result.cells }
          : item,
      ),
    );
    return true;
  }

  const drinkStatus =
    board.drinks.length === 0 ? `${drinkRule} No buyer yet.` : drinkRule;

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />
      <main className="shell">
        <p className="menubar">
          <span>PalmTree Pals</span>
          <span>summer ledger</span>
        </p>
        <header className="mast">
          <p className="palm-emoji" aria-hidden="true">
            🌴
          </p>
          <h1>What's the plan?</h1>
        </header>

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

        <MeetupList meetups={board.meetups} ready={ready} onSaveEmojis={saveEmojis} />

        <GoaUnlock total={board.total} />
      </main>
    </div>
  );
}

function LogForm({
  onAdd,
  storageError,
}: {
  onAdd: (meetup: MeetupInput) => Promise<boolean>;
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
    playSound(on ? "tick" : "tock");
    setSelected((current) => {
      if (on) return ROSTER.filter((person) => current.includes(person) || person === name);
      return current.filter((person) => person !== name);
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    playSound("log");
    const problems: string[] = [];
    if (!isValidDate(date)) problems.push("Choose a date.");
    if (selected.length < 2) problems.push("Pick at least two people.");
    if (!isEmojiTrio(emojis)) problems.push("Use exactly three emojis.");
    if (problems.length > 0) {
      playSound("error");
      setError(problems.join(" "));
      return;
    }
    const saved = await onAdd({
      id: crypto.randomUUID(),
      date,
      attendees: selected,
      emojis: emojis.trim(),
      emojisArePlaceholder: false,
      sequence: Date.now(),
    });
    if (!saved) {
      playSound("error");
      return;
    }
    playSound("logged");
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
  ready,
  onSaveEmojis,
}: {
  meetups: Meetup[];
  ready: boolean;
  onSaveEmojis: (id: string, emojis: string) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function start(meetup: Meetup) {
    setEditingId(meetup.id);
    setDraft(displayEmojis(meetup.emojis));
    setEditError(null);
  }

  async function save(event: FormEvent, id: string) {
    event.preventDefault();
    playSound("save");
    if (!isEmojiTrio(draft)) {
      playSound("error");
      setEditError("Use exactly three emojis.");
      return;
    }
    const saved = await onSaveEmojis(id, draft.trim());
    if (!saved) {
      playSound("error");
      return;
    }
    playSound("saved");
    setEditingId(null);
    setEditError(null);
  }

  return (
    <section className="panel" data-window="Meetups" aria-labelledby="recent-heading">
      <h2 id="recent-heading">Meetups</h2>
      {!ready ? (
        <p className="section-note">Loading the shared log.</p>
      ) : meetups.length === 0 ? (
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

function GoaUnlock({ total }: { total: number }) {
  const left = Math.max(0, GOA_POINTS - total);
  const filled = Math.min(100, (total / GOA_POINTS) * 100);
  return (
    <section className="panel" data-window="Goa" aria-labelledby="goa-heading">
      <h2 id="goa-heading">250 · Goa, for everyone</h2>
      <p className="section-note">A trip for the whole group. It unlocks at 250 points.</p>
      <div
        className="track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={GOA_POINTS}
        aria-valuenow={Math.min(total, GOA_POINTS)}
        aria-label="Progress to the Goa trip"
      >
        <div className="fill" style={{ width: `${filled}%` }} />
      </div>
      <p className="progress-copy" data-testid="goa-unlock">
        {total} of {GOA_POINTS}
        <span>{left === 0 ? "Unlocked" : `${left} to go`}</span>
      </p>
    </section>
  );
}


