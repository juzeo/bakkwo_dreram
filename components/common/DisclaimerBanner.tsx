import { DISCLAIMER_TEXT } from '@/lib/nutrition'

// 로직4: 모든 출력물(웹뷰/다운로드카드/텍스트) 하단 고정 바인딩
export function DisclaimerBanner() {
  return <p className="mt-6 rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">{DISCLAIMER_TEXT}</p>
}
