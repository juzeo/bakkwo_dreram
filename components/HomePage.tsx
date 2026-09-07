import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles, Utensils, Zap } from 'lucide-react'
import { GNB } from '@/components/common/GNB'

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
      <div className="mt-7 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">{tag}</span>)}</div>
    </Link>
  )
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <GNB />
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
              <Link href="/label-maker" className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">
                무료로 시작하기<ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/remodeler" className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-background px-6 text-sm font-medium">
                기능 둘러보기
              </Link>
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
                <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="size-4" /> 건강한 메뉴 기준에 가까워요</div>
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
