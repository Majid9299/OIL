"use client";

import { useState } from "react";
import { DocumentAttachmentList } from "@/components/shared/DocumentAttachmentList";
import { useFactoryData } from "./FactoryDataProvider";

export function FactoryRegisterForm() {
  const { registration, updateRegistration, addRegistrationDocument, removeRegistrationDocument } =
    useFactoryData();
  const [form, setForm] = useState(registration);
  const [saved, setSaved] = useState(false);

  function submit() {
    updateRegistration({ ...form, documents: registration.documents });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const isValid = form.companyName.trim() && form.taxNumber.trim() && form.crNumber.trim();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">تسجيل بيانات المصنع</h1>
        <p className="text-sm text-neutral-400">
          مطلوبة لتفعيل الشراء ضمن نظام السحب العادل وربط المعاملات بالتصاريح الصناعية والبيئية
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-500">اسم المصنع</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            placeholder="مثال: مصنع الخليج للصناعات الكيميائية"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-500">الرقم الضريبي</label>
          <input
            value={form.taxNumber}
            onChange={(e) => setForm((f) => ({ ...f, taxNumber: e.target.value }))}
            placeholder="OMxxxxxxxxxxxxxxx"
            dir="ltr"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-500">رقم السجل التجاري</label>
          <input
            value={form.crNumber}
            onChange={(e) => setForm((f) => ({ ...f, crNumber: e.target.value }))}
            placeholder="مثال: 1234567"
            dir="ltr"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-500">رقم الواتساب</label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            placeholder="+968 9xxx xxxx"
            dir="ltr"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-500">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="name@factory.com"
            dir="ltr"
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-bold text-neutral-700">مستندات التوثيق</p>
        <p className="mb-3 text-xs text-neutral-400">
          أرفق نسخة الرقم الضريبي والسجل التجاري والتصريح الصناعي والتصريح البيئي
        </p>
        <DocumentAttachmentList
          documents={registration.documents}
          onAdd={(name, expiresAt) => addRegistrationDocument({ name, expiresAt })}
          onRemove={removeRegistrationDocument}
        />
      </div>

      <button
        onClick={submit}
        disabled={!isValid}
        className="h-14 rounded-2xl bg-brand-600 text-lg font-bold text-white transition active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400"
      >
        حفظ البيانات
      </button>

      {saved && (
        <div className="rounded-xl bg-brand-50 p-3 text-center text-sm font-semibold text-brand-700">
          تم حفظ بيانات المصنع ✅
        </div>
      )}
    </div>
  );
}
