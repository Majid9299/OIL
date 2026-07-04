"use client";

import Link from "next/link";
import { InvareMark } from "@/components/InvareMark";
import { RequireCollectorOwner } from "@/components/collectors/RequireCollectorOwner";
import { useCollectorData } from "@/components/collectors/CollectorDataProvider";

function VehiclePicker() {
  const { vehicles, vehicleRoutes } = useCollectorData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-8">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">اختر مركبة لبناء مسارها</h1>
        <p className="text-sm text-neutral-400">كل مركبة تقدر يكون لها مسار سحب مستقل</p>
      </div>

      <div className="flex flex-col gap-3">
        {vehicles.map((v) => {
          const pointsCount = vehicleRoutes[v.id]?.length ?? 0;
          return (
            <Link
              key={v.id}
              href={`/collectors/route/${v.id}`}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-neutral-100 text-xl">
                🚚
              </div>
              <div className="flex-1">
                <p className="font-bold text-neutral-900">{v.driverName}</p>
                <p className="text-xs text-neutral-400" dir="ltr">
                  {v.plateNumber}
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                {pointsCount > 0 ? `${pointsCount} نقطة بالمسار` : "بدون مسار"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function RoutePickerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/collectors" className="text-sm font-semibold text-neutral-400">
          ← رجوع
        </Link>
        <InvareMark size={24} />
      </div>
      <RequireCollectorOwner>
        <VehiclePicker />
      </RequireCollectorOwner>
    </div>
  );
}
