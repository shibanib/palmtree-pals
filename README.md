# PalmTree Pals

A meetup ledger for ninja, louise, joker, and batman. Log who showed up, keep a point each, and watch the group climb toward the next milestone.

The shared log is the Supabase table `public.meetups`, with `day`, `attendees`, and `emojis`. The page reads those rows on load, inserts a row when a meetup is logged, and updates that row when the people or emojis are edited. It does not copy the October rows in again. Nothing is saved in this browser. There are no accounts.

## Run locally

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:47331](http://127.0.0.1:47331).

The public site is [https://shibanib.github.io/palmtree-pals/](https://shibanib.github.io/palmtree-pals/).

`npm run build` writes a static site to `dist`. `npm test` checks scoring, emoji counts, and the milestone rules.

## Settings

The knobs are in `src/data/settings.ts`. Change a value, save, and refresh.

- `buyMessageSeconds` is how long the Buy more points line stays up.
- `emojiCount` is how many emojis a meetup needs.
- `minimumAttendees` is how many people have to be there.
- `earliestMeetup` is the first day you can log, written as `YYYY-MM-DD`.
- `milestoneEvery` is how many group points between milestones.
- `fixedSurprises` is who owns 50 and 100. The page names them and does not say what the surprise is.
- `goaPoints` is when the Goa trip unlocks.
- `drinkStreakCap` is how many milestones in a row the same person can buy.
- `roster` is the four names, in order.
- `buyLines` are the refusals on Buy more points.
- `goOutChance`, `stayInChance`, `coinOut`, `coinStay`, and `coinBatman` are the coin.

Later surprise names, such as 150 and 200, are in `src/data/meetups.json` under `surprises`. Those draws are already saved. Change a name there if you want someone else. Leave `surpriseSeed` as it is.

## Scoring

One point per person per meetup. At least two people have to be there. A meetup date cannot be earlier than May 2026. The group total is the sum of everyone's points. Milestones land every 50 points.

50 and 100 are surprises batman owns. The page names batman and does not say what the surprise is. 300 is a trip to Goa for everyone, shown at the end of the page. Later surprises are a one-time draw among the four, saved in the shared file.

At each milestone, the fewest points buys a round of drinks. The same person cannot buy more than three milestones in a row. After that, the next-lowest person buys and the skipped streak resets. Before the first milestone, the page shows the rule and does not name a buyer.
