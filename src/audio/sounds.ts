/**
 * Procedural sound generation using Web Audio API — no external assets required.
 * Each sound is a small synthesizer patch that fires on demand.
 *
 * Global mute + volume live in localStorage so the setting persists across sessions.
 */

const MUTE_KEY = 'sagrada.audio.muted'
const VOL_KEY = 'sagrada.audio.volume'

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

function ensureCtx(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = readVolume()
    masterGain.connect(ctx.destination)
  }
  return ctx
}

export function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}
export function setMuted(m: boolean) {
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0') } catch {}
  if (masterGain) masterGain.gain.value = m ? 0 : readVolume()
}
export function readVolume(): number {
  try {
    const v = parseFloat(localStorage.getItem(VOL_KEY) ?? '0.5')
    return isNaN(v) ? 0.5 : Math.max(0, Math.min(1, v))
  } catch { return 0.5 }
}
export function setVolume(v: number) {
  const clamped = Math.max(0, Math.min(1, v))
  try { localStorage.setItem(VOL_KEY, String(clamped)) } catch {}
  if (masterGain && !isMuted()) masterGain.gain.value = clamped
}

/** Unlock audio on iOS Safari — must be called from a user gesture. */
export function unlockAudio() {
  try {
    const c = ensureCtx()
    if (c.state === 'suspended') c.resume()
  } catch {}
}

/* ─── Sound patches ─────────────────────────────────────── */

/** Short "clack" for placing a die into a cell. */
export function playPlace() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    const gain = c.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    gain.connect(masterGain!)

    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.15)
  } catch {}
}

/** Rolling dice — burst of filtered noise + descending pitch. */
export function playRoll() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    const bufferSize = 0.6 * c.sampleRate
    const buf = c.createBuffer(1, bufferSize, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.7

    const src = c.createBufferSource()
    src.buffer = buf

    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2200, now)
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.55)
    filter.Q.value = 1.5

    const gain = c.createGain()
    gain.gain.setValueAtTime(0.28, now)
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.6)

    src.connect(filter).connect(gain).connect(masterGain!)
    src.start(now)
    src.stop(now + 0.65)
  } catch {}
}

/** Gold chime — mission satisfied. Bell-like triangle harmonics. */
export function playChime() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    // C6, E6, G6 chord (celebratory)
    const freqs = [1046.5, 1318.5, 1568.0]
    freqs.forEach((f, i) => {
      const osc = c.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = f

      const gain = c.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + i * 0.05)

      osc.connect(gain).connect(masterGain!)
      osc.start(now + i * 0.03)
      osc.stop(now + 1.3)
    })
  } catch {}
}

/** Low descending buzz for rule violation. */
export function playError() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    const osc = c.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2)

    const gain = c.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

    osc.connect(gain).connect(masterGain!)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch {}
}

/** Deep cathedral bell — round transitions, game end. */
export function playBell() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    // Bell = fundamental + inharmonic partials
    const partials = [
      { f: 220, g: 0.32, dur: 3.0 },
      { f: 440, g: 0.18, dur: 2.4 },
      { f: 660, g: 0.12, dur: 1.6 },
      { f: 880, g: 0.08, dur: 1.0 },
    ]
    partials.forEach((p) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = p.f
      const gain = c.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(p.g, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur)
      osc.connect(gain).connect(masterGain!)
      osc.start(now)
      osc.stop(now + p.dur + 0.1)
    })
  } catch {}
}

/** Subtle UI tap for buttons/tabs. */
export function playClick() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1600, now)
    const gain = c.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    osc.connect(gain).connect(masterGain!)
    osc.start(now)
    osc.stop(now + 0.06)
  } catch {}
}

/** Coin/token clink when spending a favor token. */
export function playCoin() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    ;[2200, 3300, 4400].forEach((f, i) => {
      const osc = c.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      const gain = c.createGain()
      gain.gain.setValueAtTime(0, now + i * 0.03)
      gain.gain.linearRampToValueAtTime(0.06, now + i * 0.03 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.03 + 0.28)
      osc.connect(gain).connect(masterGain!)
      osc.start(now + i * 0.03)
      osc.stop(now + i * 0.03 + 0.32)
    })
  } catch {}
}

/** Ambient candle flicker — very quiet background at low duty cycle. */
export function playSuccess() {
  if (isMuted()) return
  try {
    const c = ensureCtx()
    const now = c.currentTime
    // Rising triad: C E G
    ;[523, 659, 784].forEach((f, i) => {
      const osc = c.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = f
      const gain = c.createGain()
      const t0 = now + i * 0.08
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.14, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7)
      osc.connect(gain).connect(masterGain!)
      osc.start(t0)
      osc.stop(t0 + 0.75)
    })
  } catch {}
}
