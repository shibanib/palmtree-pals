# PalmTree Pals

A meetup ledger for ninja, louise, joker, and batman. Log who showed up, keep a point each, and watch the group climb toward the next milestone.

The shared board is [`src/data/meetups.json`](src/data/meetups.json). Everyone who opens the site sees that file. A meetup added in the form is also saved in this browser and merged with the file, so a refresh keeps it here until it is in the shared file. There are no accounts.

## Run locally

```sh
npm install
npm run dev
```

Open [http://127.0.0.1:47331](http://127.0.0.1:47331).

The public site is [https://shibanib.github.io/palmtree-pals/](https://shibanib.github.io/palmtree-pals/).

`npm run build` writes a static site to `dist`. `npm test` checks scoring, emoji counts, and the milestone rules.

## Scoring

One point per person per meetup. At least two people have to be there. The group total is the sum of everyone's points. Milestones land every 50 points.

50 and 100 are surprises batman owns. The page names batman and does not say what the surprise is. 200 is a trip to Goa for everyone. Later surprises are a one-time draw among the four, saved in the shared file.

At each milestone, the fewest points buys a round of drinks. The same person cannot buy more than three milestones in a row. After that, the next-lowest person buys and the skipped streak resets. Before the first milestone, the page shows the rule and does not name a buyer.
