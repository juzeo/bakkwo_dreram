'use client'

import { Clipboard, Download, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadNodeAsPng } from '@/lib/export'

export function ExportActionBar({
  cardElementId, filename, exportText, onSave, savedFlash,
}: {
  cardElementId: string
  filename: string
  exportText: () => string
  onSave?: () => void
  savedFlash?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {savedFlash && <span className="text-sm font-medium text-primary">보관함에 저장했어요 ✓</span>}
      {onSave && (
        <Button variant="outline" onClick={onSave}>
          <Save data-icon="inline-start" /> 레시피 저장함에 저장
        </Button>
      )}
      <Button variant="outline" onClick={() => navigator.clipboard?.writeText(exportText())}>
        <Clipboard data-icon="inline-start" /> 배달앱 문구 복사
      </Button>
      <Button onClick={() => downloadNodeAsPng(cardElementId, filename)}>
        <Download data-icon="inline-start" /> 영양성분 카드 PNG 다운로드
      </Button>
    </div>
  )
}
