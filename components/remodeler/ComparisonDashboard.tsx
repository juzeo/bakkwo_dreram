import { WARNING_THRESHOLD, type MatchedRule, type Track } from '@/lib/nutrition'
import { PartnerBadge } from '@/components/common/Badge'
import { IngredientSubstituteRow } from './IngredientSubstituteRow'

function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold ${warning ? 'text-warning-foreground' : ''}`}>{value}</p>
    </div>
  )
}

function Panel({ title, tone, kcal, sugar, sodium, children }: {
  title: string; tone: 'muted' | 'primary'; kcal: number; sugar: number; sodium: number; children: React.ReactNode
}) {
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

export function ComparisonDashboard({
  originalKcal, originalSugar, originalSodium,
  improvedKcal, improvedSugar, improvedSodium,
  matches, enabledRuleIds, onToggleRule, track,
}: {
  originalKcal: number; originalSugar: number; originalSodium: number
  improvedKcal: number; improvedSugar: number; improvedSodium: number
  matches: MatchedRule[]
  enabledRuleIds: Set<string>
  onToggleRule: (ruleId: string) => void
  track: Track
}) {
  const anyActive = matches.some(m => enabledRuleIds.has(m.rule.id))

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="기존 레시피" tone="muted" kcal={originalKcal} sugar={originalSugar} sodium={originalSodium}>
        {matches.length === 0 && <p className="rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">대체 가능한 위험 성분 재료가 감지되지 않았어요.</p>}
        {matches.map(({ rule, matchedItem }) => (
          <div key={rule.id} className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">
            <span>{matchedItem.name} {matchedItem.grams}g</span>
            <span className="text-xs">{rule.category}</span>
          </div>
        ))}
      </Panel>
      <Panel title="리모델링 레시피" tone="primary" kcal={improvedKcal} sugar={improvedSugar} sodium={improvedSodium}>
        {matches.map(({ rule, matchedItem }) => (
          <IngredientSubstituteRow
            key={rule.id}
            matchedItemName={matchedItem.name}
            option={rule[track]}
            active={enabledRuleIds.has(rule.id)}
            onChange={() => onToggleRule(rule.id)}
          />
        ))}
        {track === 'LOCAL_FARM' && anyActive && <div className="pt-1"><PartnerBadge /></div>}
      </Panel>
    </div>
  )
}
