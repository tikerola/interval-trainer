// Converts a Tone.js duration string ("8n", "8t", "4n.", ...) into a quarter-note
// (beat) count. Mirrors Tone.Time's own notation: trailing "n" = plain subdivision,
// "t" = triplet (×2/3), trailing "." = dotted (×1.5).
export function toneDurationToBeats(duration: string | number): number {
  if (typeof duration === "number") return duration;
  // Tone.js Transport-time notation ("bars:quarters"), used as an exact fallback
  // for tied-note durations that don't reduce to a single "Nn"/"Nt" token.
  const transport = duration.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (transport) return Number(transport[1]) * 4 + Number(transport[2]);
  const dotted = duration.endsWith(".");
  const base = dotted ? duration.slice(0, -1) : duration;
  const isTriplet = base.endsWith("t");
  const denominator = Number(base.slice(0, -1));
  let beats = 4 / denominator;
  if (isTriplet) beats *= 2 / 3;
  if (dotted) beats *= 1.5;
  return beats;
}
