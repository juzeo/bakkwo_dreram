'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { GNB } from '@/components/common/GNB'
import { Button } from '@/components/ui/button'
import { readSavedRecipes, writeSavedRecipes, saveHandoff, type SavedRecipeEntry } from '@/lib/mockData'

export function StoragePage() {
  const [recipes, setRecipes] = useState<SavedRecipeEntry[]>([])

  useEffect(() => { setRecipes(readSavedRecipes()) }, [])

  const remove = (id: string) => {
    const next = recipes.filter(r => r.id !== id)
    setRecipes(next)
    writeSavedRecipes(next)
  }

  const loadToLabelMaker = (recipe: SavedRecipeEntry) => {
    saveHandoff({ menu: recipe.menu, servings: recipe.servings, added: recipe.added })
  }

  return (
    <div className="min-h-screen bg-background">
      <GNB />
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-medium text-primary">내 보관함</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">저장한 레시피를 한눈에 확인하세요.</h1>
          <p className="mt-4 text-muted-foreground">자율 영양표시 카드에서 저장한 레시피를 다시 불러오거나 삭제할 수 있습니다.</p>
        </div>

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
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(recipe.savedAt).toLocaleDateString('ko-KR')} 저장 · {recipe.servings}인분</p>
                  </div>
                  <button aria-label="삭제" onClick={() => remove(recipe.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div><p className="text-xs text-muted-foreground">칼로리</p><p className="mt-1 text-sm font-semibold">{Math.round(recipe.summary.kcal)}kcal</p></div>
                  <div><p className="text-xs text-muted-foreground">당류</p><p className="mt-1 text-sm font-semibold">{recipe.summary.sugar.toFixed(1)}g</p></div>
                  <div><p className="text-xs text-muted-foreground">나트륨</p><p className="mt-1 text-sm font-semibold">{Math.round(recipe.summary.sodium)}mg</p></div>
                </div>
                <Button render={<Link href="/label-maker" />} variant="outline" size="sm" className="mt-4 w-full" onClick={() => loadToLabelMaker(recipe)}>
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
