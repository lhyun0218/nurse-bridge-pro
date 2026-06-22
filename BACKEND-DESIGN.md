# Nurse-Bridge PRO — 백엔드 설계 문서 v1.0

> 작성일: 2026-06  
> 현재 프론트엔드: React + Redux + MSW(Mock)  
> 목표: MSW → 실제 백엔드로 교체 시 프론트 코드 변경 없이 URL만 전환

---

## 1. 기술 스택 권장

| 계층 | 기술 | 이유 |
|------|------|------|
| 런타임 | Node.js 20 LTS | 프론트와 동일 언어(TS), 생태계 풍부 |
| 프레임워크 | Fastify v4 | Express 대비 3배 빠름, TypeScript 1급 지원 |
| ORM | Prisma | TS 타입 자동 생성, 마이그레이션 관리 |
| DB | PostgreSQL 16 | JSONB(활력징후 이력), 강력한 쿼리 |
| 실시간 | WebSocket (ws) | 활력징후 실시간 스트림 |
| 인증 | JWT (access 15m + refresh 7d) | 무상태 확장성 |
| AI | Anthropic Claude API | 환자 요약, 근무표 AI 분석 |
| 근무표 최적화 | Python FastAPI 마이크로서비스 | OR-Tools 최적화 엔진 |
| 캐시 | Redis | 세션, 실시간 활력징후 임시 저장 |
| 파일 저장 | AWS S3 / MinIO | 인수인계 보고서 PDF |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│              React SPA (Vite)                   │
│         현재: MSW Mock → 전환: 실제 API          │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS REST + WebSocket
┌─────────────────▼───────────────────────────────┐
│           Fastify API Gateway                   │
│  /api/v1/*  JWT 인증  Rate Limit  CORS          │
└──┬──────────┬───────────┬────────────┬──────────┘
   │          │           │            │
   ▼          ▼           ▼            ▼
 Auth      Patient     Nurse       Schedule
 Service   Service     Service     Optimizer
                                  (Python)
   │          │           │
   └──────────┴───────────┘
              │
    ┌─────────▼─────────┐
    │   PostgreSQL 16    │
    │   Redis Cache      │
    └───────────────────┘
              │
    ┌─────────▼─────────┐
    │  Claude API (AI)   │
    │  환자 요약          │
    │  근무표 분석        │
    └───────────────────┘
```

---

## 3. API 엔드포인트 스펙

### 3.1 인증 (Auth)

```
POST   /api/v1/auth/login          로그인 (employeeId + password)
POST   /api/v1/auth/refresh        액세스 토큰 갱신
POST   /api/v1/auth/logout         로그아웃 (refresh token 무효화)
POST   /api/v1/auth/invite         초대 링크 생성 (HeadNurse 전용)
GET    /api/v1/auth/invite/:token  초대 링크 검증
```

**로그인 응답:**
```json
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "N001",
    "name": "이현규",
    "employeeId": "EMP001",
    "role": "Nurse",
    "shiftType": "Day"
  }
}
```

---

### 3.2 간호사 (Nurses)

```
GET    /api/v1/nurses              전체 간호사 목록 (HeadNurse)
GET    /api/v1/nurses/:id          간호사 상세
PUT    /api/v1/nurses/:id          간호사 정보 수정 (HeadNurse)
GET    /api/v1/nurses/:id/schedule 간호사 근무 일정
GET    /api/v1/nurses/online       현재 근무 중인 간호사 목록
```

---

### 3.3 환자 (Patients)

```
GET    /api/v1/patients            담당 환자 목록 (assignedNurseId 자동 필터)
POST   /api/v1/patients            환자 등록 (HeadNurse)
GET    /api/v1/patients/:id        환자 상세
PUT    /api/v1/patients/:id        환자 정보 수정 (HeadNurse)
DELETE /api/v1/patients/:id        환자 퇴원 처리 (HeadNurse)
GET    /api/v1/patients/:id/vitals 활력징후 이력 (시계열)
POST   /api/v1/patients/:id/vitals 활력징후 기록 추가
GET    /api/v1/patients/:id/notes  간호 노트 목록
POST   /api/v1/patients/:id/notes  간호 노트 작성
DELETE /api/v1/patients/:id/notes/:noteId  노트 삭제
```

---

### 3.4 간호 업무 (Tasks)

```
GET    /api/v1/tasks               전체 업무 목록
GET    /api/v1/tasks/patient/:id   환자별 업무
PATCH  /api/v1/tasks/:taskId/toggle  완료/미완료 토글
POST   /api/v1/tasks               업무 추가 (HeadNurse)
```

---

### 3.5 재고 (Inventory)

```
GET    /api/v1/inventory           재고 목록
PATCH  /api/v1/inventory/:id/consume  소비 처리
POST   /api/v1/inventory/:id/request  청구 요청
POST   /api/v1/inventory/bulk-request 일괄 청구
GET    /api/v1/inventory/history   소비 이력
```

---

### 3.6 근무 일정 (Schedule)

```
GET    /api/v1/schedule            월별 근무 일정 (year, month 쿼리)
POST   /api/v1/schedule/generate   AI 근무표 자동 생성 (HeadNurse)
PUT    /api/v1/schedule/:id        근무 일정 수정
GET    /api/v1/schedule/share/:token  공유 URL 조회 (인증 불필요)
POST   /api/v1/schedule/share      공유 URL 발급 (HeadNurse)
GET    /api/v1/schedule/export     Excel 내보내기
```

**근무표 자동 생성 요청:**
```json
{
  "year": 2026,
  "month": 6,
  "nurseIds": ["N001", "N002", "N003"],
  "constraints": {
    "maxNightShiftsPerMonth": 8,
    "minRestDaysBetweenNights": 2,
    "noConsecutiveNights": true,
    "fairDistribution": true
  }
}
```

---

### 3.7 AI 기능 (AI)

```
POST   /api/v1/ai/summarize        환자 상태 AI 요약
POST   /api/v1/ai/schedule-analyze 근무표 AI 분석/제안
POST   /api/v1/ai/chat             근무표 관련 질문 채팅
```

**AI 요약 요청:**
```json
{
  "patientId": "P001",
  "vitals": { ... },
  "recentLabs": [ ... ],
  "medications": [ ... ],
  "recentNotes": [ ... ]
}
```

**AI 요약 응답:**
```json
{
  "summary": [
    "혈압 안정적 (130/85), 약물 조절 중",
    "SpO₂ 94%로 산소 요법 지속 필요",
    "오늘 오전 통증 7/10 호소, PRN 진통제 투여됨"
  ],
  "riskLevel": "medium",
  "recommendations": ["2시간마다 활력징후 체크 권장"]
}
```

---

### 3.8 인수인계 보고서 (Reports)

```
POST   /api/v1/reports             보고서 생성 및 저장
GET    /api/v1/reports             보고서 목록
GET    /api/v1/reports/:id         보고서 상세
GET    /api/v1/reports/:id/pdf     PDF 다운로드
```

---

### 3.9 알림 (Notifications) — WebSocket

```
WS     /ws/vitals                  실시간 활력징후 스트림
WS     /ws/alerts                  임계값 초과 알림 푸시
```

**WebSocket 메시지 형식:**
```json
{
  "type": "VITAL_ALERT",
  "patientId": "P001",
  "patientName": "김철수",
  "roomNumber": "101",
  "alert": "SpO₂ 91% — 기준치 이하",
  "severity": "danger",
  "timestamp": 1748000000000
}
```

---

## 4. DB 스키마 (PostgreSQL + Prisma)

```prisma
model Nurse {
  id               String   @id
  employeeId       String   @unique
  name             String
  passwordHash     String
  role             Role
  shiftType        ShiftType
  status           NurseStatus
  overtimeHours    Float    @default(0)
  workStart        String
  workEnd          String
  gender           String?
  yearsOfExperience Int?
  assignedPatients Patient[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Patient {
  id              String   @id
  medicalRecordNo String   @unique
  name            String
  age             Int
  gender          String
  roomNumber      String
  diagnosis       String[]
  severity        Severity
  admissionDate   DateTime
  dischargeDate   DateTime?
  assignedNurse   Nurse    @relation(fields: [assignedNurseId], references: [id])
  assignedNurseId String
  vitalSigns      VitalRecord[]
  medications     Medication[]
  tasks           NursingTask[]
  notes           NursingNote[]
  labs            LabResult[]
  createdAt       DateTime @default(now())
}

model VitalRecord {
  id              String   @id @default(uuid())
  patient         Patient  @relation(fields: [patientId], references: [id])
  patientId       String
  bloodPressure   String
  heartRate       Float
  temperature     Float
  respiratoryRate Float
  oxygenSaturation Float
  bloodGlucose    Float?
  painScore       Int?
  gcs             Int?
  recordedAt      DateTime @default(now())
  recordedBy      String   // nurseId
}

model NursingNote {
  id          String       @id @default(uuid())
  patient     Patient      @relation(fields: [patientId], references: [id])
  patientId   String
  nurseId     String
  nurseName   String
  category    NoteCategory
  content     String
  isPinned    Boolean      @default(false)
  createdAt   DateTime     @default(now())
}

model Schedule {
  id        String    @id @default(uuid())
  nurseId   String
  date      DateTime
  shiftType ShiftType
  isAuto    Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([nurseId, date])
}

model ScheduleShare {
  id        String   @id @default(uuid())
  token     String   @unique
  year      Int
  month     Int
  wardId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role          { Nurse HeadNurse Admin }
enum ShiftType     { Day Evening Night }
enum Severity      { High Medium Low }
enum NurseStatus   { Active OnBreak ShiftEnd }
enum NoteCategory  { general observation medication procedure education }
```

---

## 5. AI 연동 설계

### 5.1 환자 요약 (Claude API)

```typescript
// 백엔드 서비스 레이어
async function generatePatientSummary(patientId: string): Promise<string[]> {
  const patient = await db.patient.findUnique({
    where: { id: patientId },
    include: {
      vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 10 },
      medications: true,
      notes: { orderBy: { createdAt: 'desc' }, take: 5 },
      labs: { orderBy: { recordedAt: 'desc' }, take: 5 },
    }
  })

  const prompt = buildSummaryPrompt(patient)

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  return parseSummaryResponse(response.content[0].text)
}
```

### 5.2 근무표 AI 분석 (Claude API)

```typescript
async function analyzeSchedule(schedule: Schedule[], query: string) {
  const scheduleText = formatScheduleForAI(schedule)

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    system: `당신은 병원 간호 근무표 전문가입니다. 
             근무 불균형, 연속 야간 근무, 오버타임 위험을 분석합니다.`,
    messages: [
      { role: 'user', content: `근무표:\n${scheduleText}\n\n질문: ${query}` }
    ]
  })

  return response.content[0].text
}
```

### 5.3 근무표 자동 생성 (Python OR-Tools 마이크로서비스)

```python
# schedule_optimizer/main.py (FastAPI)
from ortools.sat.python import cp_model

def generate_schedule(nurses: list, days: int, constraints: dict):
    model = cp_model.CpModel()

    # 변수: shifts[nurse][day][shift] = 0 or 1
    shifts = {}
    for n in range(len(nurses)):
        for d in range(days):
            for s in range(3):  # 0=Day, 1=Evening, 2=Night
                shifts[(n, d, s)] = model.NewBoolVar(f'shift_n{n}_d{d}_s{s}')

    # 제약조건 1: 하루 한 교대만
    for n in range(len(nurses)):
        for d in range(days):
            model.AddAtMostOne(shifts[(n, d, s)] for s in range(3))

    # 제약조건 2: 연속 야간 금지
    if constraints.get('noConsecutiveNights'):
        for n in range(len(nurses)):
            for d in range(days - 1):
                model.Add(shifts[(n, d, 2)] + shifts[(n, d+1, 2)] <= 1)

    # 제약조건 3: 야간 후 최소 휴식
    min_rest = constraints.get('minRestDaysBetweenNights', 2)
    for n in range(len(nurses)):
        for d in range(days - min_rest):
            for r in range(1, min_rest + 1):
                model.Add(
                    shifts[(n, d, 2)] + sum(shifts[(n, d+r, s)] for s in range(3)) <= 1
                )

    # 목표: 근무 균등 분배 최대화
    model.Maximize(
        sum(shifts[(n, d, s)] for n in range(len(nurses))
                               for d in range(days)
                               for s in range(3))
    )

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.Solve(model)

    return extract_solution(solver, shifts, nurses, days)
```

---

## 6. MSW → 실제 백엔드 전환 계획

### Phase 1 (현재) — MSW Mock
- 모든 API는 MSW가 인터셉트
- 데이터는 `mockData.ts`에서 인메모리 관리
- 프론트엔드 개발/데모에 충분

### Phase 2 — 백엔드 개발
- Fastify API 서버 구축
- Prisma + PostgreSQL 연결
- JWT 인증 구현
- MSW 핸들러와 동일한 URL/응답 형식 유지

### Phase 3 — 전환
```typescript
// src/config/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? ''
// .env.development: VITE_API_URL="" (MSW가 인터셉트)
// .env.production:  VITE_API_URL="https://api.nurse-bridge.com"
```

프론트 코드 변경 없이 환경변수만 바꾸면 전환 완료.

### Phase 4 — AI 연동
- Claude API 키 서버 측 보관 (클라이언트 노출 금지)
- AI 요약 캐싱 (Redis, TTL 10분)
- 근무표 optimizer 마이크로서비스 연결

---

## 7. 보안 설계

| 항목 | 방법 |
|------|------|
| 비밀번호 | bcrypt (saltRounds 12) |
| 토큰 | JWT HS256, access 15분, refresh 7일 |
| HTTPS | Let's Encrypt (필수) |
| CORS | 허용 도메인 화이트리스트 |
| Rate Limit | 로그인 5회/분, API 100회/분 |
| AI API 키 | 서버 환경변수, 절대 클라이언트 노출 금지 |
| 공유 URL | UUID v4 토큰, 만료일 설정 |
| 환자 데이터 | DB 암호화 at-rest (PostgreSQL TDE) |
| 전송 구간 | TLS 1.3 |

---

## 8. 현재 MSW 핸들러 개선 사항

실제 백엔드 전환을 위해 MSW 핸들러에 추가할 것들:

```typescript
// 추가 필요한 MSW 핸들러들
http.post('/api/v1/patients',          ...)  // 환자 등록
http.put('/api/v1/patients/:id',        ...)  // 환자 수정
http.post('/api/v1/patients/:id/notes', ...)  // 노트 저장
http.get('/api/v1/patients/:id/vitals', ...)  // 활력징후 이력
http.post('/api/v1/schedule/generate',  ...)  // 근무표 자동 생성
http.post('/api/v1/ai/summarize',       ...)  // AI 요약 Mock
http.post('/api/v1/reports',            ...)  // 보고서 저장
http.get('/api/v1/schedule/export',     ...)  // Excel 내보내기
```

---

## 9. 개발 우선순위

| 순서 | 항목 | 예상 시간 |
|------|------|----------|
| 1 | Fastify 서버 기본 구조 + Prisma 설정 | 1일 |
| 2 | 인증 (JWT, 로그인/로그아웃) | 0.5일 |
| 3 | 간호사/환자 CRUD API | 1일 |
| 4 | 실시간 WebSocket (활력징후) | 1일 |
| 5 | Claude API 연동 (환자 요약) | 0.5일 |
| 6 | 근무표 자동 생성 (Python) | 2일 |
| 7 | Excel 내보내기 | 0.5일 |
| 8 | 공유 URL, 초대 시스템 | 0.5일 |
| **합계** | | **약 7일** |

---

*이 문서는 Nurse-Bridge PRO 백엔드 구현의 기준이 됩니다.*  
*MSW 핸들러와 API 스펙을 동기화하면 프론트 코드 변경 없이 Phase 2로 전환 가능합니다.*
