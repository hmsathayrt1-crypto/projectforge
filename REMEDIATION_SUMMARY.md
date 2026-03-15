# ProjectForge — خطة الإصلاح الشاملة (Remediation Plan)

**التاريخ:** 2026-03-15  
**الحالة:** الجارية 🚧️

---

## ملخص العمل المكتمل

### ✅ Phase 1: CORS Preflight (مكتمل)
- **الإصلاح:** إضافة معالج OPTIONS موحّد لكل نقاط النهاية (endpoints)
- **الملفات المعدلة:**
  - ✅ `functions/api/_cors.ts` (جديد) - مساعد CORS موحّد
  - ✅ `functions/api/auth/register.ts` - CORS + PBKDF2+Salt
  - ✅ `functions/api/auth/login.ts` - CORS + PBKDF2 backward compatible
  - ✅ `functions/api/auth/me.ts` - CORS محدّث
  - ✅ `functions/api/projects/index.ts` - CORS محدّث
  - ✅ `functions/api/skills.ts` - CORS محدّث
  - ✅ `functions/api/skills/survey.ts` - CORS محدّث + إزالة onRequestGet المكرر
  - ✅ `functions/api/recommendations/index.ts` - CORS محدّث
  - ✅ `functions/api/sandbox/generate.ts` - CORS محدّث
  - ✅ `functions/api/success/estimate.ts` - CORS محدّث
  - ✅ `functions/api/teams/match.ts` - CORS محدّث
  - ✅ `functions/api/user/projects.ts` - CORS محدّث
- **النتيجة:** جميع الـ APIs الآن تدعم OPTIONS preflight بشكل موحّد مع نفس الـ headers

---

## ✅ Phase 2: أمان كلمات المرور (مكتمل)
- **الإصلاح:** استبدال SHA-256 المباشر بـ PBKDF2 مع salt و 100,000 iteration
- **الملفات المعدلة:**
  - ✅ `functions/api/auth/register.ts` - استخدام PBKDF2 مع salt فريد لكل مستخدم
  - ✅ `functions/api/auth/login.ts` - دعم PBKDF2 الجديد + التوافق مع الهاش القديم (SHA-256)
- **التحسينات:**
  - تمت إضافة `password_salt` إلى واجهة User
  - تم تعديل جميع دوال الهاش لتدعم salt اختياري
  - تمت إضافة minimum password length validation (6 characters)
- **النتيجة:** أمان متقدم للكلمات مع التوافق مع الحسابات القديمة

---

## ✅ Phase 3: Mermaid Safe Rendering (مكتمل)
- **الإصلاح:** معالجة أخطاء parse في مخططات Mermaid مع fallback آمن
- **الملفات المعدلة:**
  - ✅ `app.js` (خطوط 1056-1095)
- **التحسينات:**
  - إضافة try-catch لـ marked.parse
  - تهيئة Mermaid مع `securityLevel: 'loose'` و `logLevel: 'error'`
  - التحقق من syntax قبل rendering (`graph`, `flowchart`, `sequenceDiagram`, `classDiagram`)
  - استخدام `mermaid.render()` بدلاً من `run()` للتحكم الأفضل
  - fallback إلى code block إذا فشل الـ rendering
  - زيادة timeout للـ rendering إلى 200ms
- **النتيجة:** لن ينهار التطبيق عند أخطاء Mermaid في مخرجات الـ AI

---

## ✅ Phase 4: تحسين UX للـ Loading (مكتمل)
- **الإصلاح:** إضافة timeout + abort controller للطلبات الطويلة
- **الملفات المعدلة:**
  - ✅ `app.js` (خطوط 833-873)
- **التحسينات:**
  - إضافة AbortController لإلغاء الطلبات السابقة
  - إضافة timeout 60 ثانية لـ Sandbox AI calls
  - عرض رسالة خطأ واضحة عند timeout
  - التمييز بين AbortError وأخطاء الشبكة العادية
- **النتيجة:** المستخدم لن يُجمّد عند تأخر الـ AI، وسيحصل على رسالة واضحة

---

## ✅ Phase 5: إزالة node_modules من Git (مكتمل)
- **الإصلاح:** إيقاف تتبع node_modules في Git
- **الملفات المعدلة:**
  - ✅ `.gitignore` - تحسين بإضافة المزيد من الأنماط
  - ✅ `git rm -r --cached node_modules` - إزالة من tracking
- **النتيجة:**
  - تم إزالة 2414 ملف من tracking
  - لن يتم رفع node_modules بعد الآن (سيتم إعادة إنشاء محليًا فقط)
  - حجم الـ repository سيقل من ~222MB إلى أقل بكثير

---

## 🔄 Phase 6: النشر (جاري)

### الخطوات القادمة:
1. **Commit جميع التغييرات**
   ```bash
   git add -A
   git commit -m "feat: comprehensive QA remediation - CORS, PBKDF2, Mermaid safety, timeout UX, repo hygiene"
   ```

2. **النشر إلى Cloudflare Pages**
   ```bash
   npx wrangler pages deploy . --project-name=projectforge --branch=main
   ```

3. **الدفع إلى GitHub**
   ```bash
   git push origin main
   ```

---

## 📊 الملخص الكامل

### المشاكل التي تم حلها:
| المشكلة | الحالة | الشدة | الوصف |
|---------|--------|-------|-------|
| CORS Preflight غير موحّد | ✅ | 🔴 High | OPTIONS ترجع 405 في عدة APIs |
| Password hashing ضعيف | ✅ | 🔴 Critical | SHA-256 المباشر غير آمن إنتاجياً |
| Mermaid parse errors | ✅ | 🟠 Medium | أخطاء console من malformed AI diagrams |
| Loading overlay يجمّد UX | ✅ | 🟠 Medium | لا timeout/abort عند تأخر AI |
| node_modules في git | ✅ | 🟠 Medium | 2414 ملف متتبع، repository ضخم |

### البنود التي تم تعزيزها:
- ✅ جميع APIs تدعم OPTIONS الآن
- ✅ أمان PBKDF2+Salt بكلمات المرور
- ✅ معالجة آمنة لأخطاء Mermaid
- ✅ تجربة أفضل للـ AI delays
- ✅ نظافة Repository
- ✅ التوافق مع كلمات المرور القديمة

---

## ⏳ التالي (Future Work)

### البنود ذات الأولوية المنخفضة:
1. **تقليل تكرار البيانات الثابتة**
   - إنشاء ملف مركزي: `functions/api/_data.ts`
   - استخدام `import` في ملفات متعددة بدلاً من تكرار نفس المصفوفات

2. **إزالة src/index.ts القديم**
   - إما إزالة الملف بالكامل أو ترقيته ليتوافق مع بنية Functions الحالية

3. **تحسين معالجة أخطاء AI JSON في recommendations**
   - استخدام schema validation بدلاً من regex extraction
   - إضافة retry logic
   - fallback object محدد مسبقاً

4. **تحسين دعم RTL/ARABIC في الـ frontend**
   - مراجعة جميع الأيقونات والاتجاهات لضمان دعم صحيح
   - اختبار UI على متصفحات مختلفة

---

## 🎯 الحالة النهائية

### قبل الإصلاح:
- CORS: ❌ غير موحّد (OPTIONS=405 في معظم endpoints)
- Security: ❌ password hashing ضعيف (SHA-256)
- Mermaid: ❌ قد تسبب console errors
- Loading: ❌ لا timeout، قد يجمّد المستخدم
- Repo: ❌ node_modules متتبع (222MB + بيانات غير ضرورية)
- Frontend: ⚠️ قد يحتوي تقاطع محتمل في skills survey endpoint

### بعد الإصلاح:
- CORS: ✅ موحّد بالكامل (جميع endpoints)
- Security: ✅ PBKDF2+Salt+100K iterations (متقدم)
- Mermaid: ✅ معالجة آمنة مع fallback
- Loading: ✅ timeout 60s + abort capability
- Repo: ✅ نظيف، node_modules غير متتبع
- Frontend: ✅ تحسينات في AI rendering و timeout handling

---

**التقرير:** جميع مشاكل QA ذات الأولوية العالية تم حلها. المشروع جاهز للنشر والاختبار النهائي. 🚀

