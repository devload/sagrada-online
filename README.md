# Sagrada — Solo Web Edition

**보드게임 [Sagrada](https://boardgamegeek.com/boardgame/199561/sagrada)의 규칙을 팬 리메이크한 토이 프로젝트입니다.**
스테인드글라스 창을 완성해 나가는 주사위 드래프팅 퍼즐을, 브라우저에서 혼자 즐길 수 있는 형태로 재구성했습니다.
학습·실험 목적의 개인 프로젝트이며, 상업적 용도나 상품성 있는 서비스가 아닙니다.

> **면책**
> Sagrada는 Floodgate Games의 등록된 상표이며, 규칙/카드 디자인의 저작권은 원저작자에게 있습니다.
> 본 저장소는 팬 리메이크로, 공식과 무관합니다.

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| **런타임** | React 19, TypeScript 6 (strict), Vite 8 |
| **상태** | Zustand + Immer (immutable draft mutations) |
| **3D** | Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing |
| **UI** | Tailwind CSS, framer-motion |
| **테스트** | Vitest (24 unit tests / rules + scoring) |
| **PWA** | Web App Manifest, maskable icons, offline shell |
| **배포** | Vercel (Static Vite 프리셋, SPA rewrites) |

---

## 아키텍처 하이라이트

### 순수 도메인 코어 (`src/game/`)

게임 로직은 React나 렌더러에 의존하지 않는 순수 TypeScript 모듈로 분리되어 있어 단위 테스트가 쉽습니다.

- **`rules.ts`** — 4×5 창문 배치 규칙(패턴 색·값 제약, 인접 동색/동값 금지, 첫 배치 엣지 제약, 인접 필수). 배치 실패 시 `PlacementError` 타입 유니온으로 명확한 실패 사유를 반환.
- **`scoring.ts`** — 공개/개인 목표 카드 스코어링 함수를 순수 함수로 표현. 각 목표는 `(window: PlacedDie[][]) => number` 시그니처의 count 함수로 통일.
- **`tools.ts`** — 12종의 툴 카드(Grozing, Flux Brush, Cork-backed Straightedge, Eglomise 등) 정의. 각 툴이 어떤 규칙을 우회하는지를 `PlaceOptions` 플래그로 표현하여 rules 엔진과 loosely-coupled.
- **`rng.ts`** — `mulberry32` PRNG + `xmur3` 문자열 해시. 시드 기반 결정론적 재현이 가능하도록 구현.

### 상태 관리 (`src/store/`)

- Zustand + Immer 미들웨어로 immutable-처럼 보이는 draft mutation을 안전하게 사용.
- `gameStore.ts`는 게임 진행 상태(창문·풀·라운드 트랙·툴 사용 이력)를, `uiStore.ts`는 씬 라우팅과 오버레이 상태를 분리해서 관리.
- 씬 전환은 상태값 하나(`scene`)로 표현하고, `<App>`이 조건부 렌더링. React Router 없이 앱 전체가 SPA 하나.

### 3D 렌더링 (`src/three/`)

- Three.js 기반의 커스텀 6면체 주사위(`Die3D`). 각 면을 별도 plane으로 배치하고 pip 좌표를 값별로 하드코딩(1↔6, 2↔5, 3↔4 반대편).
- `CathedralEnv`가 성당 무드의 조명·환경맵, `StainedGlassWindow`가 배치된 주사위를 발광하는 유리로 렌더.
- 로비/게임/스코어보드 씬은 각각 독립된 R3F Canvas로 구성 — Chrome의 WebGL 컨텍스트 캡을 피하기 위해 씬 전환 시 크로스페이드 없이 즉시 스왑, `CanvasCleanup` 훅이 unmount 시 disposal을 강제.
- `EffectComposer` + Bloom + Vignette로 스테인드글라스의 발광 효과.

### PWA

- Web App Manifest + maskable/standard 아이콘 세트로 iOS/Android 홈스크린 설치 지원.
- Vite 빌드 결과물이 정적 자산만으로 동작하므로 오프라인 실행 가능(서버 API 없음).
- `usePWA` 훅이 플랫폼별 설치 프롬프트(iOS는 안내, Android는 `beforeinstallprompt`)를 노출.

### 테스트

- Vitest 기반 24개 유닛 테스트: 창문 배치 규칙과 스코어링 함수의 정확성 검증.
- 도메인 코어가 순수 함수라 fixture 없이도 빠르게 커버.

```bash
npm test   # 24 passed
```

---

## 로컬 실행

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm test         # vitest
```

---

## 프로젝트 구조

```
src/
├── game/       # 도메인 코어 (프레임워크-무관, pure TS)
│   ├── rules.ts, scoring.ts, tools.ts, rng.ts
│   └── *.test.ts
├── store/      # Zustand stores (gameStore, uiStore)
├── three/      # R3F 3D 컴포넌트 (Die3D, 성당 환경)
├── scenes/     # 씬 단위 컴포넌트 (Lobby, Game, Scoreboard…)
├── ui/         # 2D UI (Sheet, MissionStrip, ToolsRail…)
├── hooks/      # usePWA
├── audio/      # 효과음 로더
└── App.tsx     # 씬 라우팅
```

---

## 배운 것 / 실험한 것

- **도메인 로직과 렌더링의 분리**: 게임 규칙을 순수 함수로 두니 단위 테스트가 즉시 가능했고, 여러 시행착오를 거친 스코어링 함수 변경이 회귀 없이 안정적이었습니다.
- **Zustand + Immer**: Redux 없이도 큰 상태 트리를 draft mutation 스타일로 다루는 편의성.
- **R3F 씬 스왑의 함정**: 두 개의 Canvas가 동시에 마운트되면 Chrome에서 "Context Lost"가 발생 → 크로스페이드 대신 즉시 스왑 + 명시적 disposal로 해결.
- **결정론적 PRNG**: 처음엔 온라인 동기화용으로 도입했지만 이후 로컬 전용으로 회귀. 시드 재현이 필요한 상황이 다시 오면 재활용 가능.

---

## 라이선스 & 크레딧

- 코드: MIT (참고용, 개인 학습 목적)
- Sagrada 게임 디자인 원저작자: Adrian Adamescu & Daryl Andrews / Floodgate Games
- 이 프로젝트는 어떠한 상업적 이용도 목적으로 하지 않으며, 원작 IP 홀더의 요청 시 즉시 비공개 전환합니다.
