import os
import pymysql
import pandas as pd
from dotenv import load_dotenv

# .env.local 로드
load_dotenv('.env.local')

# 1. 엑셀 파일 로드 및 전처리
EXCEL_PATH = "식품성분표(10개정판).xlsx"
SHEET_NAME = "국가표준식품성분 Database 10.4"

print("엑셀 데이터 로딩 중...")
# 0:색인, 2:식품군, 3:식품명, 5:에너지, 6:수분, 7:단백질, 8:지방, 10:탄수화물, 11:당류, 18:총식이섬유, 26:나트륨
target_cols = [0, 2, 3, 5, 6, 7, 8, 10, 11, 18, 26]
df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME, skiprows=3, header=None, usecols=target_cols)
df.columns = [
    'food_id', 'food_group', 'food_name', 
    'energy_kcal', 'water_g', 'protein_g', 'fat_g', 
    'carb_g', 'sugar_g', 'fiber_g', 'sodium_mg'
]

# 결측치, 하이픈('-'), 트레이스('Tr') 수치 정제
numeric_cols = ['energy_kcal', 'water_g', 'protein_g', 'fat_g', 'carb_g', 'sugar_g', 'fiber_g', 'sodium_mg']
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col].astype(str).str.replace('-', '0').str.replace('Tr', '0'), errors='coerce').fillna(0.0)

# 문자열 및 ID 정제
df['food_name'] = df['food_name'].astype(str).str.strip()
df['food_group'] = df['food_group'].astype(str).str.strip()
df['food_id'] = df['food_id'].astype(int)

# PyMySQL 호환 튜플 리스트로 변환 (각 행 11개 필드)
data_to_insert = [tuple(row) for row in df.itertuples(index=False, name=None)]
print(f"정제 완료: 총 {len(data_to_insert)}개 식품 데이터 (각 행 {len(data_to_insert[0])}개 컬럼)")

# 2. TiDB 연결 설정
TIDB_HOST = os.getenv("TIDB_HOST", "gateway01.ap-northeast-1.prod.aws.tidbcloud.com")
TIDB_PORT = int(os.getenv("TIDB_PORT", 4000))
TIDB_USER = os.getenv("TIDB_USER", "your_user.root")
TIDB_PASSWORD = os.getenv("TIDB_PASSWORD", "your_password")
TIDB_DB = os.getenv("TIDB_DATABASE", "bakkwodream")

conn = pymysql.connect(
    host=TIDB_HOST,
    port=TIDB_PORT,
    user=TIDB_USER,
    password=TIDB_PASSWORD,
    database=TIDB_DB,
    ssl_verify_cert=True,
    ssl_verify_identity=True
)

create_table_sql = """
CREATE TABLE IF NOT EXISTS foods (
    food_id INT PRIMARY KEY,
    food_group VARCHAR(50) NOT NULL,
    food_name VARCHAR(150) NOT NULL,
    energy_kcal FLOAT DEFAULT 0.0,
    water_g FLOAT DEFAULT 0.0,
    protein_g FLOAT DEFAULT 0.0,
    fat_g FLOAT DEFAULT 0.0,
    carb_g FLOAT DEFAULT 0.0,
    sugar_g FLOAT DEFAULT 0.0,
    fiber_g FLOAT DEFAULT 0.0,
    sodium_mg FLOAT DEFAULT 0.0,
    INDEX idx_food_name (food_name)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

insert_sql = """
REPLACE INTO foods (
    food_id, food_group, food_name, 
    energy_kcal, water_g, protein_g, fat_g, 
    carb_g, sugar_g, fiber_g, sodium_mg
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

try:
    with conn.cursor() as cursor:
        print(f"TiDB `{TIDB_DB}`.foods 테이블 확인 및 생성 중...")
        cursor.execute(create_table_sql)
        
        print(f"TiDB `{TIDB_DB}`.foods 테이블로 일괄 적재 시작...")
        cursor.executemany(insert_sql, data_to_insert)
        conn.commit()
        print(f"✅ 성공적으로 {len(data_to_insert):,}개 식품 데이터가 TiDB에 적재되었습니다!")
finally:
    conn.close()