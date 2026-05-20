# Claude Team Monitor v1.1
### 설치 및 배포 가이드 — Firebase 실시간 동기화 지원

> Chrome · Edge · iPhone · Android 완전 지원 PWA  
> **여러 PC·기기에서 같은 데이터를 실시간으로 공유** (Firebase Firestore 연동)

---

## 📁 파일 구성

```
claude-team-monitor/
├── index.html               ← 앱 본체 (Firebase 연동 포함)
├── manifest.json            ← PWA 앱 메타 정보
├── sw.js                    ← Service Worker (오프라인 캐시)
└── README.md                ← 이 문서
```

---

## 📋 주요 기능

| 기능 | 설명 |
|------|------|
| **실시간 PC 동기화** | **Firebase Firestore로 모든 PC·기기가 같은 데이터 공유 (NEW)** |
| 실시간 모니터링 | Standard 4인 + Premium 1인 계정 현황 대시보드 |
| 알림 색상 | 정상: 흰색, 종료 3시간 전: 🟡 노란색, 1시간 전: 🔴 빨간색 |
| 이메일 알림 | 사용자 + 관리자 동시 발송 (3h / 1h 전, EmailJS 연동) |
| 계정 정보 | 이름·이메일·프로젝트명·Pain Point·개선목표·희망사용시간 입력/수정 |
| 권한 분리 | 계정 유형·허용시간·토큰한도는 관리자만 수정 가능 |
| 유형별 통계 | Standard vs Premium 평균 사용시간·토큰 사용률 비교 |
| 이력 관리 | 알림·변경 이력 기록 (최신순/오래된순/유형순 정렬, 유형별 필터) |
| PWA | 홈 화면 추가로 앱처럼 실행, 오프라인 캐시 지원 |
| 오프라인 폴백 | 인터넷 끊겨도 localStorage로 정상 동작, 재연결 시 자동 동기화 |

---

## 🆕 v1.0 → v1.1 변경 사항

| 구분 | v1.0 (이전) | v1.1 (현재) |
|------|-------------|-------------|
| 데이터 저장 | 기기별 localStorage 단독 | **Firestore + localStorage 이중화** |
| PC 간 공유 | ❌ 불가 (각 PC가 독립된 앱처럼 동작) | ✅ 실시간 동기화 |
| 다른 PC 변경 반영 | ❌ 새로고침해도 안 보임 | ✅ 자동 화면 갱신 + 토스트 알림 |
| 오프라인 동작 | ✅ | ✅ (재연결 시 자동 sync) |
| 서버 운영 | 불필요 | 불필요 (Google이 호스팅) |

> 💡 **Firebase 설정값을 비워둔 채로 배포하면 v1.0과 동일하게 localStorage 단독 모드로 작동합니다.** Firebase는 선택 사항이지만, 다중 PC 환경에서는 강력히 권장합니다.

---

## STEP 1 — 파일 준비

다운로드한 파일 3개를 같은 폴더에 보관합니다.  
폴더 이름은 자유롭게 지정해도 됩니다.

---

## STEP 2 — Firebase Firestore 연동 (다중 PC 환경 필수)

> **이 단계를 건너뛰면 데이터가 각 PC에만 따로 저장됩니다.**  
> 한 PC에서만 사용한다면 STEP 3로 넘어가도 됩니다.

### 2-1. Firebase 프로젝트 생성

1. **https://console.firebase.google.com** 접속 (Google 계정 로그인)
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름 입력 (예: `claude-team-monitor`) → 계속
4. Google 애널리틱스: **사용 안 함** 선택해도 무방 → 프로젝트 만들기
5. 약 30초 후 생성 완료 → **"계속"**

### 2-2. Firestore Database 활성화

1. 왼쪽 메뉴에서 **"빌드" → "Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 버튼 클릭
3. **위치 선택**: `asia-northeast3 (서울)` 권장
4. **보안 규칙**: 일단 **"테스트 모드로 시작"** 선택 → 다음 → 사용 설정

> ⚠️ 테스트 모드는 30일 후 자동 차단됩니다. 그 전에 STEP 2-5의 보안 규칙으로 강화하세요.

### 2-3. 웹 앱 등록 후 설정값 복사

1. 프로젝트 홈 → 상단 **"</>"** 아이콘 (웹 앱 추가) 클릭
2. 앱 닉네임: `team-monitor` 입력 → **"앱 등록"** 클릭
   - "Firebase Hosting도 설정" 체크박스는 **체크하지 않아도 됩니다**
3. **`firebaseConfig` 객체가 표시됩니다.** 6개 값을 복사:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain:        "claude-team-monitor.firebaseapp.com",
  projectId:         "claude-team-monitor",
  storageBucket:     "claude-team-monitor.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abcdef1234567890"
};
```

### 2-4. index.html에 키 값 붙여넣기

`index.html`을 텍스트 에디터(메모장 · VS Code 등)로 열고, 상단(약 540번째 줄 부근)의 `FIREBASE_CONFIG` 영역을 찾으세요:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId:         "PASTE_YOUR_PROJECT_ID",
  storageBucket:     "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId:             "PASTE_YOUR_APP_ID"
};
```

**6개 `PASTE_...` 값을 2-3에서 복사한 값으로 교체** → 저장

> 💡 따옴표(`"`)는 그대로 두고, 따옴표 안의 값만 교체하세요.

### 2-5. 보안 규칙 강화 (운영 전 필수)

테스트 모드는 30일 후 차단되므로 반드시 강화하세요.

1. Firebase Console → **Firestore Database** → **"규칙"** 탭
2. 아래 내용으로 교체 → **"게시"** 클릭:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /team_monitor/{docId} {
      allow read, write: if true;
    }
  }
}
```

#### 더 엄격한 규칙 (URL이 외부 노출될 가능성이 있을 때)

```
match /team_monitor/{docId} {
  allow read: if true;
  allow write: if request.resource.size() < 1024 * 1024  // 1MB 이하
            && request.resource.data.keys().hasOnly(['accounts','history','cfg','sentToday','_updatedAt','_updatedBy']);
}
```

### 2-6. 여러 팀이 같은 앱을 쓰는 경우

`index.html` 상단의 `FIRESTORE_DOC_PATH`를 팀마다 다른 ID로 변경:

```javascript
const FIRESTORE_DOC_PATH = { collection: 'team_monitor', doc: 'teamA' };
// 다른 팀은 doc: 'teamB' 등으로 분리
```

---

## STEP 3 — 웹 서버에 배포 (HTTPS 필수)

> **왜 HTTPS가 필요한가?**  
> Service Worker(오프라인 기능) · PWA 홈 화면 추가 · Firebase 통신 모두 브라우저 보안 정책상 HTTPS 환경에서만 작동합니다. 로컬 파일(`file://`)로 직접 열면 이메일 알림·오프라인 캐시·앱 설치·클라우드 동기화 기능이 모두 동작하지 않습니다.

### 방법 A — Netlify Drop (가장 쉬움 · 3분 · 무료)

1. 브라우저에서 **https://app.netlify.com/drop** 접속
2. `claude-team-monitor` 폴더를 화면에 **드래그 앤 드롭**
3. 자동으로 `https://랜덤이름.netlify.app` URL 발급
4. 발급된 URL을 팀원들과 공유

> 💡 무료 플랜으로 충분합니다. 회원가입 없이도 임시 배포 가능(24시간). 영구 URL이 필요하면 무료 회원가입 후 배포하세요.

### 방법 B — GitHub Pages (무료 · 영구 호스팅)

1. **https://github.com** 로그인 후 새 저장소(Repository) 생성
   - Repository name: `team-monitor` (원하는 이름)
   - **Public** 선택 → Create repository
2. 파일 3개 업로드
   - `"uploading an existing file"` 클릭 → 파일 3개 드래그 → Commit changes
3. **Settings** → **Pages** → Branch: `main` / `/(root)` 선택 → **Save**
4. 약 1~2분 후 아래 URL로 접근 가능
   ```
   https://[GitHub계정].github.io/team-monitor/
   ```

> ⚠️ **공개 저장소**에 Firebase 설정값을 올리는 것이 우려된다면 Private 저장소 + Netlify 연동을 사용하세요. 단, Firebase `apiKey`는 공개되어도 무관한 클라이언트용 식별자입니다 (실제 보안은 STEP 2-5 보안 규칙으로 통제).

### 방법 C — 사내 웹서버 / NAS

파일 3개를 웹서버 루트에 업로드합니다. HTTPS 인증서가 설정된 서버여야 PWA 전체 기능이 작동합니다.

---

## STEP 4 — PC 브라우저에서 열기

배포된 URL을 주소창에 입력하면 바로 실행됩니다. 별도 설치가 필요 없습니다.

#### 🟦 Chrome
- 주소창에 배포 URL 입력 → 엔터
- 바탕화면 앱으로 설치: 주소창 오른쪽 끝 **⊕ 아이콘** 클릭 → 설치

#### 🟦 Microsoft Edge
- 주소창에 배포 URL 입력 → 엔터
- 바탕화면 앱으로 설치: 메뉴 **(···)** → **앱** → **이 사이트를 앱으로 설치**

---

## STEP 5 — 스마트폰 홈 화면에 설치 (PWA)

#### 🍎 iPhone / iPad (Safari 필수)

1. **Safari**에서 배포 URL 접속
2. 하단 공유 버튼 **(□↑)** 탭
3. **"홈 화면에 추가"** 선택
4. 이름 확인 후 **"추가"** 탭
5. 홈 화면에서 앱 아이콘으로 실행

> ⚠️ **반드시 Safari를 사용해야 합니다.**  
> iPhone의 Chrome·Firefox 앱에서는 홈 화면 추가가 지원되지 않습니다.

#### 🤖 Android (Chrome)

1. **Chrome**에서 배포 URL 접속
2. 우측 상단 메뉴 **(⋮)** 탭
3. **"앱 설치"** 또는 **"홈 화면에 추가"** 선택
4. 홈 화면에서 앱 아이콘으로 실행

---

## STEP 6 — Firebase 동작 확인

배포 후 반드시 연동 상태를 확인하세요.

1. 배포된 URL 접속 → 관리자 로그인 (초기 비밀번호: `admin1234`)
2. **설정 탭** → **"클라우드 동기화 (Firebase)"** 카드 확인
   - 🟢 **활성** → 정상
   - 🔴 **미연동** → STEP 2-4의 키 값을 다시 확인

### 동기화 검증 절차

| 단계 | 작업 |
|------|------|
| 1 | **PC A**에서 임의 계정의 프로젝트명 수정 → 저장 |
| 2 | **PC B**에서 같은 URL 접속 → 동일 데이터가 보이는지 확인 |
| 3 | **PC A**에서 다시 수정 → **PC B 화면이 자동 갱신**되며 토스트("다른 기기의 변경사항이 동기화되었습니다") 표시 확인 |

---

## STEP 7 — EmailJS 이메일 알림 연동

EmailJS는 서버 없이 프론트엔드만으로 이메일을 발송할 수 있는 서비스입니다. 무료 플랜 기준 **월 200건** 발송 가능합니다.

> ✅ **아래 키가 앱에 기본 설정되어 있습니다. 별도 입력 없이 바로 사용 가능합니다.**

| 항목 | 값 |
|------|-----|
| Service ID | `service_hg9u07f` |
| Template ID | `template_awbbtbd` |
| Public Key | `UhAZIK2qfsYKPVNB4` |

설정 탭 → EmailJS 연동 → **테스트 발송** 버튼으로 정상 동작을 확인하세요.

### 키를 교체하려면

| 단계 | 내용 |
|------|------|
| 1. 회원가입 | https://www.emailjs.com 접속 → 무료 가입 |
| 2. 이메일 서비스 연결 | Email Services → Gmail 또는 Outlook 연결 → **Service ID** 복사 |
| 3. 템플릿 생성 | Email Templates → New Template → **Template ID** 복사 |
| 4. 템플릿 변수 입력 | 본문에 아래 표의 변수들 삽입 |
| 5. Public Key 복사 | Account → General → **Public Key** 복사 |
| 6. 앱에 입력 | 설정 탭 → EmailJS 연동 → 세 값 입력 → 저장 → 테스트 발송 |

### 템플릿 변수 목록

| 변수명 | 내용 |
|--------|------|
| `{{to_email}}` | 수신자 이메일 주소 |
| `{{to_name}}` | 수신자 이름 |
| `{{account_type}}` | Standard 또는 Premium |
| `{{task_name}}` | 프로젝트 / 과제명 |
| `{{remaining_time}}` | 잔여 시간 (예: 2시간 30분 남음) |
| `{{alert_type}}` | 종료 3시간 전 알림 / 1시간 전 긴급 알림 |
| `{{token_used}}` | 토큰 사용량 (예: 78K / 100K) |
| `{{admin_email}}` | 관리자 이메일 (CC 참조용) |

### 이메일 템플릿 예시

```
제목: [Claude Monitor] {{to_name}}님 계정 알림 — {{alert_type}}

안녕하세요, {{to_name}}님.

{{account_type}} 계정의 사용 시간이 임박했습니다.

  프로젝트: {{task_name}}
  잔여 시간: {{remaining_time}}
  토큰 사용: {{token_used}}
  알림 유형: {{alert_type}}

원활한 업무를 위해 사용 시간을 확인해 주세요.

— Claude Team Monitor 자동 발송
```

---

## 🔐 권한 구조

앱은 **일반 사용자**와 **관리자** 두 가지 권한으로 운영됩니다.

### 일반 사용자 (로그인 없이 접근 가능)

| 탭 | 가능한 작업 |
|----|-------------|
| 대시보드 | 전체 계정 현황·통계 조회 |
| 계정관리 | 프로젝트명·Pain Point·개선목표·희망사용시간 수정 |
| 계정관리 | 계정 유형·허용시간·토큰한도 **조회만** (수정 불가) |
| 이력 | 알림·변경 이력 조회 및 정렬/필터 |
| 설정 | 접근 불가 (관리자 로그인 필요) |

### 관리자 (비밀번호 로그인 후 접근)

| 탭 | 가능한 작업 |
|----|-------------|
| 계정관리 | 계정 추가 / 삭제 |
| 계정관리 | 계정 유형·허용시간·토큰한도 수정 |
| 설정 | Firebase 연동 상태 확인, EmailJS 연동, 알림 설정, 비밀번호 변경, 자동 갱신 주기 |

---

## 📝 계정 정보 입력 항목

계정관리 탭의 **수정** 버튼(또는 계정 추가)을 누르면 아래 항목을 입력할 수 있습니다.

| 항목 | 수정 권한 | 설명 |
|------|-----------|------|
| 사용자 이름 | 모든 사용자 | 계정 담당자 이름 |
| 이메일 | 모든 사용자 | 알림 수신 이메일 |
| 프로젝트/과제명 | 모든 사용자 | 현재 진행 중인 프로젝트명 |
| Pain Point | 모든 사용자 | 현재 업무에서 겪는 어려움 |
| 개선 목표 | 모든 사용자 | Claude 활용으로 기대하는 개선 효과 |
| 희망 사용시간 | 모든 사용자 | 사용자가 원하는 이용 시간 (시간 단위) |
| 계정 유형 | **관리자 전용** | Standard / Premium |
| 사용 허용 시간 | **관리자 전용** | 실제 허용되는 최대 사용 시간 |
| 토큰 한도 | **관리자 전용** | 100K / 500K / 1M |

> 💡 **희망 사용시간**을 입력하면 계정 카드에 허용시간 대비 달성률(%)이 함께 표시됩니다.

---

## 🔄 데이터 동기화 동작 방식

1. **앱 시작 시**: Firestore에서 데이터를 먼저 로드. 없으면 localStorage의 데이터를 클라우드에 업로드(시드).
2. **데이터 수정 시**: localStorage에 즉시 저장 + 200ms 디바운스 후 Firestore에 업로드.
3. **다른 PC가 수정 시**: Firestore가 변경을 푸시 → 현재 화면 자동 갱신 + 토스트 알림.
4. **오프라인 시**: localStorage만 사용. 재연결되면 자동으로 클라우드와 동기화 재개.

> ⚠️ **동시 편집 충돌**: 두 PC가 정확히 같은 시점에 다른 값을 저장하면 **나중에 저장한 쪽이 이깁니다** (last-write-wins). 일반 운영에서는 문제되지 않지만, 동시에 같은 계정을 수정하는 것은 피하세요.

---

## 📊 Firebase 무료 한도

Firebase Firestore 무료 플랜(Spark) 한도:

| 항목 | 일일 한도 | 본 앱 예상 사용량 (5명 기준) |
|------|----------|------|
| 문서 읽기 | 50,000 / 일 | 200 ~ 500 / 일 |
| 문서 쓰기 | 20,000 / 일 | 50 ~ 200 / 일 |
| 저장 용량 | 1 GiB | < 100 KB |
| 네트워크 송신 | 10 GiB / 월 | < 50 MB / 월 |

> ✅ 본 앱은 단일 문서를 공유하므로 **무료 한도를 초과할 가능성이 거의 없습니다**.

---

## ❓ 자주 묻는 질문

### Firebase 동기화 관련

| 증상 | 해결 방법 |
|------|-----------|
| 설정 탭에 "미연동"으로 표시됨 | `index.html`의 `FIREBASE_CONFIG`에 `PASTE_...` 값이 남아있는지 확인 |
| 콘솔에 `Missing or insufficient permissions` 오류 | Firestore 보안 규칙(STEP 2-5)을 게시했는지 확인 |
| 콘솔에 `Firebase: Error (auth/...)` 오류 | `apiKey` · `projectId` 값 재확인 |
| 다른 PC 변경이 즉시 반영되지 않음 | 인터넷 연결 상태 확인. 오프라인이면 재연결 시 자동 동기화됨 |
| 데이터를 모두 초기화하고 싶음 | Firebase Console → Firestore → `team_monitor/shared` 문서 삭제 |
| Firebase 사용을 중단하고 싶음 | `FIREBASE_CONFIG.apiKey`를 `"PASTE_YOUR_API_KEY"`로 되돌리면 localStorage 단독 모드 복귀 |
| 코드 수정 후 변경이 안 보임 | 브라우저 강력 새로고침: `Ctrl + Shift + R` (Mac: `Cmd + Shift + R`) |

### 일반 사용 관련

| 증상 | 해결 방법 |
|------|-----------|
| 앱이 열리지 않는다 | HTTPS URL인지 확인. `http://`로 접근 시 일부 기능 제한 |
| 홈 화면 추가가 안 보인다 (iPhone) | Safari 앱으로 접속했는지 확인. Chrome 앱에서는 불가 |
| 이메일이 발송되지 않는다 | 설정 탭 → EmailJS 연동 상태 확인 → 테스트 발송 버튼으로 진단 |
| 설정 탭에 접근이 안 된다 | 관리자 로그인 필요. 초기 비밀번호: `admin1234` |
| 계정 추가/삭제 버튼이 안 보인다 | 관리자 로그인 후 계정관리 탭으로 이동 |
| 계정 유형·허용시간 수정이 안 된다 | 관리자 로그인 후 수정 버튼 → 관리자 전용 설정 구역에서 수정 |
| 한글이 깨져 보인다 | 브라우저를 최신 버전으로 업데이트. 인터넷 연결 상태에서 Google Fonts 로드 필요 |

---

## 📋 빠른 참조

| 항목 | 내용 |
|------|------|
| **데이터 저장 방식** | **Firestore (클라우드) + localStorage (캐시) 이중화** |
| **PC 간 동기화** | **Firebase 활성 시 실시간 자동, 미설정 시 PC별 독립 저장** |
| Firebase 무료 한도 | 일 50K 읽기, 20K 쓰기 (5명 기준 충분) |
| 초기 관리자 비밀번호 | `admin1234` (첫 로그인 후 즉시 변경 권장) |
| 자동 갱신 주기 | 30분 / 1시간(기본) / 4시간 / 12시간 |
| 3시간 전 알림 | 🟡 노란색 카드 + 이메일 발송 |
| 1시간 전 알림 | 🔴 빨간색 카드 + 이메일 발송 |
| 이력 정렬 | 최신순 / 오래된순 / 유형순 |
| 이력 필터 | 전체 / 경고 / 긴급 / 메일 / 변경 |
| EmailJS 무료 한도 | 월 200건 (Standard 4명 + Premium 1명 기준 충분) |
| PWA 오프라인 | Service Worker 캐시로 인터넷 없이도 최근 데이터 확인 가능 |

---

## 🚀 빠른 시작 체크리스트

처음 배포할 때 순서대로 확인:

- [ ] STEP 2-1 ~ 2-3: Firebase 프로젝트 생성 및 웹 앱 등록
- [ ] STEP 2-4: `index.html`에 6개 키 값 붙여넣기
- [ ] STEP 2-5: Firestore 보안 규칙 게시
- [ ] STEP 3: Netlify Drop 또는 GitHub Pages에 파일 3개 업로드
- [ ] STEP 6: 관리자 로그인 → 설정 탭에서 "클라우드 동기화: 활성" 확인
- [ ] 두 PC에서 동시 접속하여 동기화 검증
- [ ] STEP 7: EmailJS 테스트 발송 확인
- [ ] 관리자 비밀번호 변경 (`admin1234` → 새 비밀번호)
- [ ] 팀원들에게 배포 URL 공유

---

*Claude Team Monitor v1.1 — 설치 및 배포 가이드 (Firebase Firestore 연동 포함)*
