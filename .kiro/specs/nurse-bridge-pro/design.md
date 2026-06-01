# Design Document

## Overview

Nurse-Bridge PRO는 React 18 + TypeScript + Redux Toolkit 기반의 간호사 업무 지원 웹 애플리케이션이다. 견본 HTML 5개(dashboard.html, patient-detail.html, inventory.html, head-nurse.html, index.html)의 디자인 토큰과 레이아웃 구조를 그대로 React 컴포넌트로 이식한다. MSW로 API를 시뮬레이션하고, Phase 2에서 실제 Claude API를 연동한다.

---

## Architecture

### 전체 구조

```
src/
├── components/
│   ├── common/          # 재사용 공통 컴포넌트
│   │   ├── SeverityBadge.tsx
│   │   ├── VitalChip.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Button.tsx
│   │   ├── Toast.tsx
│   │   └── index.ts
│   ├── layout/          # 레이아웃 컴포넌트
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── BottomNav.tsx
│   │   └── AppLayout.tsx
│   ├── patient/         # 환자 관련 컴포넌트
│   │   ├── PatientCard.tsx
│   │   ├── PatientGrid.tsx
│   │   ├── AISummaryCard.tsx
│   │   ├── VitalSignsGrid.tsx
│   │   ├── LabResultsGrid.tsx
│   │   ├── MedicationList.tsx
│   │   └── TodoList.tsx
│   ├── dashboard/       # 대시보드 컴포넌트
│   │   ├── StatCards.tsx
│   │   ├── QuickMenu.tsx
│   │   └── AlertBanner.tsx
│   ├── inventory/       # 재고 관련 컴포넌트
│   │   ├── InventoryTabs.tsx
│   │   ├── InventoryItem.tsx
│   │   └── InventorySummary.tsx
│   └── head-nurse/      # 수간호사 관련 컴포넌트
│       ├── OccupancyChart.tsx
│       ├── SeverityPieChart.tsx
│       ├── OvertimeChart.tsx
│       ├── NurseStatusTable.tsx
│       └── ReassignBanner.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── PatientDetailPage.tsx
│   ├── InventoryPage.tsx
│   └── HeadNursePage.tsx
├── store/
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts
│       ├── patientsSlice.ts
│       ├── tasksSlice.ts
│       ├── inventorySlice.ts
│       └── nursesSlice.ts
├── hooks/
│   ├── useAppDispatch.ts
│   ├── useAppSelector.ts
│   └── useMyPatients.ts
├── types/index.ts
├── data/mockData.ts
├── mocks/
│   ├── browser.ts
│   └── handlers/index.ts
└── utils/
    ├── severity.ts
    └── overtime.ts
```

---

## Components

### 1. 공통 컴포넌트 (common/)

#### SeverityBadge
```typescript
interface SeverityBadgeProps {
  severity: 'High' | 'Medium' | 'Low'
  size?: 'sm' | 'md'
}
```
- High → `bg-[#FDECEA] text-[#C0392B]` + "🔴 High"
- Medium → `bg-[#FEF3E2] text-[#D4860A]` + "🟡 Medium"
- Low → `bg-[#E8F5EE] text-[#2E7D5E]` + "🟢 Low"

#### VitalChip
```typescript
interface VitalChipProps {
  label: string
  value: string | number
  isAbnormal?: boolean
  isBorderline?: boolean
}
```
- 이상 → 수치 텍스트 `text-[#C0392B]`
- 경계 → 수치 텍스트 `text-[#D4860A]`
- 정상 → 수치 텍스트 `text-[#1A2B38]`

#### ProgressBar
```typescript
interface ProgressBarProps {
  percentage: number
  height?: number
  showLabel?: boolean
}
```
- ≥80% → `bg-[#2E7D5E]` (ok)
- 50~79% → `bg-[#2C6E8A]` (primary)
- <50% → `bg-[#D4860A]` (warn)

#### Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'outline' | 'danger' | 'ghost' | 'done'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
}
```

---

### 2. 레이아웃 컴포넌트 (layout/)

#### AppLayout
- 데스크톱: `flex` → Sidebar(220px 고정) + 콘텐츠 영역
- 모바일(<768px): Sidebar 숨김 + BottomNav 표시
- Framer Motion으로 페이지 전환 시 fadeIn 애니메이션

#### Sidebar
- 로고 영역 (Nurse-Bridge PRO v1.0)
- 사용자 정보 (아바타, 이름, 근무조)
- 네비게이션 링크 (섹션별 그룹화)
- 로그아웃 버튼
- 모바일: `transform: translateX(-100%)` → 햄버거 클릭 시 슬라이드인

#### Topbar
- 페이지 제목 + 날짜/근무조
- 현재 시간 (1초 업데이트, `useEffect` + `setInterval`)
- 알림 버튼 (빨간 점 배지)
- 모바일: 햄버거 버튼 표시

#### BottomNav
- 홈 / Todo / 재고 / 관제 / 메뉴 5개 탭
- 현재 경로에 따라 active 탭 강조

---

### 3. 환자 컴포넌트 (patient/)

#### PatientCard
```typescript
interface PatientCardProps {
  patient: Patient
  tasks: NursingTask[]
}
```
- 견본 HTML의 `.patient-card` 구조 그대로 이식
- 좌측 컬러 보더: High=danger, Medium=warn, Low=ok
- 클릭 시 `navigate('/patient/${patient.id}')`
- Framer Motion: `whileHover={{ y: -2 }}` hover 애니메이션

#### AISummaryCard
```typescript
interface AISummaryCardProps {
  summary: string[]
  isLoading?: boolean
}
```
- 파란 그라디언트 배경 (`#EBF4F8` → `#F4F7F9`)
- 체크 아이콘 + 텍스트 리스트
- Phase 1: `patient.aiSummary` 배열 직접 표시
- Phase 2: Claude API 호출 후 스트리밍 표시

#### TodoList
```typescript
interface TodoListProps {
  tasks: NursingTask[]
  patientId: string
}
```
- 체크박스 클릭 → `dispatch(toggleTask(taskId))`
- Framer Motion: 완료 시 체크 아이콘 scale 0→1 애니메이션
- 완료된 항목: `line-through opacity-60`

---

### 4. 수간호사 컴포넌트 (head-nurse/)

#### OccupancyChart (Recharts)
```typescript
// 데이터 구조
const data = [
  { shift: 'Day', rate: 83, count: 50 },
  { shift: 'Evening', rate: 55, count: 33 },
  { shift: 'Night', rate: 35, count: 21 },
]
```
- `<BarChart>` + `<Bar fill="#2C6E8A">`
- 반응형: `<ResponsiveContainer width="100%" height={200}>`

#### SeverityPieChart (Recharts)
```typescript
const data = [
  { name: 'High', value: 10, color: '#C0392B' },
  { name: 'Medium', value: 25, color: '#D4860A' },
  { name: 'Low', value: 15, color: '#2E7D5E' },
]
```
- `<PieChart>` + `<Pie innerRadius={40}>` (도넛 차트)
- 중앙에 총 환자 수 표시

#### OvertimeChart (Recharts)
```typescript
const data = nurses.map(n => ({
  name: n.name,
  overtime: n.overtimeHours,
  fill: n.overtimeHours >= 5 ? '#C0392B' : n.overtimeHours >= 3 ? '#D4860A' : '#2E7D5E'
}))
```
- `<BarChart layout="vertical">` (수평 막대)

---

## Data Flow

### Redux 상태 흐름

```
MSW API 응답
    ↓
dispatch(setPatients / setTasks / setInventory / setNurses)
    ↓
Redux Store 업데이트
    ↓
useSelector로 컴포넌트 구독
    ↓
UI 자동 업데이트
```

### 인증 흐름

```
LoginPage 폼 제출
    ↓
POST /api/auth/login (MSW 처리)
    ↓
성공: dispatch(loginSuccess(user))
    ↓
userRole === 'Nurse' → navigate('/dashboard')
userRole === 'HeadNurse' → navigate('/head-nurse')
```

### Todo 완료 흐름

```
체크박스 클릭
    ↓
dispatch(toggleTask(taskId))
    ↓
tasksSlice: status 'Pending' ↔ 'Completed' 토글
    ↓
PatientCard의 ProgressBar 자동 재계산
    ↓
Framer Motion 체크 애니메이션
```

---

## AI 기능 구현 전략

### Phase 1 — Mock AI (현재)

```typescript
// AISummaryCard.tsx
const AISummaryCard = ({ summary, isLoading }: AISummaryCardProps) => {
  const [displayed, setDisplayed] = useState<string[]>([])

  useEffect(() => {
    // 실제 AI처럼 보이게: 1.5초 로딩 후 mockData 표시
    setDisplayed([])
    const timer = setTimeout(() => {
      setDisplayed(summary)
    }, 1500)
    return () => clearTimeout(timer)
  }, [summary])

  if (isLoading || displayed.length === 0) {
    return <LoadingSpinner text="AI 인수인계 요약 생성 중..." />
  }

  return (
    <div className="ai-card">
      {displayed.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
        >
          ✓ {line}
        </motion.div>
      ))}
    </div>
  )
}
```

### Phase 2 — 실제 Claude API 연동

```typescript
// 백엔드 Node.js/Express 엔드포인트
// POST /api/ai/summarize
app.post('/api/ai/summarize', async (req, res) => {
  const { patientData } = req.body

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `다음 EMR 기록을 읽고, 간호사가 30초 안에 알아야 할 핵심만 최대 5줄로 요약해줘.
      포함: 환자 기본정보, 최근 검사 결과, 진행 중인 처방, 주의사항
      
      환자 데이터: ${JSON.stringify(patientData)}`
    }]
  })

  res.json({ summary: response.content[0].text })
})
```

### AI 자동 재배치 — 규칙 기반 (Phase 1)

```typescript
// utils/overtime.ts
export function getReassignmentSuggestion(nurses: Nurse[], patients: Patient[]) {
  const overloaded = nurses
    .filter(n => n.overtimeHours >= 3)
    .sort((a, b) => b.overtimeHours - a.overtimeHours)

  const available = nurses
    .filter(n => n.overtimeHours < 1.5)
    .sort((a, b) => a.overtimeHours - b.overtimeHours)

  if (overloaded.length === 0 || available.length === 0) return null

  const from = overloaded[0]
  const to = available[0]
  const patientToMove = from.assignedPatients[from.assignedPatients.length - 1]
  const reduction = (from.overtimeHours - to.overtimeHours) * 0.3

  return {
    fromNurse: from,
    toNurse: to,
    patientId: patientToMove,
    message: `🤖 AI 분석: ${from.name}의 환자 1명을 ${to.name}에게 이동하면 오버타임이 ${reduction.toFixed(1)}h 감소합니다.`
  }
}
```

---

## 디자인 시스템

### 색상 토큰 (견본 HTML 기준 동일)

```css
/* src/index.css @theme 블록 */
--color-primary:   #2C6E8A;
--color-primary-d: #1E5470;
--color-bg:        #F0F4F7;
--color-surface:   #FFFFFF;
--color-border:    #DDE3E8;
--color-text:      #1A2B38;
--color-muted:     #6B8090;
--color-danger:    #C0392B;
--color-warn:      #D4860A;
--color-ok:        #2E7D5E;
--color-danger-bg: #FDECEA;
--color-warn-bg:   #FEF3E2;
--color-ok-bg:     #E8F5EE;
```

### 카드 스타일

```
background: #FFFFFF
border-radius: 10px
box-shadow: 0 2px 12px rgba(44,110,138,.09)
hover: box-shadow: 0 6px 22px rgba(44,110,138,.14)
      transform: translateY(-2px)
```

### Framer Motion 애니메이션 패턴

```typescript
// 페이지 진입
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// 카드 호버
whileHover={{ y: -2, boxShadow: '0 6px 22px rgba(44,110,138,.14)' }}

// Todo 체크 완료
initial={{ scale: 0 }}
animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 500 }}

// 리스트 아이템 순차 등장
variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
```

---

## 라우팅 구조

```
/login              → LoginPage (공개)
/dashboard          → DashboardPage (Nurse, HeadNurse)
/patient/:id        → PatientDetailPage (Nurse)
/inventory          → InventoryPage (Nurse)
/head-nurse         → HeadNursePage (HeadNurse 전용)
*                   → /login 리다이렉트
```

## 커스텀 훅

```typescript
// hooks/useMyPatients.ts
export function useMyPatients() {
  const currentUser = useAppSelector(s => s.auth.currentUser)
  const allPatients = useAppSelector(s => s.patients.allPatients)
  const allTasks    = useAppSelector(s => s.tasks.allTasks)

  const myPatients = allPatients
    .filter(p => p.assignedNurseId === currentUser?.id)
    .sort((a, b) => {
      const order = { High: 0, Medium: 1, Low: 2 }
      return order[a.severity] - order[b.severity]
    })

  const getPatientTasks = (patientId: string) =>
    allTasks.filter(t => t.patientId === patientId)

  const getCompletionRate = (patientId: string) => {
    const tasks = getPatientTasks(patientId)
    if (tasks.length === 0) return 0
    return Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100)
  }

  return { myPatients, getPatientTasks, getCompletionRate }
}
```
