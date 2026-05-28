# 🏥 Nurse-Bridge PRO

> 간호사 업무 효율화 및 환자 안전 강화 시스템

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux)](https://redux-toolkit.js.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vite.dev)

---

## 🎯 핵심 기능

| 기능 | 설명 |
|------|------|
| 🤖 **AI 인수인계 요약** | 이전 근무조 기록 → 30초 안에 핵심 5줄 파악 |
| 📋 **간호 Todo 관리** | 진단별 자동 생성 체크리스트, 실시간 완료율 |
| 📦 **재고 관리 자동화** | 실시간 재고 확인, 클릭 한 번으로 청구 |
| 📊 **병동 관제 대시보드** | 병상 가동률, 중증도 분포, 오버타임 예측 |
| 🔄 **AI 자동 재배치** | 간호사 업무 과부하 감지 및 최적 배분 추천 |

## 🏗️ 기술 스택

```
Frontend    React 18 + TypeScript
State       Redux Toolkit
Styling     Tailwind CSS v4
Animation   Framer Motion
Charts      Recharts
Mock API    MSW (Mock Service Worker)
Routing     React Router v6
Build       Vite
Test        Vitest + Testing Library
```

## 🚀 시작하기

```bash
# 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 테스트
npm run test
```

## 📁 프로젝트 구조

```
src/
├── components/       # 재사용 컴포넌트
│   ├── common/       # 공통 UI (Button, Badge, Card...)
│   ├── layout/       # 레이아웃 (Sidebar, Topbar...)
│   ├── patient/      # 환자 관련 컴포넌트
│   ├── inventory/    # 재고 관련 컴포넌트
│   ├── dashboard/    # 대시보드 컴포넌트
│   └── head-nurse/   # 수간호사 관제 컴포넌트
├── pages/            # 페이지 컴포넌트
├── store/            # Redux store & slices
├── hooks/            # 커스텀 훅
├── types/            # TypeScript 타입 정의
├── data/             # Mock 데이터
├── mocks/            # MSW 핸들러
└── utils/            # 유틸리티 함수
```

## 🎨 디자인 시스템

HTML 와이어프레임 기준 동일 색상 토큰 적용:

| 토큰 | 색상 | 용도 |
|------|------|------|
| `primary` | `#2C6E8A` | 주요 액션, 링크 |
| `danger` | `#C0392B` | High 중증도, 경고 |
| `warn` | `#D4860A` | Medium 중증도, 주의 |
| `ok` | `#2E7D5E` | Low 중증도, 완료 |

## 📊 데모 계정

| 역할 | 사번 | 비밀번호 |
|------|------|---------|
| 일반 간호사 | EMP001 | 1234 |
| 수간호사 | EMP006 | 1234 |

---

*Made with ❤️ for healthcare professionals*
