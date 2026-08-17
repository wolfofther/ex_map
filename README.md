# 🗺️ 후회 지도 (Regret Map)

장소 기반 익명 후회 공유 플랫폼 — MVP 1차 사이클 구현체

이 저장소 하나로 **웹 버전**과 **플레이스토어(안드로이드) 버전**을 동시에 빌드합니다.
(웹앱을 Capacitor로 감싸 네이티브 앱으로 패키징하는 방식 — 코드는 100% 공유)

---

## 0. 사전 준비물 (반드시 본인 계정으로 발급)

| 항목 | 용도 | 발급처 |
|---|---|---|
| Google Maps API 키 | 지도 렌더링 | Google Cloud Console → API 및 서비스 → 사용자 인증정보 → "Maps JavaScript API" 활성화 |
| Supabase 프로젝트 | DB/백엔드 (무료티어) | supabase.com → New Project |
| Google Play 개발자 계정 | 앱 등록 (1회 $25) | play.google.com/console |
| Node.js 18+ | 빌드 환경 | nodejs.org |
| Android Studio | 안드로이드 빌드/서명 | developer.android.com/studio |

---

## 1. 로컬 설치

```bash
npm install
cp .env.example .env
# .env 파일을 열어 VITE_GOOGLE_MAPS_API_KEY / VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 입력
```

## 2. Supabase 데이터베이스 구성

1. Supabase 프로젝트 생성 후 **SQL Editor**를 연다.
2. `supabase/schema.sql` 전체 내용을 붙여넣고 실행한다.
   - `pins`(핀), `pin_empathies`(공감) 테이블과 RLS 정책, 공감 카운트 자동 증가 트리거가 한 번에 생성된다.
3. 프로젝트 설정 → API 메뉴에서 `Project URL`, `anon public key`를 `.env`에 입력한다.

## 3. 웹 버전 실행 / 배포

```bash
npm run dev       # 로컬 개발 서버 (http://localhost:5173)
npm run build      # dist/ 폴더에 정적 빌드 생성
```

배포는 `dist/` 폴더를 정적 호스팅에 올리면 끝난다. **Vercel** 기준:

```bash
npm i -g vercel
vercel --prod
```

빌드 시 환경변수(`VITE_GOOGLE_MAPS_API_KEY` 등)를 Vercel 프로젝트 설정 → Environment Variables에도 동일하게 등록해야 한다.

> Google Maps API 키는 **HTTP 리퍼러 제한**을 반드시 걸 것 (Cloud Console → 사용자 인증정보 → 키 편집 → 애플리케이션 제한사항 → HTTP 리퍼러). 배포 도메인을 등록하지 않으면 키가 도용될 수 있다.

---

## 4. 플레이스토어(안드로이드) 버전 — Capacitor 패키징

### 4-1. 안드로이드 프로젝트 최초 생성

```bash
npm run build
npx cap add android
npx cap sync android
```

### 4-2. appId 변경 (필수)

`capacitor.config.json`의 `appId`(`com.regretmap.app`)는 예시 값이다. Play Store에 실제 등록하려면
전 세계에서 유일한 패키지명으로 바꿔야 한다 (예: `com.yourcompany.regretmap`). 변경 후 다시:

```bash
npx cap sync android
```

### 4-3. Android Studio에서 빌드

```bash
npx cap open android
```

Android Studio가 열리면:

1. `Build → Generate Signed Bundle / APK` 선택
2. **Android App Bundle(.aab)** 선택 (Play Store는 AAB 필수, APK 아님)
3. 키스토어 신규 생성 → **비밀번호와 키스토어 파일을 반드시 안전한 곳에 백업**
   (분실 시 이후 앱 업데이트가 불가능해짐 — Play Store 정책)
4. `release` 빌드로 `.aab` 파일 생성

### 4-4. 앱 아이콘 / 스플래시 이미지

`android/app/src/main/res/` 하위 `mipmap-*` 폴더의 기본 Capacitor 아이콘을 실제 아이콘으로 교체해야 한다.
가장 쉬운 방법은 Android Studio의 `File → New → Image Asset` 마법사 사용.

### 4-5. 코드 수정 후 재배포 흐름

```
소스 수정 → npm run build → npx cap sync android → Android Studio에서 재빌드/재서명
```

---

## 5. Play Store 등록 시 반드시 필요한 항목 (기술 외적 요건)

Play Console 심사에서 아래가 없으면 반려된다:

- **개인정보처리방침 URL** — 위치 데이터를 수집하므로 필수. 별도 페이지(예: 웹 배포 도메인 하위 `/privacy`)를 만들어 등록해야 한다.
- **위치 권한 사용 목적 고지** — "핀 등록 시 지도상 위치 선택" 용도임을 명시.
- **데이터 보안 섹션 작성** — 어떤 데이터(위치, 익명 기기 UUID)를 수집하는지 Play Console 설문에 답변.
- **콘텐츠 등급 설문** — 사용자 생성 텍스트(후회 문구)가 포함되므로 신고/차단 기능 부재 시 등급 및 심사에서 지적될 수 있음. MVP 범위에서 제외된 신고 기능은 2차 사이클에서 우선 추가를 권고함.
- **한국 이용자 대상 서비스일 경우**: 위치기반서비스 사업자 신고(방송통신위원회) 대상 여부를 검토 필요 — 단순 지도 표시 수준인지, 실시간 개인 위치 수집인지에 따라 해당 여부가 갈리므로 법률 자문을 권고함.

---

## 6. 폴더 구조

```
regret-map/
├── src/
│   ├── App.jsx                 # 전체 상태관리 및 화면 조립
│   ├── components/
│   │   ├── MapView.jsx          # 구글맵 렌더링 + 핀 마커
│   │   ├── CategoryFilter.jsx   # 카테고리 필터 칩
│   │   ├── PinModal.jsx         # 핀 등록 바텀시트
│   │   ├── PinDetailSheet.jsx   # 핀 상세보기 + 공감
│   │   └── RankingPanel.jsx     # 후회 명소 TOP 10
│   ├── data/categories.js       # 카테고리 정의 (색상 포함)
│   ├── lib/loadGoogleMaps.js    # 구글맵 스크립트 동적 로더
│   └── supabaseClient.js        # Supabase 클라이언트 + 익명 device_id
├── supabase/schema.sql          # DB 스키마 (테이블/RLS/트리거)
├── capacitor.config.json        # 안드로이드 패키징 설정
└── .env.example
```

## 7. MVP 기획서 대비 구현 범위

| 기능 | 우선순위 | 구현 여부 |
|---|---|---|
| 핀 등록 | P0 | ✅ |
| 지도 탐색 | P0 | ✅ (히트맵은 2차 사이클 예정) |
| 공감하기 | P0 | ✅ (기기당 1회 제한, DB 트리거로 카운트) |
| 후회 명소 랭킹 | P1 | ✅ (좌표 격자 클러스터링 방식, 2차 사이클에서 서버 집계로 고도화 권장) |
| 카테고리 필터 | P1 | ✅ |
| 알림 | P2 | ❌ (미구현 — Out-of-Scope) |
| 신고/차단 | Out-of-Scope | ❌ (Play Store 심사 대비 2차 사이클 우선 권고) |
