'use client'

import { useEffect, useState } from 'react'
import { TEMPLATES, type MenuTemplate } from '@/lib/mockData'

// 메뉴젠 표준 레시피 1초 로더 — 서버(TiDB) 템플릿을 우선 시도하고 실패 시 목업으로 폴백
export function TemplateSelector({ onSelect }: { onSelect: (template: MenuTemplate) => void }) {
  const [templates, setTemplates] = useState<MenuTemplate[]>(TEMPLATES)

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/templates/menus')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (!cancelled && data?.success && Array.isArray(data.menus) && data.menus.length) {
          setTemplates(data.menus)
        }
      })
      .catch(() => {}) // 실패 시 목업 유지
    return () => { cancelled = true }
  }, [])

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      메뉴젠 표준 레시피
      <select
        defaultValue=""
        onChange={e => {
          const tpl = templates.find(t => t.template_id === e.target.value)
          if (tpl) onSelect(tpl)
        }}
        className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>1초 템플릿 불러오기</option>
        {templates.map(t => <option key={t.template_id} value={t.template_id}>{t.menu_name}</option>)}
      </select>
    </label>
  )
}
