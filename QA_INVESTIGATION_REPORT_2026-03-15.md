# ProjectForge — QA Investigation Report (Full Audit)
**Date:** 2026-03-15  
**Role:** QA Investigator  
**Target:** Production (`https://projectforge-e3q.pages.dev`) + codebase audit (`/root/.openclaw/workspace/projectforge`)

---

## 1) Scope & Methodology
تم تنفيذ مراجعة شاملة على:
1. **اختبارات API** (Auth, Survey, Recommendations, Sandbox, Success, Teams, User Projects)
2. **اختبارات UI** عبر Playwright (Desktop + Mobile)
3. **تحليل الكود** (Frontend + Functions + TypeScript checks)
4. **تحليل الأمان** (Secrets exposure, hashing, repo hygiene)

---

## 2) Executive Summary

### ✅ يعمل بشكل جيد حالياً
- التطبيق يفتح بشكل طبيعي (Splash يختفي).
- التنقل بين الصفحات الأساسية يعمل على Desktop وMobile.
- API الأساسية تعمل (Register/Login/Me/Projects/Skills/Survey/Sandbox/Success/Teams/User Projects).
- **Sandbox يعتمد على AI فعلياً الآن** (يرجع `ai_analysis` مع مخطط Mermaid نصي).
- **Recommendations** أصبحت تدعم إضافة توصية ديناميكية من LLM (إضافة فوق القائمة الثابتة).

### ⚠️ ما زالت توجد مشاكل مهمة تحتاج علاج
- CORS preflight ناقص في أغلب endpoints (OPTIONS ترجع 405).
- مخرجات Mermaid من LLM أحياناً غير صالحة syntax (Console parse errors).
- الـ Loading Overlay قد يمنع النقر في حالات التأخير الطويل للـ AI.
- `node_modules` داخل Git (2414 ملف متتبع) — ضرر كبير على جودة المستودع.
- hashing لكلمات المرور غير آمن إنتاجياً (SHA-256 مباشر بدون salt/KDF).
- `src/index.ts` فيه أخطاء TypeScript وغير متزامن مع المعمارية الحالية (Functions-based).

---

## 3) Key Question from Product Owner
> "هل المشاريع ثابتة؟ وهل AI فعلاً شغال؟"

### الجواب:
- **نعم، يوجد مجموعة مشاريع ثابتة (Fallback)** لضمان عمل النظام عند فشل AI.
- **ونعم، AI شغال فعلاً الآن** في:
  1) Sandbox analysis (ai_analysis)
  2) Dynamic project suggestion داخل recommendations

هذا سلوك مقصود: **Hybrid model** = ثبات + ذكاء ديناميكي.

---

## 4) Test Results (Evidence)

## A) API Verification (Production)
- `GET /api/projects` → 200 ✅
- `GET /api/skills` → 200 ✅
- `POST /api/auth/register` → 200 ✅
- `GET /api/auth/me` (with token) → 200 ✅
- `POST /api/skills/survey` → 200 ✅
- `GET /api/recommendations`:
  - قبل survey → 400 (expected) ✅
  - بعد survey → 200 + توصية AI ديناميكية ✅
- `POST /api/sandbox/generate` → 200 + `ai_analysis` non-empty ✅
- `POST /api/success/estimate` → 200 ✅
- `GET /api/teams/match` → 200 ✅
- `POST/GET /api/user/projects` → 200 ✅

## B) Frontend UI (Playwright)
### Desktop + Mobile
- Home/Survey/Recommendations/Sandbox/Projects/Success/Teams -> accessible ✅
- Skill screen mobile overflow: تحسن واضح ✅
- Sandbox AI section يظهر لكن يعتمد على صحة Mermaid text

---

## 5) Findings by Severity

## 🔴 Critical

### C1) Repository Hygiene: `node_modules` committed to git
- **Evidence:** `git ls-files | grep '^node_modules/'` count = 2414
- **Impact:** repo bloat, PR noise, security/supply-chain risk, slow CI
- **Fix:**
  - Add `node_modules/` to `.gitignore`
  - Remove from git tracking (`git rm -r --cached node_modules`)
  - Commit cleanup

### C2) Password hashing insecure for production
- **Current:** direct SHA-256
- **Impact:** weak against brute-force/rainbow attacks
- **Fix:** use strong KDF (Argon2id / scrypt / PBKDF2 with salt + iterations)

---

## 🟠 High

### H1) CORS preflight inconsistent
- **Evidence:**
  - `OPTIONS /api/projects` → 405
  - `OPTIONS /api/skills` → 405
  - `OPTIONS /api/recommendations` → 405
  - ... بينما بعض endpoints فقط ترجع 200
- **Impact:** failures for strict browser clients / external integrations
- **Fix:** add `onRequestOptions` to all API routes with consistent headers

### H2) Mermaid parse errors from AI output
- **Evidence:** browser console parse errors أثناء rendering diagram
- **Impact:** section shows analysis text لكن الرسم قد يفشل
- **Fix:**
  - validate diagram blocks before rendering
  - fallback to code block when parsing fails
  - tighten prompt to force strict Mermaid grammar

### H3) Loading overlay can block UX under long AI latency
- **Evidence:** automated interactions blocked by `#loadingOverlay` intercepting clicks
- **Impact:** user perceives freeze / stuck actions
- **Fix:**
  - timeout + cancel button for long AI calls
  - non-blocking overlay or scoped loader per section

---

## 🟡 Medium

### M1) Duplicated static datasets across endpoints
- Projects/skills arrays موجودة في عدة ملفات
- **Impact:** drift/inconsistency risk
- **Fix:** centralize data source (single module or D1 table)

### M2) `src/index.ts` TS errors + stale architecture
- **Evidence:** `npx tsc --noEmit` reports compile errors in `src/index.ts`
- **Impact:** confusion, technical debt, onboarding friction
- **Fix:** remove unused legacy backend or fully migrate and make build green

### M3) Fragile AI JSON parsing in recommendations
- يعتمد على regex extraction من LLM text
- **Impact:** malformed AI output could break endpoint
- **Fix:** enforce JSON schema + retry + safe fallback object

### M4) Local git remote contains token (local security hygiene)
- `.git/config` contains tokenized remote URL locally
- **Impact:** local secret leakage risk if config shared
- **Fix:** replace remote URL with tokenless URL and use credential helper

---

## 6) Functional Clarifications

### Why `[object Object]` appeared?
كان بسبب render مباشر لمصفوفة كائنات resources.skills.  
**Status:** تم إصلاحه (render by `item.name`).

### Is Sandbox AI really active now?
**Yes.** endpoint `/api/sandbox/generate` now returns long AI-generated analysis text and diagram blocks when key/model respond.

---

## 7) Recommended Remediation Plan

### Phase 1 (Immediate, same day)
1. Normalize CORS OPTIONS on all routes
2. Add Mermaid-safe renderer + fallback
3. Improve loading UX (timeout/cancel + spinner scope)

### Phase 2 (Security)
1. Replace password hashing with proper KDF
2. Remove tracked `node_modules`
3. sanitize local secret handling workflow

### Phase 3 (Architecture)
1. Centralize project/skills data
2. Resolve/remove stale `src/index.ts`
3. Add contract tests for AI response parsing

---

## 8) Final QA Verdict
**Current state: Functional but not yet "production-hard".**  
- Feature-wise: ✅ usable and AI-enabled  
- Reliability/Security/maintainability: ⚠️ needs remediation above

---

## 9) Artifacts
- `qa-artifacts/api_full_report.json`
- `qa-artifacts/frontend_full_report.json`
- multiple screenshots under `qa-artifacts/`

