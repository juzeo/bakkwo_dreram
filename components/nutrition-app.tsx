'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Clipboard, Download, Edit3, Leaf, LogOut, Plus, Save, Search, ShieldCheck, Sparkles, Trash2, User, Utensils, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CookingMethodCode = 'RAW' | 'BOIL' | 'STIR' | 'GRILL' | 'FRY'

export const COOKING_METHODS: { value: CookingMethodCode; label: string; yield: number }[] = [
  { value: 'RAW', label: '생것 / 단순무침', yield: 1.0 },
  { value: 'BOIL', label: '국 / 탕 / 찌개', yield: 0.98 },
  { value: 'STIR', label: '볶음 / 조림', yield: 0.88 },
  { value: 'GRILL', label: '구이', yield: 0.82 },
  { value: 'FRY', label: '튀김', yield: 1.06 },
]

export type Ingredient = {
  food_id: number
  food_group: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  sodium: number
  fiber: number
  grams: number
  cookingMethod: CookingMethodCode
}

const TEMPLATES = [
  {
    template_id: 'TPL_01',
    menu_name: '제육볶음',
    default_servings: 1,
    default_method: 'STIR' as CookingMethodCode,
    ingredients: [
      { food_id: 1420, food_group: '육류 및 그 제품', name: '돼지고기, 앞다리, 생것', kcal: 223, protein: 18.6, carbs: 0, fat: 16, sugar: 0, sodium: 57, fiber: 0, grams: 180, cookingMethod: 'STIR' as CookingMethodCode },
      { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0, grams: 15, cookingMethod: 'STIR' as CookingMethodCode },
      { food_id: 401, food_group: '조미료류', name: '고추장, 혼합', kcal: 225, protein: 5.6, carbs: 44, fat: 2.4, sugar: 16, sodium: 2000, fiber: 4.2, grams: 25, cookingMethod: 'STIR' as CookingMethodCode },
      { food_id: 204, food_group: '당류', name: '설탕, 백설탕', kcal: 387, protein: 0, carbs: 99.8, fat: 0, sugar: 99.8, sodium: 1, fiber: 0, grams: 15, cookingMethod: 'STIR' as CookingMethodCode },
    ],
  },
  {
    template_id: 'TPL_02',
    menu_name: '닭가슴살 간장 덮밥',
    default_servings: 1,
    default_method: 'STIR' as CookingMethodCode,
    ingredients: [
      { food_id: 1103, food_group: '육류 및 그 제품', name: '닭가슴살', kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, sodium: 74, fiber: 0, grams: 120, cookingMethod: 'STIR' as CookingMethodCode },
      { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0, grams: 12, cookingMethod: 'STIR' as CookingMethodCode },
      { food_id: 906, food_group: '채소류', name: '양파', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, sugar: 4.2, sodium: 4, fiber: 1.7, grams: 50, cookingMethod: 'STIR' as CookingMethodCode },
      { food_id: 101, food_group: '곡류 및 그 제품', name: '쌀밥', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1, sodium: 1, fiber: 0.3, grams: 150, cookingMethod: 'RAW' as CookingMethodCode },
    ],
  },
]

const DAILY_VALUE = { sodium: 2000, sugar: 100 }
const WARNING_THRESHOLD = { sodium: 800, sugar: 20 }
const DISCLAIMER_TEXT =
  "본 영양정보는 농촌진흥청 국가표준식품성분 DB 10.4 데이터를 기반으로 레시피 원재료 및 조리 수율을 환산하여 산출한 '외식 자율 영양표시 참고용' 정보입니다. 식품위생법상 완제품 가공식품의 법정 의무 시험성적서를 대체할 수 없습니다."
const STORAGE_KEY = 'nutridoctor:lastRecipe'
const RECIPES_KEY = 'nutridoctor:savedRecipes' // 내 보관함 — 저장된 레시피 목록
const AUTH_KEY = 'nutridoctor:auth' // 임시 로컬 세션 (실 서비스에서는 TiDB users 테이블 + 서버 인증으로 교체 예정)

type SavedRecipe = {
  menu: string
  servings: number
  cookingMethod: CookingMethodCode
  added: Ingredient[]
}

type SavedRecipeEntry = SavedRecipe & {
  id: string
  savedAt: number
  summary: { kcal: number; sugar: number; sodium: number }
}

function readSavedRecipes(): SavedRecipeEntry[] {
  try {
    const raw = window.localStorage.getItem(RECIPES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeSavedRecipes(list: SavedRecipeEntry[]) {
  try {
    window.localStorage.setItem(RECIPES_KEY, JSON.stringify(list))
  } catch {}
}

// 임시 로컬 인증 훅 — TODO: TiDB 연동 시 /api/auth/* 서버 라우트로 교체
function useAuth() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_KEY)
      if (raw) setEmail(JSON.parse(raw).email)
    } catch {}
  }, [])

  const login = (nextEmail: string) => {
    try { window.localStorage.setItem(AUTH_KEY, JSON.stringify({ email: nextEmail })) } catch {}
    setEmail(nextEmail)
  }

  const logout = () => {
    try { window.localStorage.removeItem(AUTH_KEY) } catch {}
    setEmail(null)
  }

  return { email, login, logout }
}

// ── 로직 1+2: 재료별 수율(Yield Factor) 개별 정밀 계산 엔진 ──
function calcNutrition(added: Ingredient[], servings: number) {
  const s = Math.max(servings, 1)

  const totals = added.reduce(
    (sum, item) => {
      const ratio = (Number(item.grams) || 0) / 100
      return {
        kcal: sum.kcal + (Number(item.kcal) || 0) * ratio,
        protein: sum.protein + (Number(item.protein) || 0) * ratio,
        carbs: sum.carbs + (Number(item.carbs) || 0) * ratio,
        fat: sum.fat + (Number(item.fat) || 0) * ratio,
        sugar: sum.sugar + (Number(item.sugar) || 0) * ratio,
        sodium: sum.sodium + (Number(item.sodium) || 0) * ratio,
        fiber: sum.fiber + (Number(item.fiber) || 0) * ratio,
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 0, fiber: 0 },
  )

  const perServing = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / s])) as typeof totals
  const rawWeight = added.reduce((sum, item) => sum + (Number(item.grams) || 0), 0)

  const cookedWeight = added.reduce((sum, item) => {
    const factor = COOKING_METHODS.find(m => m.value === item.cookingMethod)?.yield ?? 1.0
    return sum + (Number(item.grams) || 0) * factor
  }, 0)

  const cookedWeightPerServing = cookedWeight / s
  const averageYieldFactor = rawWeight > 0 ? cookedWeight / rawWeight : 1.0

  const warnings: { nutrient: 'sodium' | 'sugar'; value: number; dailyPct: number; mainCause: string | null }[] = []
  ;(['sodium', 'sugar'] as const).forEach(nutrient => {
    if (perServing[nutrient] >= WARNING_THRESHOLD[nutrient]) {
      const total = totals[nutrient] || 1
      const contributors = added.map(item => ({
        name: item.name,
        ratio: ((Number(item[nutrient]) || 0) * (Number(item.grams) || 0)) / 100 / total,
      }))
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

  return { totals, perServing, rawWeight, cookedWeight, cookedWeightPerServing, yieldFactor: averageYieldFactor, warnings }
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
  const { email, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          <Link className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground" href="/label-maker">
            메뉴 자율 영양표시
          </Link>
          <Link className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground" href="/remodeler">
            클린 레시피 리모델러
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/storage" />} variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">내 보관함</Button>
          {email ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex"><User className="size-4" />{email}</span>
              <Button variant="outline" size="sm" className="rounded-full px-4" onClick={logout}><LogOut data-icon="inline-start" />로그아웃</Button>
            </div>
          ) : (
            <Button render={<Link href="/login" />} size="sm" className="rounded-full px-4">로그인</Button>
          )}
        </div>
      </div>
    </header>
  )
}

function DisclaimerBanner() {
  return <p className="mt-6 rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">{DISCLAIMER_TEXT}</p>
}

function PartnerBadge() {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><Leaf className="size-3.5" /> 국산 농식품 상생 레시피 적용 매장</span>
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pt-24">
        <section className="grid items-end gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> 소상공인을 위한 데이터 기반 영양관리
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-.04em] text-foreground sm:text-6xl lg:text-7xl">
              외식 소상공인을 위한<br /><span className="text-primary">스마트 자율 영양관리</span> 솔루션
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              복잡한 영양 계산은 바꿔드림에 맡기고, 사장님은 더 건강한 메뉴와 고객 경험에 집중하세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/label-maker" className="inline-flex items-center gap-2 whitespace-nowrap" />} size="lg" className="rounded-full px-6">
                무료로 시작하기<ArrowRight data-icon="inline-end" />
              </Button>
              <Button render={<Link href="/remodeler" />} variant="outline" size="lg" className="rounded-full px-6">
                기능 둘러보기
              </Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm lg:p-8">
            <div className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs text-muted-foreground">오늘의 메뉴 리포트</p>
                  <p className="mt-1 text-lg font-semibold">닭가슴살 간장 덮밥</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">분석 완료</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['412', 'kcal'], ['31.4', '단백질 g'], ['8.2', '당류 g'], ['624', '나트륨 mg']].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-secondary p-4">
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <ShieldCheck className="size-4" /> 건강한 메뉴 기준에 가까워요
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">나트륨은 1일 기준치의 31%로 관리되고 있습니다.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-primary">바꿔드림 tools</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">메뉴를 더 건강하게, 더 쉽게</h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">필요한 도구를 선택해 바로 시작하세요</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <FeatureCard href="/label-maker" icon={<Utensils />} eyebrow="01 / 영양표시" title="메뉴 자율 영양표시 카드 만들기" description="원재료를 입력하면 배달앱에 바로 쓸 수 있는 영양카드와 메뉴 문구를 생성합니다." tags={['실시간 계산', '배달앱 문구']} />
            <FeatureCard href="/remodeler" icon={<Zap />} eyebrow="02 / 리모델링" title="클린 레시피 리모델러" description="고나트륨·고당 메뉴를 국산 농식품 대체재로 바꾸고, 전후 영양 변화를 한눈에 비교합니다." tags={['대체재 추천', '절감 리포트']} />
          </div>
        </section>
        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" /> 농촌진흥청 국가표준식품성분 DB 10.4 기반 <span className="text-border">|</span> 식품 영양정보 참고용
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ href, icon, eyebrow, title, description, tags }: { href: string; icon: React.ReactNode; eyebrow: string; title: string; description: string; tags: string[] }) {
  return (
    <Link href={href} className="group rounded-[1.75rem] border border-border bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg lg:p-9">
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
        <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[.16em] text-primary">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 max-w-lg leading-7 text-muted-foreground">{description}</p>
      <div className="mt-7 flex flex-wrap gap-2">
        {tags.map(tag => <span key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{tag}</span>)}
      </div>
    </Link>
  )
}

function NutritionBar({ label, value, max, unit, tone = 'primary' }: { label: string; value: number; max: number; unit: string; tone?: 'primary' | 'warning' }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${tone === 'warning' ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  )
}

export function LabelMakerPage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [menu, setMenu] = useState('닭가슴살 간장 덮밥')
  const [servings, setServings] = useState(1)
  const [defaultMethod, setDefaultMethod] = useState<CookingMethodCode>('STIR')
  const [added, setAdded] = useState<Ingredient[]>([
    { food_id: 1103, food_group: '육류 및 그 제품', name: '닭가슴살', kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, sodium: 74, fiber: 0, grams: 120, cookingMethod: 'STIR' },
    { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0, grams: 12, cookingMethod: 'STIR' },
    { food_id: 906, food_group: '채소류', name: '양파', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, sugar: 4.2, sodium: 4, fiber: 1.7, grams: 50, cookingMethod: 'STIR' },
    { food_id: 101, food_group: '곡류 및 그 제품', name: '쌀밥', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1, sodium: 1, fiber: 0.3, grams: 150, cookingMethod: 'RAW' },
  ])

  // 직접 입력 재료 영양성분 편집 상태
  const [editingCustomItem, setEditingCustomItem] = useState<Ingredient | null>(null)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const weightInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        if (data.success && Array.isArray(data.items)) {
          const available = data.items.filter(
            (item: any) => !added.some(a => a.food_id === item.food_id || a.name === item.name)
          )
          setSearchResults(available)
        } else {
          setSearchResults([])
        }
      } catch (err) {
        console.error('검색 API 호출 실패:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, added])

  const calculateDefaultGrams = (group: string) => {
    if (group.includes('조미료') || group.includes('당류') || group.includes('유지')) return 15
    if (group.includes('곡류') || group.includes('육류')) return 150
    return 50
  }

  const add = (item: any) => {
    const defaultGrams = calculateDefaultGrams(item.food_group || '')
    const newIngredient: Ingredient = {
      food_id: Number(item.food_id),
      food_group: String(item.food_group || '기타'),
      name: String(item.name),
      kcal: Number(item.kcal) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      sugar: Number(item.sugar) || 0,
      sodium: Number(item.sodium) || 0,
      fiber: Number(item.fiber) || 0,
      grams: defaultGrams,
      cookingMethod: defaultMethod,
    }

    setAdded(current => [newIngredient, ...current])
    setQuery('')
    setSearchResults([])

    setTimeout(() => {
      const inputEl = weightInputRefs.current[newIngredient.food_id]
      if (inputEl) {
        inputEl.focus()
        inputEl.select()
      }
    }, 50)
  }

  // 직접 입력 재료 추가
  const addCustomIngredient = (customName: string) => {
    const trimmed = customName.trim()
    if (!trimmed) return

    const customItem: Ingredient = {
      food_id: -Date.now(),
      food_group: '직접입력',
      name: trimmed,
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,
      sodium: 0,
      fiber: 0,
      grams: 50,
      cookingMethod: defaultMethod,
    }

    setAdded(current => [customItem, ...current])
    setQuery('')
    setSearchResults([])

    setTimeout(() => {
      const inputEl = weightInputRefs.current[customItem.food_id]
      if (inputEl) {
        inputEl.focus()
        inputEl.select()
      }
    }, 50)
  }

  // 직접 입력 재료의 영양성분 갱신
  const updateCustomItemNutrients = (
    foodId: number,
    fields: Partial<Pick<Ingredient, 'kcal' | 'protein' | 'carbs' | 'fat' | 'sugar' | 'sodium' | 'fiber' | 'name'>>
  ) => {
    setAdded(current =>
      current.map(item => (item.food_id === foodId ? { ...item, ...fields } : item))
    )
  }

  const { perServing, cookedWeight, cookedWeightPerServing, rawWeight, yieldFactor, warnings } = useMemo(
    () => calcNutrition(added, servings),
    [added, servings],
  )
  const hasWarning = warnings.length > 0

  const loadTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find(t => t.template_id === templateId)
    if (!tpl) return
    setMenu(tpl.menu_name)
    setServings(tpl.default_servings)
    setDefaultMethod(tpl.default_method)
    setAdded(tpl.ingredients)
  }

  const handoffToRemodeler = () => {
    const payload: SavedRecipe = { menu, servings, cookingMethod: defaultMethod, added }
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch {}
  }

  const [justSaved, setJustSaved] = useState(false)
  const saveRecipe = () => {
    const entry: SavedRecipeEntry = {
      id: `${Date.now()}`,
      menu,
      servings,
      cookingMethod: defaultMethod,
      added,
      savedAt: Date.now(),
      summary: { kcal: perServing.kcal, sugar: perServing.sugar, sodium: perServing.sodium },
    }
    writeSavedRecipes([entry, ...readSavedRecipes()])
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <PageIntro eyebrow="자율 영양표시 카드" title="메뉴 영양성분을 투명하게 보여주세요." description="원재료와 중량을 입력하면 1인분 기준 영양정보를 자동으로 계산합니다." />

        {hasWarning && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-warning-foreground">주의가 필요한 영양성분이 있어요</p>
              {warnings.map(w => (
                <p key={w.nutrient} className="mt-1 text-sm text-muted-foreground">
                  {w.nutrient === 'sodium' ? '나트륨' : '당류'} {w.nutrient === 'sodium' ? w.value.toFixed(0) + 'mg' : w.value.toFixed(1) + 'g'} · 1일 기준치 {w.dailyPct.toFixed(0)}%{w.mainCause ? ` · 주요 원인: ${w.mainCause}` : ''} — 건강 레시피로 전환해 보세요.
                </p>
              ))}
            </div>
            <Button render={<Link href="/remodeler" />} variant="outline" size="sm" onClick={handoffToRemodeler}>
              클린 레시피 리모델링으로 이어하기 <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        )}

        <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_130px_200px_200px]">
          <label className="flex flex-col gap-2 text-sm font-medium">
            메뉴명
            <input value={menu} onChange={e => setMenu(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            인분수
            <input type="number" min={1} value={servings} onChange={e => setServings(Math.max(1, Number(e.target.value) || 1))} className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            기본 조리법 (일괄 변경)
            <select
              value={defaultMethod}
              onChange={e => {
                const method = e.target.value as CookingMethodCode
                setDefaultMethod(method)
                setAdded(current => current.map(item => ({ ...item, cookingMethod: method })))
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              {COOKING_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            메뉴젠 표준 레시피
            <select defaultValue="" onChange={e => e.target.value && loadTemplate(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring text-sm">
              <option value="" disabled>1초 템플릿 불러오기</option>
              {TEMPLATES.map(t => <option key={t.template_id} value={t.template_id}>{t.menu_name}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">식재료 입력</h2>
              <span className="text-sm text-muted-foreground">{added.length}개 재료 · 원재료 총 {rawWeight}g</span>
            </div>

            {/* 메인 검색 입력창 */}
            <div className="relative mt-5">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="식재료 검색 (예: 닭, 양파, 간장, 고추장)"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

              {query.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-50 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl backdrop-blur">
                  {isSearching ? (
                    <p className="px-3 py-3 text-center text-sm text-muted-foreground animate-pulse">식품 DB 검색 중...</p>
                  ) : (
                    <>
                      {searchResults.map(item => (
                        <button
                          key={item.food_id}
                          type="button"
                          onClick={() => add(item)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-secondary"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-foreground">{item.name}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              [{item.food_group}] 100g당 {item.kcal}kcal · 단백질 {item.protein}g · 나트륨 {item.sodium}mg
                            </div>
                          </div>
                          <Plus className="size-4 shrink-0 text-primary" />
                        </button>
                      ))}

                      {/* 사용자 임의 재료 직접 추가 */}
                      <button
                        type="button"
                        onClick={() => addCustomIngredient(query)}
                        className="flex w-full items-center justify-between rounded-lg border-t border-border/60 px-3 py-2.5 text-left text-sm text-primary hover:bg-primary/5 mt-1"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-medium">"{query.trim()}"</span>
                          <span className="ml-1.5 text-xs text-muted-foreground">(직접 입력 재료로 추가)</span>
                        </div>
                        <Plus className="size-4 shrink-0 text-primary" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 재료 리스트 */}
            <div className="mt-5 flex flex-col gap-2.5">
              {added.map((item, index) => (
                <div key={`${item.food_id}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/70 p-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium truncate">{item.name}</p>
                      {item.food_id < 0 && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary shrink-0">
                          직접입력
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">
                        [{item.food_group}] 100g당 {item.kcal} kcal · 나트륨 {item.sodium}mg · 당류 {item.sugar}g
                      </p>
                      {item.food_id < 0 && (
                        <button
                          type="button"
                          onClick={() => setEditingCustomItem({ ...item })}
                          className="flex items-center gap-0.5 text-xs text-primary underline underline-offset-2 hover:opacity-80 transition"
                        >
                          <Edit3 className="size-3" /> 영양성분 입력/수정
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.cookingMethod}
                      onChange={e => {
                        const method = e.target.value as CookingMethodCode
                        setAdded(current => current.map((entry, i) => (i === index ? { ...entry, cookingMethod: method } : entry)))
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    >
                      {COOKING_METHODS.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.label} ({m.yield}x)
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <input
                        ref={el => { weightInputRefs.current[item.food_id] = el }}
                        type="number"
                        min={0}
                        aria-label={`${item.name} 중량`}
                        value={item.grams === 0 ? '' : item.grams}
                        onChange={e => {
                          const val = Number(e.target.value) || 0
                          setAdded(current => current.map((entry, i) => (i === index ? { ...entry, grams: val } : entry)))
                        }}
                        className="h-9 w-16 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">g</span>
                    </div>

                    <button
                      aria-label={`${item.name} 삭제`}
                      onClick={() => setAdded(current => current.filter((_, i) => i !== index))}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-destructive transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 목록 하단 보조 추가 버튼 (상단 검색창 자동 포커스 이동) */}
              <button
                type="button"
                onClick={() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.focus()
                    searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:bg-secondary/40 hover:text-foreground"
              >
                <Plus className="size-3.5" /> 식재료 추가하기
              </button>
            </div>
          </section>

          <section id="exportable-nutrition-card" className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">1인분 영양성분</h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">계산 완료</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              조리 후 1인분 약 {Math.round(cookedWeightPerServing)}g (원재료 총 {rawWeight}g × 평균 수율 {yieldFactor.toFixed(2)} → 조리완제품 총 {Math.round(cookedWeight)}g ÷ {servings}인분)
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary p-4 text-primary-foreground">
                <p className="text-xs opacity-80">칼로리</p>
                <p className="mt-1 text-2xl font-semibold">{perServing.kcal.toFixed(0)} <small className="text-sm font-normal">kcal</small></p>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">단백질</p>
                <p className="mt-1 text-2xl font-semibold">{perServing.protein.toFixed(1)} <small className="text-sm font-normal">g</small></p>
              </div>
            </div>
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

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {justSaved && <span className="text-sm font-medium text-primary">보관함에 저장했어요 ✓</span>}
          <Button variant="outline" onClick={saveRecipe}>
            <Save data-icon="inline-start" /> 레시피 저장함에 저장
          </Button>
          <Button variant="outline" onClick={() => navigator.clipboard?.writeText(buildExportText())}>
            <Clipboard data-icon="inline-start" /> 배달앱 문구 복사
          </Button>
          <Button onClick={handleDownloadPng}>
            <Download data-icon="inline-start" /> 영양성분 카드 PNG 다운로드
          </Button>
        </div>

        {/* 직접 입력 식재료 100g당 영양성분 수정 팝업 모달 */}
        {editingCustomItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                setEditingCustomItem(null)
              }
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">재료 영양성분 직접 입력</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">100g 기준 함량을 입력해주세요 (Enter 키로 완료)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCustomItem(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  setEditingCustomItem(null)
                }}
                className="mt-4 flex flex-col gap-3"
              >
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  재료 이름
                  <input
                    value={editingCustomItem.name}
                    onChange={e => {
                      const name = e.target.value
                      setEditingCustomItem(prev => prev ? { ...prev, name } : null)
                      updateCustomItemNutrients(editingCustomItem.food_id, { name })
                    }}
                    className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                    열량 (kcal)
                    <input
                      type="number"
                      min={0}
                      value={editingCustomItem.kcal || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditingCustomItem(prev => prev ? { ...prev, kcal: val } : null)
                        updateCustomItemNutrients(editingCustomItem.food_id, { kcal: val })
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                    나트륨 (mg)
                    <input
                      type="number"
                      min={0}
                      value={editingCustomItem.sodium || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditingCustomItem(prev => prev ? { ...prev, sodium: val } : null)
                        updateCustomItemNutrients(editingCustomItem.food_id, { sodium: val })
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                    당류 (g)
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={editingCustomItem.sugar || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditingCustomItem(prev => prev ? { ...prev, sugar: val } : null)
                        updateCustomItemNutrients(editingCustomItem.food_id, { sugar: val })
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                    단백질 (g)
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={editingCustomItem.protein || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditingCustomItem(prev => prev ? { ...prev, protein: val } : null)
                        updateCustomItemNutrients(editingCustomItem.food_id, { protein: val })
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                    탄수화물 (g)
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={editingCustomItem.carbs || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditingCustomItem(prev => prev ? { ...prev, carbs: val } : null)
                        updateCustomItemNutrients(editingCustomItem.food_id, { carbs: val })
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                    지방 (g)
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={editingCustomItem.fat || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditingCustomItem(prev => prev ? { ...prev, fat: val } : null)
                        updateCustomItemNutrients(editingCustomItem.food_id, { fat: val })
                      }}
                      className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button type="submit" className="w-full sm:w-auto px-6">
                    입력 완료 (Enter)
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export function RemodelerPage() {
  const [track, setTrack] = useState<'AFFORDABLE' | 'LOCAL_FARM'>('LOCAL_FARM')
  const [swaps, setSwaps] = useState({ syrup: true, soy: true })
  const [source, setSource] = useState<SavedRecipe | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setSource(JSON.parse(raw))
    } catch {}
  }, [])

  const base = useMemo(() => {
    if (source) {
      const { perServing } = calcNutrition(source.added, source.servings)
      return { kcal: perServing.kcal, sugar: perServing.sugar, sodium: perServing.sodium }
    }
    return { kcal: 612, sugar: 28, sodium: 1280 }
  }, [source])

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

  const handleDownloadRemodelPng = async () => {
    const node = document.getElementById('exportable-remodel-card')
    if (!node) return
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(node, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = `${source?.menu || 'remodeled-recipe'}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <PageIntro eyebrow="클린 레시피 리모델러" title="익숙한 메뉴를 더 건강하게 바꿔보세요." description="대체재를 켜고 끄며 맛의 방향과 영양 변화를 함께 확인합니다." />
        {source && <p className="mb-4 text-sm text-muted-foreground">'{source.menu}' 레시피를 자율 영양표시 카드에서 불러왔습니다.</p>}

        <div className="mb-6 flex w-full max-w-xl rounded-xl bg-secondary p-1">
          <button onClick={() => setTrack('AFFORDABLE')} className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${track === 'AFFORDABLE' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}>
            🔘 일반 가성비 대체
          </button>
          <button onClick={() => setTrack('LOCAL_FARM')} className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${track === 'LOCAL_FARM' ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground'}`}>
            🟢 국산 농식품 상생 대체
          </button>
        </div>

        <div id="exportable-remodel-card">
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
            </div>
          </div>
          <DisclaimerBanner />
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleDownloadRemodelPng}><Download data-icon="inline-start" /> 개선된 영양카드 다운로드</Button>
        </div>
      </main>
    </div>
  )
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-10">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-muted-foreground">{description}</p>
    </div>
  )
}

function RecipePanel({ title, tone, kcal, sugar, sodium, children }: { title: string; tone: 'muted' | 'primary'; kcal: number; sugar: number; sodium: number; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border p-5 ${tone === 'primary' ? 'border-primary/30 bg-card' : 'border-border bg-secondary/30'}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {tone === 'primary' && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">개선안</span>}
      </div>
      <div className="mt-5 flex flex-col gap-2">{children}</div>
      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">
        <Metric label="칼로리" value={`${Math.round(kcal)}kcal`} />
        <Metric label="당류" value={`${sugar.toFixed(1)}g`} warning={sugar >= WARNING_THRESHOLD.sugar} />
        <Metric label="나트륨" value={`${Math.round(sodium)}mg`} warning={sodium >= WARNING_THRESHOLD.sodium} />
      </div>
    </section>
  )
}

function RecipeRow({ original, replacement }: { original: string; replacement: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm">
      <span>{original}</span>
      {replacement && <span className="text-primary">{replacement}</span>}
    </div>
  )
}

function SwapRow({ label, reason, active, onChange }: { label: string; reason: string; active: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3 text-sm">
      <div className="min-w-0">
        <p>{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>
      </div>
      <button
        role="switch"
        aria-checked={active}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold ${warning ? 'text-warning-foreground' : ''}`}>{value}</p>
    </div>
  )
}

export function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    // TODO: TiDB users 테이블 + 서버 인증 API 연동 전까지는 로컬 세션만 생성합니다.
    login(email.trim())
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-md px-5 py-16 lg:px-0">
        <PageIntro eyebrow="로그인" title="다시 오셨네요." description="저장한 레시피와 영양표시 기록을 이어서 관리하세요." />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <label className="flex flex-col gap-2 text-sm font-medium">
            이메일
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="owner@restaurant.com"
              className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-lg border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="mt-2 w-full">로그인</Button>
          <p className="text-center text-xs text-muted-foreground">
            아직 계정이 없으신가요? <span className="text-primary underline underline-offset-2">회원가입 (준비 중)</span>
          </p>
        </form>
      </main>
    </div>
  )
}

export function StoragePage() {
  const [recipes, setRecipes] = useState<SavedRecipeEntry[]>([])

  useEffect(() => {
    setRecipes(readSavedRecipes())
  }, [])

  const remove = (id: string) => {
    const next = recipes.filter(r => r.id !== id)
    setRecipes(next)
    writeSavedRecipes(next)
  }

  const loadToLabelMaker = (recipe: SavedRecipeEntry) => {
    const payload: SavedRecipe = { menu: recipe.menu, servings: recipe.servings, cookingMethod: recipe.cookingMethod, added: recipe.added }
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <PageIntro eyebrow="내 보관함" title="저장한 레시피를 한눈에 확인하세요." description="자율 영양표시 카드에서 저장한 레시피를 다시 불러오거나 삭제할 수 있습니다." />

        {recipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            아직 저장한 레시피가 없어요. '메뉴 자율 영양표시' 화면에서 '레시피 저장함에 저장'을 눌러보세요.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map(recipe => (
              <div key={recipe.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{recipe.menu}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(recipe.savedAt).toLocaleDateString('ko-KR')} 저장 · {recipe.servings}인분
                    </p>
                  </div>
                  <button aria-label="삭제" onClick={() => remove(recipe.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">칼로리</p>
                    <p className="mt-1 text-sm font-semibold">{Math.round(recipe.summary.kcal)}kcal</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">당류</p>
                    <p className="mt-1 text-sm font-semibold">{recipe.summary.sugar.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">나트륨</p>
                    <p className="mt-1 text-sm font-semibold">{Math.round(recipe.summary.sodium)}mg</p>
                  </div>
                </div>
                <Button
                  render={<Link href="/label-maker" />}
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => loadToLabelMaker(recipe)}
                >
                  불러오기
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}