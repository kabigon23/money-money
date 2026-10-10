# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

MoneyMoney: 멀티유저 포트폴리오 트래커 (미국 주식/한국 ETF/암호화폐/현금/KRX 금현물). UI와 주석은 한국어, 커밋 메시지는 `feat:`/`fix:` 접두사 + 한국어 또는 영어.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint       # 현재 오류/경고 0건 유지
npx tsc --noEmit   # 현재 통과
```

테스트 프레임워크는 없다. Next.js 16 / React 19 / Tailwind v4 / shadcn(`components.json`), import alias는 `@/*` → `src/*`.

## 환경 변수

`.env.local` (gitignore 대상): Vercel에서 `npx vercel env pull .env.local`로 받는다 (프로젝트 `kabigon23s-projects/money-money`).
- `REDIS_URL` (필수): Vercel의 값은 운영 Redis다. 로컬 개발 시 `redis://localhost:6379`로 바꿔 쓸 것 (pull 하면 덮어써지므로 다시 수정 필요).
- `DATA_GO_KR_SERVICE_KEY`: 금현물 시세. Vercel에서 Development 환경 체크 필요.
- `CRON_SECRET`: Production cron 인증용. 로컬에서는 불필요.

- `SEED_ADMIN_PASSWORD` (8자 이상): 빈 Redis에서 최초 관리자를 만들 때만 필요. 로컬은 `.env.local`에 직접 추가하고, 이후 `curl -X POST localhost:3000/api/auth/seed`를 한 번 호출한다 (자동 호출은 없음). `SEED_ADMIN_USERNAME`으로 아이디 변경 가능(기본 `admin`). 일반 유저는 관리자 화면에서 생성한다. 이미 유저가 있으면 seed는 아무것도 하지 않는다.

## 아키텍처

**저장소는 Redis 하나뿐이며 스키마가 없다.** 모든 값은 JSON 문자열이고, 컬렉션(자산/카테고리/태그/워치리스트)은 유저별 키에 배열 전체를 통째로 `SET`한다 (`assets:{uid}`, `categories:{uid}`, `tags:{uid}`, `watchlist:{uid}`, `tag_combos:{uid}`). 계정은 `credential:{username}`(bcrypt 해시), `user:{id}`, `users:list`(set), 세션은 `session:{token}`(7일 TTL). 클라이언트 `ioredis` 인스턴스는 `src/lib/redis.ts`. 유저 데이터를 지울 때는 `src/lib/user-data.ts`의 `wipeUserData()`를 쓴다 (새 유저별 키를 추가하면 여기에도 등록할 것. 패턴 삭제에 쓰이므로 userId는 `isSafeUserId()`로 검증한다).

**데이터 흐름**: `src/app/page.tsx`(약 1200줄, 대시보드 거의 전부)가 마운트 시 `/api/assets|categories|tags?userId=`를 fetch하고, 변경이 생기면 배열 전체를 다시 POST한다. 필터/통화/현금포함 여부 같은 UI 상태는 `localStorage`(`moneymoney_*`)에 저장한다.

**시세**: 브라우저 → `useAssetPrices`(60초 폴링) → `MarketService`(`src/services/market.ts`) → `/api/prices` → `yahoo-finance2`. 같은 요청에서 `USDKRW=X` 환율도 함께 가져온다. `GOLD_KRX`는 Yahoo를 쓰지 않고 `src/lib/gold.ts`의 `fetchGoldPrices()`(공공데이터포털 금시장 API, 원/g)를 호출해 병합한다. `/api/prices`, `/api/gold`, `daily-snapshot`이 이 함수를 공유한다. 미국 주식은 프리/정규/에프터 세션별로 `currentPrice`를 고른다.

**통화 모델**: 자산 `exchange`(`US|KR|CRYPTO|CASH_KRW|CASH_USD|GOLD_KRX`)가 가격 통화를 결정한다. US/CRYPTO는 USD, KR/GOLD_KRX/CASH_KRW는 KRW이며 `quantity`가 현금 자산에서는 금액 자체다. KRW↔USD 변환 로직이 `page.tsx`와 `daily-snapshot/route.ts`의 `calcValuation`에 따로 구현돼 있어 한쪽을 고치면 다른 쪽도 확인해야 한다 (GOLD_KRX 관련 버그가 최근 여러 번 있었음).

**일일 스냅샷** (`api/daily-snapshot`, `hooks/useDailySnapshot`): KST 09:30에 자산별 평가금액을 `asset-daily:{uid}:{date}:{symbol}`(90일 TTL)로 기록하고 `asset-daily-lock:*`로 중복을 막는다. 두 경로가 있다: Vercel cron(`vercel.json`, UTC 00:30, `Bearer CRON_SECRET` 필요)과, 09:30~09:40 창 안에 열려 있는 브라우저의 POST. 별도로 `api/snapshot`은 카테고리/통화별 24시간 TTL 단일 값을 저장한다.

**인증**: `POST /api/auth/login` → `lib/session.ts`가 uuid 토큰을 Redis에 저장하고 `session_token` HttpOnly 쿠키를 설정한다. 새 라우트는 `src/lib/api-auth.ts`의 `requireUser()` / `requireAdmin()`으로 세션 유저를 얻는다 (`if ('error' in auth) return auth.error`). 관리자 재확인이 필요한 작업은 `verifyUserPassword()`를 쓴다. userId는 항상 세션에서 얻고 쿼리/body 값은 신뢰하지 않는다.

## 주의할 점

- 쓰기 API의 body는 `src/lib/schemas.ts`의 zod 스키마와 `parseBody()`로 검증한다. 기존 저장 데이터가 거절되면 사용자가 저장을 못 하므로 `looseObject`로 필수 필드만 엄격히 검사한다. 새 스키마를 추가할 때도 같은 원칙을 따를 것.

## 작업 규칙

- 피드백, 설명, 보고는 반드시 한국어로 한다. 코드 식별자와 기술 용어만 원문을 유지한다.
- git 명령은 사용자가 직접 실행한다. `git add/commit/push/branch` 등 상태를 바꾸는 명령은 Claude가 실행하지 않고, 필요하면 커밋 메시지 초안만 제안한다. `git status/diff/log` 같은 읽기 전용 조회는 허용한다.
