import { useEffect, useState } from 'react'

// IngredientTable.tsx 명세: 중량 필드 디바운스(200ms) — 타이핑 중 잦은 재연산 방지
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
