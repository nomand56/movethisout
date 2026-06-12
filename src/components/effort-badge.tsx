import { effortLabel } from '@/lib/effort'

const EFFORT_STYLES: Record<string, { bg: string; color: string; borderColor: string }> = {
  Light:       { bg: '#E8F5E9', color: '#2E7D32', borderColor: '#2E7D32' },
  Moderate:    { bg: '#FFF9C4', color: '#F57F17', borderColor: '#F57F17' },
  Challenging: { bg: '#FFF3E0', color: '#E65100', borderColor: '#E65100' },
  Heavy:       { bg: '#FFEBEE', color: '#C62828', borderColor: '#C62828' },
}

export function EffortBadge({ score }: { score: number }) {
  const label = effortLabel(score)
  const s = EFFORT_STYLES[label] ?? { bg: '#EFEDEA', color: '#141414', borderColor: '#141414' }
  return (
    <span style={{
      fontFamily: 'Barlow Condensed, sans-serif',
      fontSize: 10,
      letterSpacing: '0.1em',
      padding: '2px 8px',
      textTransform: 'uppercase',
      border: `1.5px solid ${s.borderColor}`,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {label} · {score}
    </span>
  )
}
