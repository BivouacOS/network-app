import { useMemo } from 'react'

interface Star {
  x: number
  y: number
  r: number
  opacity: number
  duration: number
  delay: number
}

function lcgRand(seed: number) {
  let s = seed
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0
    return (s >>> 0) / 0xffffffff
  }
}

export function Starfield() {
  const { tiny, small, large } = useMemo(() => {
    const rand = lcgRand(0xdeadbeef)

    const tiny: Star[] = Array.from({ length: 160 }, () => ({
      x: rand() * 100, y: rand() * 100,
      r: rand() * 0.5 + 0.2,
      opacity: rand() * 0.4 + 0.1,
      duration: rand() * 3 + 2,
      delay: rand() * 5,
    }))

    const small: Star[] = Array.from({ length: 60 }, () => ({
      x: rand() * 100, y: rand() * 100,
      r: rand() * 0.8 + 0.5,
      opacity: rand() * 0.5 + 0.3,
      duration: rand() * 4 + 3,
      delay: rand() * 6,
    }))

    const large: Star[] = Array.from({ length: 15 }, () => ({
      x: rand() * 100, y: rand() * 100,
      r: rand() * 1.2 + 1.0,
      opacity: rand() * 0.4 + 0.5,
      duration: rand() * 5 + 4,
      delay: rand() * 8,
    }))

    return { tiny, small, large }
  }, [])

  return (
    <svg
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="nebula1" cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="#1a0533" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula2" cx="75%" cy="65%" r="35%">
          <stop offset="0%" stopColor="#001a33" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula3" cx="55%" cy="80%" r="30%">
          <stop offset="0%" stopColor="#0d1a0d" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#020409" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100%" height="100%" fill="#020409" />
      <rect width="100%" height="100%" fill="url(#nebula1)" />
      <rect width="100%" height="100%" fill="url(#nebula2)" />
      <rect width="100%" height="100%" fill="url(#nebula3)" />

      {tiny.map((s, i) => (
        <circle
          key={`t${i}`}
          cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill="white" opacity={s.opacity}
          style={{
            animation: `starTwinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {small.map((s, i) => (
        <circle
          key={`s${i}`}
          cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill="#bfdbfe" opacity={s.opacity}
          style={{
            animation: `starTwinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {large.map((s, i) => (
        <circle
          key={`l${i}`}
          cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill="white" opacity={s.opacity}
          style={{
            animation: `starTwinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            filter: 'blur(0.3px)',
          }}
        />
      ))}
    </svg>
  )
}
