export type SoloRhythm = "shuffle" | "straight" | "slow" | "fast";
export type LickCharacter = "call" | "response" | "fill";
export type ChordDegree = "I" | "IV" | "V";

export interface LickNote {
  interval: number;      // semitone offset from chord root (can exceed 12 for higher octave)
  beat: number;          // beat offset from bar start (0–3.99)
  duration: string;      // Tone.js duration string
  bend?: number;         // semitones to pitch up during this note (guitar bend effect)
  slideToNext?: boolean; // ramp pitch into next note at end of this note's duration
}

export interface Lick {
  id: string;
  notes: LickNote[];
  suitableFor: ChordDegree[];
  character: LickCharacter;
  feels: SoloRhythm[];
  spansNextBar?: boolean; // phrase has notes with beatOffset >= 4 (crosses barline)
}

export const LICKS: Lick[] = [
  // ─── RESPONSE LICKS ────────────────────────────────────────────────────────

  // Classic "curl": b3 bent half-step to maj3, resolve to root.
  // Using a real bend instead of two separate notes sounds much more authentic.
  {
    id: "curl",
    notes: [
      { interval: 3, beat: 0, duration: "2n", bend: 1 },
      { interval: 0, beat: 2, duration: "2n" },
    ],
    suitableFor: ["I", "IV"],
    character: "response",
    feels: ["shuffle", "straight"],
  },
  // Slow version of the curl — one long bend then land on root
  {
    id: "slow-curl",
    notes: [
      { interval: 3, beat: 0, duration: "2n.", bend: 1 },
      { interval: 0, beat: 3, duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "response",
    feels: ["slow"],
  },
  // Minor pent cascade from octave root down to root — BB King / Buddy Guy
  {
    id: "pent-fall",
    notes: [
      { interval: 12, beat: 0,     duration: "8t" },
      { interval: 10, beat: 0.333, duration: "8t" },
      { interval: 7,  beat: 1,     duration: "8t" },
      { interval: 5,  beat: 1.333, duration: "8t" },
      { interval: 3,  beat: 2,     duration: "8t" },
      { interval: 0,  beat: 2.333, duration: "4n" },
    ],
    suitableFor: ["I"],
    character: "response",
    feels: ["shuffle"],
  },
  // b7 → root(oct) → b7 → land on 5th
  {
    id: "bb-resolve",
    notes: [
      { interval: 10, beat: 0,     duration: "8t" },
      { interval: 12, beat: 0.333, duration: "8t" },
      { interval: 10, beat: 1,     duration: "4n" },
      { interval: 7,  beat: 2,     duration: "2n" },
    ],
    suitableFor: ["I", "IV"],
    character: "response",
    feels: ["shuffle", "straight"],
  },
  // Turnaround descent with slight chromatic passing note
  {
    id: "turnaround-fall",
    notes: [
      { interval: 12, beat: 0,     duration: "8t" },
      { interval: 10, beat: 0.333, duration: "8t" },
      { interval: 7,  beat: 1,     duration: "8t" },
      { interval: 5,  beat: 1.333, duration: "8t" },
      { interval: 3,  beat: 2,     duration: "8t" },
      { interval: 2,  beat: 2.333, duration: "8t" },
      { interval: 0,  beat: 3,     duration: "4n" },
    ],
    suitableFor: ["I"],
    character: "response",
    feels: ["shuffle"],
  },
  // Slow long-note resolve: root(oct) → b7 → 5th → root
  {
    id: "slow-resolve",
    notes: [
      { interval: 12, beat: 0, duration: "4n" },
      { interval: 10, beat: 1, duration: "4n" },
      { interval: 7,  beat: 2, duration: "4n" },
      { interval: 0,  beat: 3, duration: "2n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "response",
    feels: ["slow"],
  },
  // b3 bent a WHOLE STEP (= 4th) then released to root — very SRV / Albert King
  {
    id: "bend-up-b3",
    notes: [
      { interval: 3, beat: 0, duration: "2n", bend: 2 },
      { interval: 0, beat: 2, duration: "2n" },
    ],
    suitableFor: ["I", "IV"],
    character: "response",
    feels: ["shuffle", "straight"],
  },
  // b7 slides smoothly up to root(oct) — classic "resolve home" slide
  {
    id: "slide-home",
    notes: [
      { interval: 10, beat: 0,   duration: "8n", slideToNext: true },
      { interval: 12, beat: 0.5, duration: "4n." },
      { interval: 7,  beat: 2,   duration: "2n" },
    ],
    suitableFor: ["I"],
    character: "response",
    feels: ["shuffle", "straight"],
  },

  // ─── CALL LICKS ────────────────────────────────────────────────────────────

  // Chromatic climb through blue note: b3 → 4 → b5 → 5 → b7
  {
    id: "blue-climb",
    notes: [
      { interval: 3,  beat: 0,     duration: "8t" },
      { interval: 5,  beat: 0.333, duration: "8t" },
      { interval: 6,  beat: 1,     duration: "8t" },
      { interval: 7,  beat: 1.333, duration: "8t" },
      { interval: 10, beat: 2,     duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "call",
    feels: ["shuffle"],
  },
  // Albert King slow sustain — spacious, vocal phrasing
  {
    id: "albert-king",
    notes: [
      { interval: 7,  beat: 0, duration: "4n" },
      { interval: 10, beat: 1, duration: "4n" },
      { interval: 12, beat: 2, duration: "4n" },
      { interval: 10, beat: 3, duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "call",
    feels: ["slow", "straight"],
  },
  // Walk up: root → b3 → 5th → b7
  {
    id: "walk-up",
    notes: [
      { interval: 0,  beat: 0, duration: "4n" },
      { interval: 3,  beat: 1, duration: "4n" },
      { interval: 7,  beat: 2, duration: "4n" },
      { interval: 10, beat: 3, duration: "4n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "call",
    feels: ["slow", "shuffle", "straight"],
  },
  // Howlin Wolf repetition motif: pairs of b7 and root
  {
    id: "howlin-motif",
    notes: [
      { interval: 10, beat: 0,     duration: "8t" },
      { interval: 10, beat: 0.333, duration: "8t" },
      { interval: 12, beat: 1,     duration: "8t" },
      { interval: 12, beat: 1.333, duration: "8t" },
      { interval: 10, beat: 2,     duration: "8t" },
      { interval: 7,  beat: 2.333, duration: "8t" },
    ],
    suitableFor: ["I"],
    character: "call",
    feels: ["shuffle"],
  },
  // Gospel IV move: 5 → b7 → root(oct) → b7 → 5
  {
    id: "gospel-up",
    notes: [
      { interval: 7,  beat: 0,     duration: "8t" },
      { interval: 10, beat: 0.333, duration: "8t" },
      { interval: 12, beat: 1,     duration: "8t" },
      { interval: 10, beat: 1.333, duration: "8t" },
      { interval: 7,  beat: 2,     duration: "4n" },
    ],
    suitableFor: ["IV"],
    character: "call",
    feels: ["shuffle", "straight"],
  },
  // V chord tension: root(oct) → b7 → 5th → 4th — wants to resolve
  {
    id: "v-resolve",
    notes: [
      { interval: 12, beat: 0,   duration: "8n" },
      { interval: 10, beat: 0.5, duration: "8n" },
      { interval: 7,  beat: 1,   duration: "4n" },
      { interval: 5,  beat: 2,   duration: "2n" },
    ],
    suitableFor: ["V"],
    character: "call",
    feels: ["shuffle", "straight"],
  },
  // Slow V call: hammering between root and b7
  {
    id: "v-slow-call",
    notes: [
      { interval: 12, beat: 0, duration: "4n" },
      { interval: 10, beat: 1, duration: "4n" },
      { interval: 12, beat: 2, duration: "4n" },
      { interval: 10, beat: 3, duration: "4n" },
    ],
    suitableFor: ["V"],
    character: "call",
    feels: ["slow"],
  },
  // 5th bent up a whole step (→ b7), then root — very expressive and vocal
  {
    id: "bb-bend",
    notes: [
      { interval: 7,  beat: 0, duration: "4n", bend: 2 },
      { interval: 10, beat: 1, duration: "4n" },
      { interval: 0,  beat: 2, duration: "2n" },
    ],
    suitableFor: ["I"],
    character: "call",
    feels: ["shuffle", "straight"],
  },
  // Approach slide up into the 5th, then walk to b7 and root
  {
    id: "slide-climb",
    notes: [
      { interval: 5,  beat: 0,     duration: "8t", slideToNext: true },
      { interval: 7,  beat: 0.333, duration: "8t" },
      { interval: 10, beat: 1,     duration: "4n" },
      { interval: 12, beat: 2,     duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "call",
    feels: ["shuffle"],
  },

  // ─── FILL LICKS ────────────────────────────────────────────────────────────

  // Full minor pent ascending
  {
    id: "pent-up",
    notes: [
      { interval: 0,  beat: 0,   duration: "8n" },
      { interval: 3,  beat: 0.5, duration: "8n" },
      { interval: 5,  beat: 1,   duration: "8n" },
      { interval: 7,  beat: 1.5, duration: "8n" },
      { interval: 10, beat: 2,   duration: "8n" },
      { interval: 12, beat: 2.5, duration: "8n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["straight"],
  },
  // Upper-register walk-down
  {
    id: "walk-down",
    notes: [
      { interval: 12, beat: 0,     duration: "8t" },
      { interval: 10, beat: 0.333, duration: "8t" },
      { interval: 7,  beat: 1,     duration: "8t" },
      { interval: 5,  beat: 1.333, duration: "8t" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["shuffle"],
  },
  // Blue-note tease: 4 → b5 → 5 → b7 — the most distinctively blues move
  {
    id: "blue-tease",
    notes: [
      { interval: 5,  beat: 0,   duration: "8n" },
      { interval: 6,  beat: 0.5, duration: "8n" },
      { interval: 7,  beat: 1,   duration: "8n" },
      { interval: 10, beat: 1.5, duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "fill",
    feels: ["straight"],
  },
  // Shuffle vamp: root → b3 → root → b3 → root → b7
  {
    id: "shuffle-bounce",
    notes: [
      { interval: 0,  beat: 0,     duration: "8t" },
      { interval: 3,  beat: 0.333, duration: "8t" },
      { interval: 0,  beat: 1,     duration: "8t" },
      { interval: 3,  beat: 1.333, duration: "8t" },
      { interval: 0,  beat: 2,     duration: "8t" },
      { interval: 10, beat: 2.333, duration: "8t" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["shuffle"],
  },
  // BB box: hammering b7 and root in the top of the pentatonic box
  {
    id: "bb-box",
    notes: [
      { interval: 10, beat: 0,     duration: "8t" },
      { interval: 12, beat: 0.333, duration: "8t" },
      { interval: 10, beat: 1,     duration: "8t" },
      { interval: 12, beat: 1.333, duration: "8t" },
      { interval: 10, beat: 2,     duration: "4n" },
    ],
    suitableFor: ["I"],
    character: "fill",
    feels: ["shuffle"],
  },
  // Fast chromatic run up to the octave, then settle on b7
  {
    id: "fast-run-up",
    notes: [
      { interval: 0,  beat: 0,    duration: "16n" },
      { interval: 2,  beat: 0.25, duration: "16n" },
      { interval: 3,  beat: 0.5,  duration: "16n" },
      { interval: 5,  beat: 0.75, duration: "16n" },
      { interval: 7,  beat: 1,    duration: "16n" },
      { interval: 10, beat: 1.25, duration: "16n" },
      { interval: 12, beat: 1.5,  duration: "16n" },
      { interval: 10, beat: 2,    duration: "4n"  },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["fast"],
  },
  // Fast pent bounce
  {
    id: "fast-pent-bounce",
    notes: [
      { interval: 0,  beat: 0,    duration: "16n" },
      { interval: 3,  beat: 0.25, duration: "16n" },
      { interval: 5,  beat: 0.5,  duration: "16n" },
      { interval: 3,  beat: 0.75, duration: "16n" },
      { interval: 0,  beat: 1,    duration: "16n" },
      { interval: 10, beat: 1.25, duration: "16n" },
      { interval: 12, beat: 1.5,  duration: "16n" },
      { interval: 10, beat: 2,    duration: "4n"  },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["fast"],
  },
  // Slow spacious sustain on chord tones
  {
    id: "slow-sustain",
    notes: [
      { interval: 0,  beat: 0, duration: "4n" },
      { interval: 7,  beat: 1, duration: "4n" },
      { interval: 10, beat: 2, duration: "4n" },
      { interval: 12, beat: 3, duration: "4n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["slow"],
  },
  // Slide down from root(oct) through b7 — descending slide feel
  {
    id: "slide-down",
    notes: [
      { interval: 12, beat: 0, duration: "8n", slideToNext: true },
      { interval: 10, beat: 0.5, duration: "4n." },
      { interval: 7,  beat: 2, duration: "2n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["shuffle", "straight"],
  },

  // ─── NON-ROOT START LICKS ───────────────────────────────────────────────

  // From 5th: descend through b5 blue note to root — very vocal
  {
    id: "from-fifth-descent",
    notes: [
      { interval: 7,  beat: 0,     duration: "8t" },
      { interval: 6,  beat: 0.333, duration: "8t" },   // b5 blue note
      { interval: 5,  beat: 1,     duration: "8t" },
      { interval: 3,  beat: 1.333, duration: "8t" },
      { interval: 0,  beat: 2,     duration: "2n" },
    ],
    suitableFor: ["I", "IV"],
    character: "response",
    feels: ["shuffle", "straight"],
  },

  // From b7: climb through octave root to major 9th, resolve home
  {
    id: "from-b7-call",
    notes: [
      { interval: 10, beat: 0,   duration: "8n" },
      { interval: 12, beat: 0.5, duration: "8n" },
      { interval: 14, beat: 1,   duration: "4n" },    // major 9th — vocal "waul"
      { interval: 12, beat: 2,   duration: "2n" },
    ],
    suitableFor: ["I"],
    character: "call",
    feels: ["shuffle", "straight"],
  },

  // From b3: half-step bend to maj3, walk through 5th back to root
  {
    id: "from-third-resolve",
    notes: [
      { interval: 3, beat: 0, duration: "4n", bend: 1 },
      { interval: 0, beat: 1, duration: "4n" },
      { interval: 7, beat: 2, duration: "4n" },
      { interval: 0, beat: 3, duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "response",
    feels: ["shuffle", "straight", "slow"],
  },

  // 5th bent a minor 3rd to b7 — Albert Collins / SRV signature
  {
    id: "from-fifth-bigbend",
    notes: [
      { interval: 7,  beat: 0, duration: "2n", bend: 3 },
      { interval: 12, beat: 2, duration: "4n" },
      { interval: 10, beat: 3, duration: "4n" },
    ],
    suitableFor: ["I"],
    character: "call",
    feels: ["slow", "shuffle"],
  },

  // b3 slides into the 4th, walks up through 5th and b7 to octave root
  {
    id: "from-third-slide",
    notes: [
      { interval: 3,  beat: 0,   duration: "8n", slideToNext: true },
      { interval: 5,  beat: 0.5, duration: "8n" },
      { interval: 7,  beat: 1,   duration: "4n" },
      { interval: 10, beat: 2,   duration: "4n" },
      { interval: 12, beat: 3,   duration: "4n" },
    ],
    suitableFor: ["I", "IV"],
    character: "call",
    feels: ["shuffle", "straight"],
  },

  // ─── RHYTHMIC VARIATION LICKS ───────────────────────────────────────────

  // Sextuplet burst (6 × 16t = 1 beat) then hold — dramatic and fast
  {
    id: "sixteenth-burst",
    notes: [
      { interval: 0,  beat: 0,      duration: "16t" },
      { interval: 3,  beat: 0.1667, duration: "16t" },
      { interval: 5,  beat: 0.3333, duration: "16t" },
      { interval: 7,  beat: 0.5,    duration: "16t" },
      { interval: 10, beat: 0.6667, duration: "16t" },
      { interval: 12, beat: 0.8333, duration: "16t" },
      { interval: 10, beat: 1,      duration: "4n"  },
      { interval: 7,  beat: 2,      duration: "2n"  },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["fast", "straight"],
  },

  // All notes on off-beats ("and" of each beat) — strong syncopation
  {
    id: "syncopated-groove",
    notes: [
      { interval: 3,  beat: 0.5, duration: "4n" },    // "and" of 1
      { interval: 5,  beat: 1.5, duration: "4n" },    // "and" of 2
      { interval: 7,  beat: 2.5, duration: "4n" },    // "and" of 3
      { interval: 10, beat: 3.5, duration: "8n" },    // "and" of 4
    ],
    suitableFor: ["I", "IV"],
    character: "call",
    feels: ["shuffle", "straight"],
  },

  // Mixes shuffle triplets and straight 8ths — polyrhythmic tension
  {
    id: "triplet-straight-mix",
    notes: [
      { interval: 0,  beat: 0,     duration: "8t" },  // triplet pair
      { interval: 3,  beat: 0.333, duration: "8t" },
      { interval: 5,  beat: 0.667, duration: "8n" },  // switch to straight 8th
      { interval: 7,  beat: 1.167, duration: "8n" },
      { interval: 10, beat: 1.667, duration: "8t" },  // back to triplet
      { interval: 12, beat: 2,     duration: "8t" },
      { interval: 10, beat: 2.333, duration: "4n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["shuffle"],
  },

  // Approach note (maj2) into b3, resolves through 5th with space
  {
    id: "approach-resolve",
    notes: [
      { interval: 2, beat: 0,    duration: "16n" },   // non-chord approach
      { interval: 3, beat: 0.25, duration: "8n" },
      { interval: 5, beat: 0.75, duration: "8n" },
      { interval: 7, beat: 1.25, duration: "4n" },
      { interval: 0, beat: 3,    duration: "4n" },
    ],
    suitableFor: ["I", "IV", "V"],
    character: "fill",
    feels: ["straight"],
  },

  // ─── CROSS-BAR LICKS ────────────────────────────────────────────────────

  // Pickup phrase: silent beats 1–2, accelerates across the barline into next bar
  {
    id: "cross-bar-pickup",
    notes: [
      { interval: 3,  beat: 2,     duration: "8n"  },
      { interval: 5,  beat: 2.5,   duration: "8n"  },
      { interval: 7,  beat: 3,     duration: "8t"  },
      { interval: 10, beat: 3.333, duration: "8t"  },
      { interval: 12, beat: 3.667, duration: "8t"  },
      { interval: 10, beat: 4,     duration: "4n"  },  // beat 1 of next bar
      { interval: 7,  beat: 5,     duration: "2n"  },  // beat 2 of next bar
    ],
    suitableFor: ["I", "IV"],
    character: "call",
    feels: ["shuffle", "straight"],
    spansNextBar: true,
  },

  // Descending cascade: starts beat 2, resolves on beat 1 of next bar
  {
    id: "cross-bar-resolve",
    notes: [
      { interval: 12, beat: 1,     duration: "8t"  },
      { interval: 10, beat: 1.333, duration: "8t"  },
      { interval: 7,  beat: 2,     duration: "8t"  },
      { interval: 5,  beat: 2.333, duration: "8t"  },
      { interval: 3,  beat: 3,     duration: "4n"  },
      { interval: 0,  beat: 4,     duration: "2n"  },  // resolve beat 1 of next bar
      { interval: 7,  beat: 6,     duration: "2n"  },  // settle on 5th, beat 3 of next bar
    ],
    suitableFor: ["I"],
    character: "response",
    feels: ["shuffle"],
    spansNextBar: true,
  },
];
