'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Clipboard, Download, Leaf, Plus, Search, ShieldCheck, Sparkles, Trash2, Utensils, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── DB 10.4 매핑 목업 데이터 (실 서비스에서는 /api/v1/foods/search 로 대체) ──
// food_id 값은 명세서 5장 API 예시와 동일하게 맞춰 두었습니다.
const ingredients = [
  { food_id: 1103, food_group: '육류', name: '닭가슴살', kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, sodium: 74, fiber: 0 },
  { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0 },
  { food_id: 906, food_group: '채소류', name: '양파', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, sugar: 4.2, sodium: 4, fiber: 1.7 },
  { food_id: 610, food_group: '당류', name: '물엿', kcal: 317, protein: 0, carbs: 79, fat: 0, sugar: 42, sodium: 5, fiber: 0 },
  { food_id: 101, food_group: '곡류 및 그 제품', name: '쌀밥', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1, sodium: 1, fiber: 0.3 },
  { food_id: 1420, food_group: '육류', name: '돼지고기, 앞다리, 생것', kcal: 223, protein: 18.6, carbs: 0, fat: 16, sugar: 0, sodium: 57, fiber: 0 },
  { food_id: 401, food_group: '조미료류', name: '고추장, 혼합', kcal: 225, protein: 5.6, carbs: 44, fat: 2.4, sugar: 16, sodium: 2000, fiber: 4.2 },
  { food_id: 204, food_group: '당류', name: '설탕, 백설탕', kcal: 387, protein: 0, carbs: 99.8, fat: 0, sugar: 99.8, sodium: 1, fiber: 0 },
]

export type Ingredient = typeof ingredients[number] & { grams: number }

// ── 로직 2: 조리 가열 수율(Yield Factor) — 명세서 3장 기준 ──
const COOKING_METHODS = [
  { value: 'RAW', label: '생것 / 단순무침', yield: 1.0 },
  { value: 'BOIL', label: '국 / 탕 / 찌개', yield: 0.98 },
  { value: 'STIR', label: '볶음 / 조림', yield: 0.88 },
  { value: 'GRILL', label: '구이', yield: 0.82 },
  { value: 'FRY', label: '튀김', yield: 1.06 },
] as const

type CookingMethodCode = typeof COOKING_METHODS[number]['value']

// 메뉴젠 표준 템플릿 (명세서 5장 /api/v1/templates/menus 예시)
const TEMPLATES = [
  {
    template_id: 'TPL_01',
    menu_name: '제육볶음',
    default_servings: 1,
    default_method: 'STIR' as CookingMethodCode,
    ingredients: [
      { food_id: 1420, grams: 180 },
      { food_id: 352, grams: 15 },
      { food_id: 401, grams: 25 },
      { food_id: 204, grams: 15 },
    ],
  },
  {
    template_id: 'TPL_02',
    menu_name: '닭가슴살 간장 덮밥',
    default_servings: 1,
    default_method: 'STIR' as CookingMethodCode,
    ingredients: [
      { food_id: 1103, grams: 120 },
      { food_id: 352, grams: 12 },
      { food_id: 906, grams: 50 },
      { food_id: 101, grams: 150 },
    ],
  },
]

const DAILY_VALUE = { sodium: 2000, sugar: 100 } // 나트륨 mg / 당류 g 1일 기준치(표시용)
const WARNING_THRESHOLD = { sodium: 800, sugar: 20 } // 명세서 로직3: 1회 제공량 기준 경고 트리거

// ── 로직 4: 법적 보호 표준 면책조항 (명세서 3장 원문 그대로) ──
const DISCLAIMER_TEXT =
  "본 영양정보는 농촌진흥청 국가표준식품성분 DB 10.4 데이터를 기반으로 레시피 원재료 및 조리 수율을 환산하여 산출한 '외식 자율 영양표시 참고용' 정보입니다. 식품위생법상 완제품 가공식품의 법정 의무 시험성적서를 대체할 수 없습니다."

const STORAGE_KEY = 'nutridoctor:lastRecipe'

type SavedRecipe = {
  menu: string
  servings: number
  cookingMethod: CookingMethodCode
  added: Ingredient[]
}

// ── 로직 1+2: 재료 집계 · 단위환산 · 수율보정 엔진 ──
function calcNutrition(added: Ingredient[], servings: number, cookingMethod: CookingMethodCode) {
  const s = Math.max(servings, 1)
  const yieldFactor = COOKING_METHODS.find(m => m.value === cookingMethod)?.yield ?? 1
  const totals = added.reduce(
    (sum, item) => {
      const ratio = item.grams / 100
      return {
        kcal: sum.kcal + item.kcal * ratio,
        protein: sum.protein + item.protein * ratio,
        carbs: sum.carbs + item.carbs * ratio,
        fat: sum.fat + item.fat * ratio,
        sugar: sum.sugar + item.sugar * ratio,
        sodium: sum.sodium + item.sodium * ratio,
        fiber: sum.fiber + item.fiber * ratio,
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0 },
  )
  const perServing = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / s])) as typeof totals
  const rawWeight = added.reduce((sum, item) => sum + item.grams, 0)
  const cookedWeight = rawWeight * yieldFactor
  const cookedWeightPerServing = cookedWeight / s

  // 위험 성분 트리거 + 원인 식재료 탐색 (기여도 40% 이상)
  const warnings: { nutrient: 'sodium' | 'sugar'; value: number; dailyPct: number; mainCause: string | null }[] = []
  ;(['sodium', 'sugar'] as const).forEach(nutrient => {
    if (perServing[nutrient] >= WARNING_THRESHOLD[nutrient]) {
      const total = totals[nutrient] || 1
      const contributors = added.map(item => ({ name: item.name, ratio: (item[nutrient] * item.grams) / 100 / total }))
      const topContributor = contributors.reduce<{ name: string; ratio: number } | null>(
        (top, current) => (top === null || current.ratio > top.ratio ? current : top),
        null,
      )
      warnings.push({
        nutrient,
        value: perServing[nutrient],
        dailyPct: (perServing[nutrient] / DAILY_VALUE[nutrient]) * 100,
        mainCause: topContributor !== null && topContributor.ratio >= 0.4 ? topContributor.name : null,
      })
    }
  })

  return { totals, perServing, rawWeight, cookedWeight, cookedWeightPerServing, yieldFactor, warnings }
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground"><Leaf className="size-4" /></span>
      <span>바꿔드림 <span className="text-primary">Dream</span></span>
    </Link>
  )
}

export function Header() {
  return <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Logo /><nav className="hidden items-center gap-1 md:flex"><Link className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground" href="/label-maker">메뉴 자율 영양표시</Link><Link className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground" href="/remodeler">클린 레시피 리모델러</Link></nav><div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">내 보관함</Button><Button size="sm" className="rounded-full px-4">로그인</Button></div></div></header>
}

// common/DisclaimerBanner.tsx 상당 — 모든 출력물 하단 고정 바인딩 (로직4)
function DisclaimerBanner() {
  return <p className="mt-6 rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">{DISCLAIMER_TEXT}</p>
}

// common/Badge.tsx 상당 — 국산 농식품 상생 뱃지
function PartnerBadge() {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><Leaf className="size-3.5" /> 국산 농식품 상생 레시피 적용 매장</span>
}

export function HomePage() {
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pt-24"><section className="grid items-end gap-12 lg:grid-cols-[1.05fr_.95fr]"><div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"><Sparkles className="size-3.5" /> 소상공인을 위한 데이터 기반 영양관리</div><h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-.04em] text-foreground sm:text-6xl lg:text-7xl">외식 소상공인을 위한<br /><span className="text-primary">스마트 자율 영양관리</span> 솔루션</h1><p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">복잡한 영양 계산은 바꿔드림에 맡기고, 사장님은 더 건강한 메뉴와 고객 경험에 집중하세요.</p><div className="mt-8 flex flex-wrap gap-3"><Button render={<Link href="/label-maker" className="inline-flex items-center gap-2 whitespace-nowrap" />} size="lg" className="rounded-full px-6">무료로 시작하기<ArrowRight data-icon="inline-end" /></Button><Button render={<Link href="/remodeler" />} variant="outline" size="lg" className="rounded-full px-6">기능 둘러보기</Button></div></div><div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8"><div className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" /><div className="relative"><div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs text-muted-foreground">오늘의 메뉴 리포트</p><p className="mt-1 text-lg font-semibold">닭가슴살 간장 덮밥</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">분석 완료</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['412','kcal'],['31.4','단백질 g'],['8.2','당류 g'],['624','나트륨 mg']].map(([value,label]) => <div key={label} className="rounded-2xl bg-secondary p-4"><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}</div><div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="size-4" /> 건강한 메뉴 기준에 가까워요</div><p className="mt-2 text-sm leading-6 text-muted-foreground">나트륨은 1일 기준치의 31%로 관리되고 있습니다.</p></div></div></div></section><section className="mt-24"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-medium text-primary">바꿔드림 tools</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">메뉴를 더 건강하게, 더 쉽게</h2></div><p className="hidden text-sm text-muted-foreground sm:block">필요한 도구를 선택해 바로 시작하세요</p></div><div className="grid gap-5 lg:grid-cols-2"><FeatureCard href="/label-maker" icon={<Utensils />} eyebrow="01 / 영양표시" title="메뉴 자율 영양표시 카드 만들기" description="원재료를 입력하면 배달앱에 바로 쓸 수 있는 영양카드와 메뉴 문구를 생성합니다." tags={['실시간 계산','배달앱 문구']} /><FeatureCard href="/remodeler" icon={<Zap />} eyebrow="02 / 리모델링" title="클린 레시피 리모델러" description="고나트륨·고당 메뉴를 국산 농식품 대체재로 바꾸고, 전후 영양 변화를 한눈에 비교합니다." tags={['대체재 추천','절감 리포트']} /></div></section><div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> 농촌진흥청 국가표준식품성분 DB 10.4 기반 <span className="text-border">|</span> 식품 영양정보 참고용</div></main></div>
}

function FeatureCard({ href, icon, eyebrow, title, description, tags }: { href: string; icon: React.ReactNode; eyebrow: string; title: string; description: string; tags: string[] }) { return <Link href={href} className="group rounded-[1.75rem] border border-border bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg lg:p-9"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span><ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div><p className="mt-10 text-xs font-semibold uppercase tracking-[.16em] text-primary">{eyebrow}</p><h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3><p className="mt-3 max-w-lg leading-7 text-muted-foreground">{description}</p><div className="mt-7 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{tag}</span>)}</div></Link> }

function NutritionBar({ label, value, max, unit, tone = 'primary' }: { label: string; value: number; max: number; unit: string; tone?: 'primary' | 'warning' }) { return <div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value.toFixed(1)}{unit}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${tone === 'warning' ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${Math.min(value / max * 100, 100)}%` }} /></div></div> }

export function LabelMakerPage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [menu, setMenu] = useState('닭가슴살 간장 덮밥')
  const [servings, setServings] = useState(1)
  const [cookingMethod, setCookingMethod] = useState<CookingMethodCode>('STIR')
  const [added, setAdded] = useState<Ingredient[]>([
    { food_id: 1103, food_group: '육류', name: '닭가슴살', kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, sodium: 74, fiber: 0, grams: 120 },
    { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0, grams: 12 },
    { food_id: 906, food_group: '채소류', name: '양파', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, sugar: 4.2, sodium: 4, fiber: 1.7, grams: 50 },
  ])

  // ── TiDB 실시간 비동기 검색 (300ms 디바운스) ──
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.success) {
          // 이미 추가된 식재료는 검색 드롭다운에서 제외
          setSearchResults(data.items.filter((item: any) => !added.some(a => a.food_id === item.food_id)))
        }
      } catch (err) {
        console.error('검색 실패:', err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query, added])

  const add = (item: any) => {
    setAdded(current => [...current, { ...item, grams: 50 }])
    setQuery('')
    setSearchResults([])
  }

  const { perServing, cookedWeightPerServing, rawWeight, yieldFactor, warnings } = useMemo(
    () => calcNutrition(added, servings, cookingMethod),
    [added, servings, cookingMethod],
  )
  const hasWarning = warnings.length > 0

  const loadTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.template_id === templateId)
    if (!tpl) return
    setMenu(tpl.menu_name)
    setServings(tpl.default_servings)
    setCookingMethod(tpl.default_method)
    setAdded(tpl.ingredients.map(ing => {
      const base = ingredients.find(i => i.food_id === ing.food_id)!
      return { ...base, grams: ing.grams }
    }))
  }

  // 클린 레시피 리모델링으로 데이터 자동 인계 (명세서 6장 User Flow)
  const handoffToRemodeler = () => {
    const payload: SavedRecipe = { menu, servings, cookingMethod, added }
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch {}
  }

  const badge = (n: 'sodium' | 'sugar') => (perServing[n] >= WARNING_THRESHOLD[n] ? '⚠️ 기준치 초과' : '')

  const buildExportText = () =>
    [
      '[영양성분 안내 (자율 영양표시)]',
      `• 메뉴명: ${menu} (1인분 약 ${Math.round(cookedWeightPerServing)}g 기준)`,
      `• 열량: ${perServing.kcal.toFixed(0)} kcal`,
      `• 탄수화물: ${perServing.carbs.toFixed(1)}g | 단백질: ${perServing.protein.toFixed(1)}g | 지방: ${perServing.fat.toFixed(1)}g`,
      `• 당류: ${perServing.sugar.toFixed(1)}g ${badge('sugar')}`,
      `• 나트륨: ${perServing.sodium.toFixed(0)}mg ${badge('sodium')}`,
      '* 본 정보는 농촌진흥청 국가표준식품성분 DB 10.4 기준 산출치이며, 매장 조리 환경에 따라 차이가 있을 수 있습니다.',
    ].join('\n')

  const handleDownloadPng = async () => {
    const node = document.getElementById('exportable-nutrition-card')
    if (!node) return
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(node, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = `${menu || 'nutrition-card'}.png`
    link.href = dataUrl
    link.click()
  }

  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><PageIntro eyebrow="자율 영양표시 카드" title="메뉴 영양성분을 투명하게 보여주세요." description="원재료와 중량을 입력하면 1인분 기준 영양정보를 자동으로 계산합니다." />

    {hasWarning && <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-warning-foreground">주의가 필요한 영양성분이 있어요</p>{warnings.map(w => <p key={w.nutrient} className="mt-1 text-sm text-muted-foreground">{w.nutrient === 'sodium' ? '나트륨' : '당류'} {w.nutrient === 'sodium' ? w.value.toFixed(0) + 'mg' : w.value.toFixed(1) + 'g'} · 1일 기준치 {w.dailyPct.toFixed(0)}%{w.mainCause ? ` · 주요 원인: ${w.mainCause}` : ''} — 건강 레시피로 전환해 보세요.</p>)}</div><Button render={<Link href="/remodeler"/>} variant="outline" size="sm" onClick={handoffToRemodeler}>클린 레시피 리모델링으로 이어하기 <ArrowRight data-icon="inline-end" /></Button></div>}

    <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_140px_180px_220px]">
      <label className="flex flex-col gap-2 text-sm font-medium">메뉴명<input value={menu} onChange={e => setMenu(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className="flex flex-col gap-2 text-sm font-medium">인분수<input type="number" min={1} value={servings} onChange={e => setServings(Math.max(1, Number(e.target.value) || 1))} className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className="flex flex-col gap-2 text-sm font-medium">조리법<select value={cookingMethod} onChange={e => setCookingMethod(e.target.value as CookingMethodCode)} className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring">{COOKING_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <label className="flex flex-col gap-2 text-sm font-medium">메뉴젠 표준 레시피<select defaultValue="" onChange={e => e.target.value && loadTemplate(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring"><option value="" disabled>1초 템플릿 불러오기</option>{TEMPLATES.map(t => <option key={t.template_id} value={t.template_id}>{t.menu_name}</option>)}</select></label>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">식재료 입력</h2><span className="text-sm text-muted-foreground">{added.length}개 재료 · 원재료 총 {rawWeight}g</span></div>
        <div className="relative mt-5"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="식재료 검색 후 추가" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />{query && <div className="absolute left-0 right-0 top-12 z-10 rounded-xl border border-border bg-popover p-1 shadow-lg">{searchResults.map(item => <button key={item.food_id} onClick={() => add(item)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary"><span>{item.name}</span><Plus className="size-4 text-primary" /></button>)}{!searchResults.length && <p className="px-3 py-2 text-sm text-muted-foreground">검색 결과가 없습니다.</p>}</div>}</div>
        <div className="mt-5 flex flex-col gap-2">{added.map((item, index) => <div key={item.food_id} className="flex items-center gap-3 rounded-xl bg-secondary/70 p-3"><div className="min-w-0 flex-1"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">100g당 {item.kcal} kcal</p></div><input aria-label={`${item.name} 중량`} value={item.grams} onChange={e => setAdded(current => current.map((entry, i) => i === index ? { ...entry, grams: Number(e.target.value) || 0 } : entry))} className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm" /><span className="text-xs text-muted-foreground">g</span><button aria-label={`${item.name} 삭제`} onClick={() => setAdded(current => current.filter((_, i) => i !== index))} className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-destructive"><Trash2 className="size-4" /></button></div>)}</div>
      </section>

      <section id="exportable-nutrition-card" className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">1인분 영양성분</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">계산 완료</span></div>
        <p className="mt-2 text-xs text-muted-foreground">조리 후 1인분 제공량 약 {Math.round(cookedWeightPerServing)}g (원재료 {rawWeight}g × 수율계수 {yieldFactor.toFixed(2)} ÷ {servings}인분)</p>
        <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-primary p-4 text-primary-foreground"><p className="text-xs opacity-80">에너지</p><p className="mt-1 text-2xl font-semibold">{perServing.kcal.toFixed(0)} <small className="text-sm font-normal">kcal</small></p></div><div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">단백질</p><p className="mt-1 text-2xl font-semibold">{perServing.protein.toFixed(1)} <small className="text-sm font-normal">g</small></p></div></div>
        <div className="mt-6 flex flex-col gap-5">
          <NutritionBar label="탄수화물" value={perServing.carbs} max={324} unit="g" />
          <NutritionBar label="지방" value={perServing.fat} max={54} unit="g" />
          <NutritionBar label="당류" value={perServing.sugar} max={DAILY_VALUE.sugar} unit="g" tone={perServing.sugar >= WARNING_THRESHOLD.sugar ? 'warning' : 'primary'} />
          <NutritionBar label="나트륨" value={perServing.sodium} max={DAILY_VALUE.sodium} unit="mg" tone={perServing.sodium >= WARNING_THRESHOLD.sodium ? 'warning' : 'primary'} />
          <NutritionBar label="식이섬유" value={perServing.fiber} max={25} unit="g" />
        </div>
        <DisclaimerBanner />
      </section>
    </div>

    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button variant="outline" onClick={() => navigator.clipboard?.writeText(buildExportText())}><Clipboard data-icon="inline-start" /> 배달앱 문구 복사</Button>
      <Button onClick={handleDownloadPng}><Download data-icon="inline-start" /> 영양성분 카드 PNG 다운로드</Button>
    </div>
  </main></div>
}

export function RemodelerPage() {
  const [track, setTrack] = useState<'AFFORDABLE' | 'LOCAL_FARM'>('LOCAL_FARM')
  const [swaps, setSwaps] = useState({ syrup: true, soy: true })
  const [source, setSource] = useState<SavedRecipe | null>(null)

  // label-maker 화면에서 인계된 레시피 자동 불러오기 (명세서 6장 User Flow)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setSource(JSON.parse(raw))
    } catch {}
  }, [])

  const base = useMemo(() => {
    if (source) {
      const { perServing } = calcNutrition(source.added, source.servings, source.cookingMethod)
      return { kcal: perServing.kcal, sugar: perServing.sugar, sodium: perServing.sodium }
    }
    return { kcal: 612, sugar: 28, sodium: 1280 } // 데모 기본값 (인계 데이터 없을 때)
  }, [source])

  // 투-트랙 대체 식재료 매핑 룰 (명세서 3장 로직3 Rule Matrix 발췌 반영)
  const RULES = {
    syrup: {
      AFFORDABLE: { label: '물엿 → 시판 대체 감미 시럽', reason: '칼로리 대폭 차단(극단적 저당)', sugarMult: 0.3 },
      LOCAL_FARM: { label: '물엿 → 국산 양파당(양파 퓨레)', reason: '천연 단맛 + 퀘르세틴·식이섬유 보충', sugarMult: 0.5 },
    },
    soy: {
      AFFORDABLE: { label: '진간장 → 범용 저염간장(산분해 혼합)', reason: '나트륨 30% 단순 감량', sodiumMult: 0.7 },
      LOCAL_FARM: { label: '진간장 → 전통 한식간장 + 표고버섯가루', reason: '감칠맛(구아닐산) 보충으로 짠맛 만족도 유지, 나트륨 35% 감량', sodiumMult: 0.65 },
    },
  } as const

  const syrupRule = RULES.syrup[track]
  const soyRule = RULES.soy[track]

  const improved = {
    kcal: swaps.syrup ? Math.round(base.kcal * 0.88) : base.kcal,
    sugar: swaps.syrup ? +(base.sugar * syrupRule.sugarMult).toFixed(1) : base.sugar,
    sodium: swaps.soy ? Math.round(base.sodium * soyRule.sodiumMult) : base.sodium,
  }
  const sodiumReductionPct = Math.round((1 - improved.sodium / base.sodium) * 100)
  const sugarReductionPct = Math.round((1 - improved.sugar / base.sugar) * 100)
  const trackLabel = track === 'LOCAL_FARM' ? '국산 농식품 상생 대체' : '일반 가성비 대체'

  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
    <PageIntro eyebrow="클린 레시피 리모델러" title="익숙한 메뉴를 더 건강하게 바꿔보세요." description="대체재를 켜고 끄며 맛의 방향과 영양 변화를 함께 확인합니다." />
    {source && <p className="mb-4 text-sm text-muted-foreground">'{source.menu}' 레시피를 자율 영양표시 카드에서 불러왔습니다.</p>}

    <div className="mb-6 flex w-full max-w-xl rounded-xl bg-secondary p-1">
      <button onClick={() => setTrack('AFFORDABLE')} className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${track === 'AFFORDABLE' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}>🔘 일반 가성비 대체</button>
      <button onClick={() => setTrack('LOCAL_FARM')} className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${track === 'LOCAL_FARM' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}>🟢 국산 농식품 상생 대체</button>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <RecipePanel title="기존 레시피" tone="muted" kcal={base.kcal} sugar={base.sugar} sodium={base.sodium}>
        <RecipeRow original="물엿 30g" replacement="" />
        <RecipeRow original="진간장 25g" replacement="" />
        <RecipeRow original="닭가슴살 200g" replacement="" />
      </RecipePanel>
      <RecipePanel title="리모델링 레시피" tone="primary" kcal={improved.kcal} sugar={improved.sugar} sodium={improved.sodium}>
        <SwapRow label={syrupRule.label} reason={syrupRule.reason} active={swaps.syrup} onChange={() => setSwaps(s => ({ ...s, syrup: !s.syrup }))} />
        <SwapRow label={soyRule.label} reason={soyRule.reason} active={swaps.soy} onChange={() => setSwaps(s => ({ ...s, soy: !s.soy }))} />
        <RecipeRow original="닭가슴살 200g" replacement={track === 'LOCAL_FARM' ? '국산 닭가슴살' : ''} />
        {track === 'LOCAL_FARM' && (swaps.syrup || swaps.soy) && <div className="pt-1"><PartnerBadge /></div>}
      </RecipePanel>
    </div>

    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{trackLabel} 적용 결과</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">나트륨 {sodiumReductionPct}% 절감</span>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">당류 {sugarReductionPct}% 절감</span>
          </div>
        </div>
        <Button><Download data-icon="inline-start" /> 개선된 영양카드 다운로드</Button>
      </div>
    </div>
    <DisclaimerBanner />
  </main></div>
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-10"><p className="text-sm font-medium text-primary">{eyebrow}</p><h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1><p className="mt-4 text-muted-foreground">{description}</p></div> }
function RecipePanel({ title, tone, kcal, sugar, sodium, children }: { title: string; tone: 'muted' | 'primary'; kcal: number; sugar: number; sodium: number; children: React.ReactNode }) { return <section className={`rounded-2xl border p-5 ${tone === 'primary' ? 'border-primary/30 bg-card' : 'border-border bg-secondary/30'}`}><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2>{tone === 'primary' && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">개선안</span>}</div><div className="mt-5 flex flex-col gap-2">{children}</div><div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5"><Metric label="칼로리" value={`${Math.round(kcal)}kcal`} /><Metric label="당류" value={`${sugar.toFixed(1)}g`} warning={sugar >= WARNING_THRESHOLD.sugar} /><Metric label="나트륨" value={`${Math.round(sodium)}mg`} warning={sodium >= WARNING_THRESHOLD.sodium} /></div></section> }
function RecipeRow({ original, replacement }: { original: string; replacement: string }) { return <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm"><span>{original}</span>{replacement && <span className="text-primary">{replacement}</span>}</div> }
function SwapRow({ label, reason, active, onChange }: { label: string; reason: string; active: boolean; onChange: () => void }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3 text-sm"><div className="min-w-0"><p>{label}</p><p className="mt-0.5 text-xs text-muted-foreground">{reason}</p></div><button role="switch" aria-checked={active} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition ${active ? 'left-6' : 'left-1'}`} /></button></div> }
function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 font-semibold ${warning ? 'text-warning-foreground' : ''}`}>{value}</p></div> }