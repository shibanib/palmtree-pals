export type Sound =
  | "tap"
  | "tick"
  | "tock"
  | "key"
  | "date"
  | "dateSet"
  | "edit"
  | "cancel"
  | "save"
  | "saved"
  | "log"
  | "logged"
  | "error"
  | "flip";

let audio: AudioContext | null = null;
let lastKind: Sound | "" = "";
let lastAt = 0;

/** Which retro blip a button label should use. */
export function soundForButton(label: string): Sound {
  const text = label.trim().toLowerCase();
  if (text.includes("cancel")) return "cancel";
  if (text.includes("save")) return "save";
  if (text.includes("edit")) return "edit";
  if (text.includes("log")) return "log";
  return "tap";
}

function context(): AudioContext | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const Context = window.AudioContext;
  if (!Context) return null;
  if (!audio) audio = new Context();
  void audio.resume();
  return audio;
}

function tone(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  to: number,
  when: number,
  duration: number,
  gain: number,
) {
  const oscillator = ctx.createOscillator();
  const level = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, when);
  if (to !== freq) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + duration);
  level.gain.setValueAtTime(gain, when);
  level.gain.exponentialRampToValueAtTime(0.001, when + duration);
  oscillator.connect(level);
  level.connect(ctx.destination);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function noise(ctx: AudioContext, duration: number, gain: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const source = ctx.createBufferSource();
  const level = ctx.createGain();
  source.buffer = buffer;
  level.gain.setValueAtTime(gain, ctx.currentTime);
  source.connect(level);
  level.connect(ctx.destination);
  source.start();
}

/** A short synthesized blip. Same kind ignores a second trigger from one gesture. */
export function playSound(kind: Sound) {
  const now = performance.now();
  if (kind === lastKind && now - lastAt < 45) return;
  lastKind = kind;
  lastAt = now;
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime;
  if (kind === "key") {
    noise(ctx, 0.02, 0.03);
    return;
  }
  if (kind === "tick") tone(ctx, "square", 1180, 1180, start, 0.035, 0.04);
  else if (kind === "tock") tone(ctx, "triangle", 260, 140, start, 0.06, 0.05);
  else if (kind === "date") tone(ctx, "square", 392, 392, start, 0.04, 0.04);
  else if (kind === "dateSet") tone(ctx, "triangle", 784, 988, start, 0.07, 0.045);
  else if (kind === "edit") tone(ctx, "sine", 440, 990, start, 0.09, 0.05);
  else if (kind === "cancel") tone(ctx, "square", 620, 140, start, 0.1, 0.045);
  else if (kind === "save") {
    tone(ctx, "square", 523, 523, start, 0.07, 0.03);
    tone(ctx, "square", 659, 659, start, 0.07, 0.03);
  } else if (kind === "saved") tone(ctx, "triangle", 880, 1320, start, 0.08, 0.045);
  else if (kind === "log") tone(ctx, "square", 680, 340, start, 0.06, 0.05);
  else if (kind === "logged") {
    tone(ctx, "square", 523, 523, start, 0.05, 0.04);
    tone(ctx, "square", 659, 659, start + 0.06, 0.05, 0.04);
    tone(ctx, "square", 784, 784, start + 0.12, 0.08, 0.045);
  }   else if (kind === "error") tone(ctx, "sawtooth", 98, 70, start, 0.12, 0.04);
  else if (kind === "flip") {
    for (let step = 0; step < 6; step += 1) {
      tone(ctx, "square", 980 - step * 90, 640, start + step * 0.055, 0.04, 0.028);
    }
    tone(ctx, "triangle", 880, 1170, start + 0.36, 0.12, 0.05);
  } else tone(ctx, "square", 740, 180, start, 0.06, 0.05);
}

export function playClick() {
  playSound("tap");
}
