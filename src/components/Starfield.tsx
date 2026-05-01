import { useMemo, useEffect, useRef } from 'react'
import { useStoreApi } from '@xyflow/react'

interface Star { x: number; y: number; r: number; opacity: number; duration: number; delay: number; color: string }

function lcgRand(seed: number) {
  let s = seed
  return () => { s = Math.imul(1664525, s) + 1013904223 | 0; return (s >>> 0) / 0xffffffff }
}

// Realistic stellar spectral colors by type
const SPECTRAL = [
  '#b8cfff', '#ccd8ff',              // O/B — hot blue-white
  '#ffffff', '#ffffff', '#f9f9ff',   // A   — white
  '#fffef2', '#fff8e0',              // F   — yellow-white
  '#ffe99a', '#ffd966',              // G   — yellow (sun-like)
  '#ffb347', '#ff9500',              // K   — orange
  '#ff6a50', '#e04030',              // M   — red giants
]
const MW_WARM = ['#fff8e0', '#fff0b3', '#ffe099', '#ffffff', '#f9f9ff']

export function Starfield() {
  const nearStarsRef = useRef<SVGGElement>(null)  // layer 1 — minimal parallax
  const nebulaeRef   = useRef<SVGGElement>(null)  // layer 2 — midground parallax

  const rfStore = useStoreApi()

  useEffect(() => {
    let raf: number

    const tick = () => {
      const [x, y] = rfStore.getState().transform

      if (nearStarsRef.current)
        nearStarsRef.current.style.transform = `translate(${x * 0.03}px, ${y * 0.03}px)`
      if (nebulaeRef.current)
        nebulaeRef.current.style.transform   = `translate(${x * 0.075}px, ${y * 0.075}px)`

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rfStore])

  const stars = useMemo(() => {
    const rand = lcgRand(0xdeadbeef)
    const pick = (arr: string[]) => arr[Math.floor(rand() * arr.length)]
    const ang = 32 * Math.PI / 180

    // ── Milky Way band dust: ~500 stars concentrated in a 32° diagonal strip ──
    const mwDust: Star[] = Array.from({ length: 500 }, () => {
      const t = rand()
      const along = t * 120 - 10
      // Non-uniform perpendicular spread — denser toward center (dark lanes effect)
      const u = rand() - 0.5
      const perp = Math.sign(u) * u * u * 22 + (rand() - 0.5) * 6
      // Galactic center is warmer/brighter (toward center of band)
      const warmth = Math.exp(-((along - 58) ** 2) / 900)
      return {
        x: Math.max(0, Math.min(100, along - perp * Math.sin(ang))),
        y: Math.max(0, Math.min(100, 10 + along * Math.tan(ang) * 0.36 + perp * Math.cos(ang) - 18)),
        r: rand() * 0.45 + 0.1,
        opacity: (rand() * 0.16 + 0.03) * (1 + warmth * 0.6),
        duration: rand() * 6 + 3,
        delay: rand() * 10,
        color: warmth > 0.35 ? pick(MW_WARM) : '#ffffff',
      }
    })

    // ── General sky field: density biased toward galactic equator ──
    const field: Star[] = Array.from({ length: 300 }, () => {
      const x = rand() * 100
      const y = rand() * 100
      const galDist = Math.abs(y - 46) / 46
      return {
        x, y,
        r: rand() * 0.6 + 0.15,
        opacity: (rand() * 0.38 + 0.07) * (1 - galDist * 0.45),
        duration: rand() * 4 + 2,
        delay: rand() * 8,
        color: pick(SPECTRAL),
      }
    })

    // ── Near-background stars: sparser, slightly brighter (layer 1, minimal parallax) ──
    const near: Star[] = Array.from({ length: 110 }, () => ({
      x: rand() * 100, y: rand() * 100,
      r: rand() * 0.85 + 0.4,
      opacity: rand() * 0.55 + 0.25,
      duration: rand() * 4 + 3,
      delay: rand() * 7,
      color: pick(SPECTRAL),
    }))

    // Pleiades analog — tight blue-white open cluster
    const pleiades: Star[] = Array.from({ length: 22 }, () => {
      const a = rand() * Math.PI * 2
      const d = rand() * rand() * 4
      return {
        x: Math.max(0, Math.min(100, 72 + Math.cos(a) * d)),
        y: Math.max(0, Math.min(100, 20 + Math.sin(a) * d)),
        r: rand() * 0.75 + 0.3,
        opacity: rand() * 0.5 + 0.3,
        duration: rand() * 3 + 2,
        delay: rand() * 5,
        color: pick(['#b8cfff', '#ccd8ff', '#dde8ff', '#ffffff']),
      }
    })

    // Hyades analog — loose orange open cluster
    const hyades: Star[] = Array.from({ length: 16 }, () => {
      const a = rand() * Math.PI * 2
      const d = rand() * 6.5
      return {
        x: Math.max(0, Math.min(100, 24 + Math.cos(a) * d)),
        y: Math.max(0, Math.min(100, 68 + Math.sin(a) * d)),
        r: rand() * 0.8 + 0.35,
        opacity: rand() * 0.4 + 0.2,
        duration: rand() * 4 + 3,
        delay: rand() * 6,
        color: pick(['#ffb347', '#ff9500', '#ffe099', '#ffffff']),
      }
    })

    return { mwDust, field, near, pleiades, hyades }
  }, [])

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Milky Way band — diagonal luminosity */}
        <linearGradient id="mwBand" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#04091a" stopOpacity="0" />
          <stop offset="28%"  stopColor="#0b1428" stopOpacity="0.32" />
          <stop offset="50%"  stopColor="#121e3c" stopOpacity="0.44" />
          <stop offset="72%"  stopColor="#0b1428" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#04091a" stopOpacity="0" />
        </linearGradient>

        {/* Galactic center warm glow — toward Sagittarius */}
        <radialGradient id="galCore" cx="58%" cy="54%" r="28%">
          <stop offset="0%"   stopColor="#2e1a00" stopOpacity="0.3" />
          <stop offset="60%"  stopColor="#1a0e00" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>

        {/* ── Nebulae: realistic emission / reflection / supernova colors ──
            H-alpha emission = deep red #6b0020 → #c42348
            OIII / reflection = blue    #0d2e6e → #1a4a8a
            Mixed (H-alpha+OIII)= purple #4a0e5e → #7c2aaa
        */}

        {/* Orion-like H-alpha emission — red/magenta, lower-center */}
        <radialGradient id="nOrion" cx="38%" cy="72%" r="24%">
          <stop offset="0%"   stopColor="#7a0022" stopOpacity="0.45" />
          <stop offset="45%"  stopColor="#b01840" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>

        {/* Cygnus Loop supernova remnant — blue-purple arc, upper-right */}
        <radialGradient id="nCygnus" cx="74%" cy="28%" r="30%">
          <stop offset="0%"   stopColor="#1a1560" stopOpacity="0.48" />
          <stop offset="55%"  stopColor="#28228a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>

        {/* Rosette — mixed purple/magenta, left */}
        <radialGradient id="nRosette" cx="14%" cy="38%" r="20%">
          <stop offset="0%"   stopColor="#6a1050" stopOpacity="0.42" />
          <stop offset="55%"  stopColor="#9e1e78" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>

        {/* Pleiades reflection nebula — soft blue glow around cluster */}
        <radialGradient id="nPleiades" cx="72%" cy="20%" r="11%">
          <stop offset="0%"   stopColor="#0d2d70" stopOpacity="0.52" />
          <stop offset="70%"  stopColor="#0d2d70" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>

        {/* California nebula — elongated red filament (linear gradient) */}
        <linearGradient id="nCalifornia" x1="25%" y1="82%" x2="72%" y2="58%">
          <stop offset="0%"   stopColor="#020409"  stopOpacity="0" />
          <stop offset="35%"  stopColor="#6e1010" stopOpacity="0.35" />
          <stop offset="60%"  stopColor="#8c1a1a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#020409"  stopOpacity="0" />
        </linearGradient>

        {/* Glow filters */}
        <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.85" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ════ LAYER 0 — Static deep background (furthest) ════ */}
      <rect width="100%" height="100%" fill="#020409" />
      <rect width="100%" height="100%" fill="url(#mwBand)" />
      <rect width="100%" height="100%" fill="url(#galCore)" />

      {/* Milky Way dust stars */}
      {stars.mwDust.map((s, i) => (
        <circle key={`mw${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill={s.color} opacity={s.opacity}
          style={{ animation: `starTwinkle ${s.duration}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
      ))}
      {/* General field stars */}
      {stars.field.map((s, i) => (
        <circle key={`f${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill={s.color} opacity={s.opacity}
          style={{ animation: `starTwinkle ${s.duration}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
      ))}

      {/* ════ LAYER 1 — Near-background stars (minimal parallax 7px/5px) ════ */}
      <g ref={nearStarsRef}>
        {stars.near.map((s, i) => (
          <circle key={`n${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
            fill={s.color} opacity={s.opacity}
            filter="url(#softGlow)"
            style={{ animation: `starTwinkle ${s.duration}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
        ))}
        {/* Pleiades open cluster — blue-white */}
        {stars.pleiades.map((s, i) => (
          <circle key={`pl${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
            fill={s.color} opacity={s.opacity}
            style={{ animation: `starTwinkle ${s.duration}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
        ))}
        {/* Hyades open cluster — orange */}
        {stars.hyades.map((s, i) => (
          <circle key={`hy${i}`} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
            fill={s.color} opacity={s.opacity}
            style={{ animation: `starTwinkle ${s.duration}s ease-in-out infinite`, animationDelay: `${s.delay}s` }} />
        ))}
      </g>

      {/* ════ LAYER 2 — Nebulae midground (parallax 20px/14px) ════
           Most transparent. Realistic emission / reflection colors.
           Rects overscan 8% to hide edge clipping during parallax.       */}
      <g ref={nebulaeRef}>
        <rect x="-8%" y="-8%" width="116%" height="116%" fill="url(#nOrion)" />
        <rect x="-8%" y="-8%" width="116%" height="116%" fill="url(#nCygnus)" />
        <rect x="-8%" y="-8%" width="116%" height="116%" fill="url(#nRosette)" />
        <rect x="-8%" y="-8%" width="116%" height="116%" fill="url(#nPleiades)" />
        <rect x="-8%" y="-8%" width="116%" height="116%" fill="url(#nCalifornia)" />
      </g>

      {/* ════ LAYER 3 — Nodes & links rendered by ReactFlow (above this SVG) ════ */}
    </svg>
  )
}
