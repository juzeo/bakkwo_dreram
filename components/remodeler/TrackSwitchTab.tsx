'use client'

import type { Track } from '@/lib/nutrition'

export function TrackSwitchTab({ activeTrack, onTrackChange }: { activeTrack: Track; onTrackChange: (t: Track) => void }) {
  return (
    <div className="mb-6 flex w-full max-w-xl rounded-xl bg-secondary p-1">
      <button
        onClick={() => onTrackChange('AFFORDABLE')}
        className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${activeTrack === 'AFFORDABLE' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
      >
        🔘 일반 가성비 대체
      </button>
      <button
        onClick={() => onTrackChange('LOCAL_FARM')}
        className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${activeTrack === 'LOCAL_FARM' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}
      >
        🟢 국산 농식품 상생 대체
      </button>
    </div>
  )
}
