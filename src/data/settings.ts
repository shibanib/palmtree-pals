/**
 * Edit this file to change the rules. Save it, then refresh the page.
 *
 * Later surprise names (150, 200, 250, and so on) live in src/data/meetups.json.
 * Those draws are already saved. Change a name there if you want a different
 * person. Do not delete the seed. 50 and 100 are fixedSurprises below.
 * goaPoints is the trip, not a person.
 */

export const roster = ["ninja", "louise", "joker", "batman"] as const;

/** First day a meetup can be logged. Use YYYY-MM-DD. */
export const earliestMeetup = "2026-05-01";

/** How many emojis a meetup needs. */
export const emojiCount = 3;

/** How many people have to be there. */
export const minimumAttendees = 2;

/** Group points between milestones. Keep this a positive number. */
export const milestoneEvery = 50;

/** Point totals with a fixed owner. The page names them and does not reveal the surprise. */
export const fixedSurprises: Record<number, (typeof roster)[number]> = {
  50: "batman",
  100: "batman",
};

/** Group points where the Goa trip unlocks. */
export const goaPoints = 300;

/** The same person cannot buy this many milestones in a row. */
export const drinkStreakCap = 3;

/** How long the Buy more points line stays up, in seconds. */
export const buyMessageSeconds = 15;

export const buyLines = [
  "Love don't cost a thing.",
  "Can't buy my love.",
  "You will regret this.",
  "Nice try.",
  "Your money is no good here.",
  "The board does not take cards.",
  "Put the wallet down.",
  "Points are for showing up.",
  "Absolutely not.",
  "The palms cannot be bribed.",
  "Cute. Still no.",
  "We saw that.",
] as const;

/**
 * Coin chances. goOutChance is "go out". stayInChance is "stay in".
 * Whatever is left is a batman line. The two chances should add up to less than 1.
 */
export const goOutChance = 0.72;
export const stayInChance = 0.16;

export const coinOut = [
  "Signs point to outside.",
  "Go out. The night already said yes.",
  "Shoes on. The palms agree.",
  "Outlook: a story and a snack.",
  "Yes. Leave the house.",
  "The door is the whole plan.",
  "A meetup is lurking. Go find it.",
  "Absolutely. The sunset is a hint.",
  "Don't negotiate with the couch.",
  "Ask again only after you're out.",
] as const;

export const coinStay = [
  "You do you, girl. The blanket can win tonight.",
  "Self care counts. Stay in and mean it.",
] as const;

export const coinBatman = [
  "If this is batman: stop trying to press this again and again.",
  "If this is batman: please do whatever you want. We're scared.",
] as const;
