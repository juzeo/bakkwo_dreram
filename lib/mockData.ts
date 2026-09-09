import type { CookingMethodCode, FoodItem, Ingredient } from './nutrition'

// food_id는 명세서 5장 API 예시와 동일하게 맞춰뒀습니다.
// 실서비스에서는 /api/v1/foods/search (TiDB foods 테이블)로 대체됩니다.
export const MOCK_FOODS: FoodItem[] = [
  { food_id: 1103, food_group: '육류', name: '닭가슴살', kcal: 165, protein: 31, carbs: 0, fat: 3.6, sugar: 0, sodium: 74, fiber: 0, saturatedFat: 1.0, transFat: 0, cholesterol: 85 },
  { food_id: 352, food_group: '조미료류', name: '진간장', kcal: 53, protein: 5.2, carbs: 5.6, fat: 0.1, sugar: 0.9, sodium: 5493, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0 },
  { food_id: 906, food_group: '채소류', name: '양파', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, sugar: 4.2, sodium: 4, fiber: 1.7, saturatedFat: 0, transFat: 0, cholesterol: 0 },
  { food_id: 610, food_group: '당류', name: '물엿', kcal: 317, protein: 0, carbs: 79, fat: 0, sugar: 42, sodium: 5, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0 },
  { food_id: 101, food_group: '곡류 및 그 제품', name: '쌀밥', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, sugar: 0.1, sodium: 1, fiber: 0.3, saturatedFat: 0.1, transFat: 0, cholesterol: 0 },
  { food_id: 1420, food_group: '육류', name: '돼지고기, 앞다리, 생것', kcal: 223, protein: 18.6, carbs: 0, fat: 16, sugar: 0, sodium: 57, fiber: 0, saturatedFat: 5.8, transFat: 0.1, cholesterol: 72 },
  { food_id: 401, food_group: '조미료류', name: '고추장, 혼합', kcal: 225, protein: 5.6, carbs: 44, fat: 2.4, sugar: 16, sodium: 2000, fiber: 4.2, saturatedFat: 0.4, transFat: 0, cholesterol: 0 },
  { food_id: 204, food_group: '당류', name: '설탕, 백설탕', kcal: 387, protein: 0, carbs: 99.8, fat: 0, sugar: 99.8, sodium: 1, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0 },
  { food_id: 501, food_group: '조미료류', name: '정제염', kcal: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, sodium: 38758, fiber: 0, saturatedFat: 0, transFat: 0, cholesterol: 0 },
]

export interface MenuTemplate {
  template_id: string
  menu_name: string
  default_servings: number
  default_method: CookingMethodCode
  ingredients: { food_id: number; grams: number; cookingMethod: CookingMethodCode }[]
}

export const TEMPLATES: MenuTemplate[] = [
  {
    template_id: 'TPL_01',
    menu_name: '제육볶음',
    default_servings: 1,
    default_method: 'STIR',
    ingredients: [
      { food_id: 1420, grams: 180, cookingMethod: 'STIR' },
      { food_id: 352, grams: 15, cookingMethod: 'STIR' },
      { food_id: 401, grams: 25, cookingMethod: 'STIR' },
      { food_id: 204, grams: 15, cookingMethod: 'STIR' },
    ],
  },
  {
    template_id: 'TPL_02',
    menu_name: '닭가슴살 간장 덮밥',
    default_servings: 1,
    default_method: 'STIR',
    ingredients: [
      { food_id: 1103, grams: 120, cookingMethod: 'STIR' },
      { food_id: 352, grams: 12, cookingMethod: 'STIR' },
      { food_id: 906, grams: 50, cookingMethod: 'STIR' },
      { food_id: 101, grams: 150, cookingMethod: 'RAW' },
    ],
  },
]

export function toIngredient(food: FoodItem, grams: number, cookingMethod: CookingMethodCode): Ingredient {
  return { ...food, grams, cookingMethod }
}

// ── localStorage 기반 레시피 인계/보관함 (로그인 붙기 전까지의 게스트 모드 폴백) ──
const HANDOFF_KEY = 'nutridoctor:lastRecipe'
const RECIPES_KEY = 'nutridoctor:savedRecipes'

export type SavedRecipe = {
  menu: string
  servings: number
  added: Ingredient[]
}

export type SavedRecipeEntry = SavedRecipe & {
  id: string
  savedAt: number
  summary: { kcal: number; sugar: number; sodium: number }
}

export function saveHandoff(recipe: SavedRecipe) {
  try { window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(recipe)) } catch {}
}

export function readHandoff(): SavedRecipe | null {
  try {
    const raw = window.localStorage.getItem(HANDOFF_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function readSavedRecipes(): SavedRecipeEntry[] {
  try {
    const raw = window.localStorage.getItem(RECIPES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function writeSavedRecipes(list: SavedRecipeEntry[]) {
  try { window.localStorage.setItem(RECIPES_KEY, JSON.stringify(list)) } catch {}
}
