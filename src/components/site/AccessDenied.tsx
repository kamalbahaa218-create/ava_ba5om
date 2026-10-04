import { Link } from "@tanstack/react-router";

export function AccessDenied() {
  return (
    <section className="mx-auto max-w-lg animate-rise rounded-3xl bg-panel p-8 text-center ring-1 ring-black/5">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-oxblood font-display text-xl font-black text-gold-soft">
        !
      </span>
      <h1 className="font-display text-2xl font-black">ليس لديك صلاحية للوصول إلى هذه الصفحة</h1>
      <p className="mt-2 text-sm text-ink-soft">
        إذا كنت تعتقد أن هذا خطأ، تواصل مع المسؤول الرئيسي.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-2xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper"
      >
        العودة للرئيسية
      </Link>
    </section>
  );
}

export function Loading() {
  return <p className="py-16 text-center text-sm text-ink-soft">جارٍ التحميل…</p>;
}
