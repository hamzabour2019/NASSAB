# نسب (Nassab)

منصة ويب عربية (RTL) لتوثيق وإدارة شجرة العائلة: أفراد، علاقات أبوية/أمومية، زيجات متعددة وسابقة، شجرة تفاعلية (React Flow)، طلبات تعديل بموافقة المالك، سجل تدقيق، مشاركة عامة، وتصدير PNG/PDF.

## التقنيات

- Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI)
- Supabase (Auth + Postgres + RLS)
- TanStack Query · React Hook Form · Zod · next-themes
- `@xyflow/react` · `html2canvas` · `jspdf`

## البنية المعمارية

- **واجهة**: `src/app` حسب المسارات المقترحة؛ مكوّنات مشتركة في `src/components`؛ منطق الميزات في `src/lib/actions` و`src/lib/validations`.
- **التحقق من الأنساب**: `src/lib/relationships/validate.ts` يمنع دورات في اتجاه الأب ← الطفل قبل الإدراج.
- **التدقيق**: محفوظات `audit_logs` تُدرَج عبر دوال ومحفّزات `SECURITY DEFINER` (`append_audit`)؛ لا يملك المستخدمون `INSERT` مباشرة على الجدول.
- **العامة**: الدالة `get_public_family(slug)` تُرجع JSON آمن حسب إعدادات العائلة (إخفاء بيانات الأحياء عند التفعيل).
- **الدخول**: `src/lib/auth/auth-service.ts` — إن وُجد `NEXT_PUBLIC_API_URL` يُحاول `/auth/login` ثم يعود إلى Supabase؛ وإلا Supabase فقط. المزوّد في `src/providers/auth-provider.tsx`.

## إعداد Supabase

1. أنشئ مشروعاً على [Supabase](https://supabase.com).
2. من **SQL Editor** نفّذ محتوى الملف:
   - `supabase/migrations/20250322140000_init.sql`
3. فعّل **Email** تحت Authentication → Providers.
4. انسخ **Project URL** و**anon key** إلى `.env.local` (انظر `.env.local.example`).

## البيانات الأولية (Seed)

1. سجّل مستخدماً بالبريد **`demo@nassab.app`** (أو غيّر البريد في `supabase/seed.sql`).
2. نفّذ `supabase/seed.sql` من SQL Editor (أو ضمّنه في `supabase db reset` إن استخدمت CLI).

العيّنة تشمل عائلة «آل الشامي»، أجداد متوفون، أبناء، زواج سابق، طلب تعديل معلّق، طلب مرفوض، رابط عام `al-shami-demo`.

## تشغيل المشروع محلياً

```bash
npm install
cp .env.local.example .env.local
# عدّل القيم ثم:
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

## المسارات الرئيسية

| المسار | الوصف |
|--------|--------|
| `/` | الصفحة الرئيسية |
| `/login` · `/register` | الدخول والتسجيل |
| `/dashboard` | لوحة تحكم |
| `/families` · `/families/new` | العائلات وإنشاء عائلة |
| `/families/[id]/tree` | الشجرة + بحث + تصدير |
| `/families/[id]/members` | الأفراد وإضافة فرد |
| `/families/[id]/requests` | طلبات التعديل (موافقة/رفض للمالك) |
| `/families/[id]/audit-log` | سجل التدقيق |
| `/families/[id]/settings` | الخصوصية والرابط العام |
| `/public/family/[slug]` | عرض عام (بدون تسجيل دخول) |
| `/admin` | كل العائلات (مشرف عام `is_super_admin`) |

## الأدوار

- **مشرف عام** (`profiles.is_super_admin`): صفحة `/admin`.
- **مالك العائلة** (`families.owner_id` + عضوية `owner`): إعدادات، موافقة الطلبات، تعديل مباشر للأفراد (عبر الإجراءات الحالية).
- **عضو**: عرض، إرسال طلبات تعديل.
- **زائر عام**: عبر `get_public_family` فقط.

## ملاحظات إنتاج

- راجع سياسات RLS عند إضافة حقول حساسة.
- لرفع صور حقيقية أضف دلو Supabase Storage وسياساته.
- وسّع `applyApprovedRequest` في `request-actions.ts` لدعم كل أنواع الطلبات (إضافة زوج، تصحيح علاقة، …).
- للشجرة الكبيرة جداً: فلترة العقد حسب الفرع المفتوح أو التحميل التدريجي.

## الرخصة

خاص بالمشروع — عدّل حسب احتياجك.
