let audio: AudioContext | null = null;

/** A short square-wave blip. No audio files. */
export function playClick() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const Context = window.AudioContext;
  if (!Context) return;
  if (!audio) audio = new Context();
  const start = audio.currentTime;
  const tone = audio.createOscillator();
  const level = audio.createGain();
  tone.type = "square";
  tone.frequency.setValueAtTime(740, start);
  tone.frequency.exponentialRampToValueAtTime(180, start + 0.045);
  level.gain.setValueAtTime(0.05, start);
  level.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
  tone.connect(level);
  level.connect(audio.destination);
  void audio.resume();
  tone.start(start);
  tone.stop(start + 0.07);
}
