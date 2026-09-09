-- foods 테이블은 이미 연결되어 있다고 하셨으니 여기서는 생략합니다.
-- (명세서 2장 스키마: food_id, food_group, food_name, energy_kcal, water_g, protein_g,
--  fat_g, carb_g, sugar_g, fiber_g, sodium_mg)

-- 메뉴젠 표준 템플릿 (명세서 5장 2번 API)
CREATE TABLE IF NOT EXISTS menu_templates (
  template_id   VARCHAR(20) PRIMARY KEY,
  menu_name     VARCHAR(100) NOT NULL,
  default_servings INT NOT NULL DEFAULT 1,
  default_method   VARCHAR(10) NOT NULL DEFAULT 'STIR' -- RAW/BOIL/STIR/GRILL/FRY
);

CREATE TABLE IF NOT EXISTS menu_template_ingredients (
  id            BIGINT AUTO_RANDOM PRIMARY KEY,
  template_id   VARCHAR(20) NOT NULL,
  food_id       INT NOT NULL,
  weight_g      FLOAT NOT NULL,
  cooking_method VARCHAR(10) NOT NULL DEFAULT 'STIR',
  INDEX idx_template (template_id)
);

-- 사용자 저장 레시피 (명세서 5장 5번 API) — 로그인 유저 전용, 비로그인은 401 + LocalStorage 폴백
CREATE TABLE IF NOT EXISTS saved_recipes (
  id            BIGINT AUTO_RANDOM PRIMARY KEY,
  user_id       VARCHAR(64) NOT NULL,      -- NextAuth(Google) 세션의 user.id / email
  menu_name     VARCHAR(100) NOT NULL,
  servings      INT NOT NULL DEFAULT 1,
  ingredients_json JSON NOT NULL,          -- Ingredient[] 그대로 직렬화 저장
  summary_kcal  FLOAT,
  summary_sugar FLOAT,
  summary_sodium FLOAT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 시드 예시 (제육볶음)
INSERT IGNORE INTO menu_templates (template_id, menu_name, default_servings, default_method)
VALUES ('TPL_01', '제육볶음', 1, 'STIR');

INSERT IGNORE INTO menu_template_ingredients (template_id, food_id, weight_g, cooking_method) VALUES
  ('TPL_01', 1420, 180, 'STIR'),
  ('TPL_01', 352, 15, 'STIR'),
  ('TPL_01', 401, 25, 'STIR'),
  ('TPL_01', 204, 15, 'STIR');
