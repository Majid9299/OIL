"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { InvareMark } from "@/components/InvareMark";
import { RequireCollectorOwner } from "@/components/collectors/RequireCollectorOwner";
import { useCollectorData } from "@/components/collectors/CollectorDataProvider";
import { usePickupRequests } from "@/components/shared/PickupRequestsProvider";
import { CURRENT_COLLECTOR } from "@/lib/mock-data";
import { PickupRequest, RoutePoint } from "@/lib/types";

const RouteMap = dynamic(
  () => import("@/components/collectors/RouteMap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-neutral-200 text-sm text-neutral-400">
        جارِ تحميل الخريطة…
      </div>
    ),
  }
);

function requestToRoutePoint(r: PickupRequest): RoutePoint {
  return {
    id: r.id,
    label: `${r.generatorName} — ${r.branchName}`,
    lat: r.lat,
    lng: r.lng,
    kind: "request",
    requestId: r.id,
    wilayat: r.wilayat,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function RoutePlanner({ vehicleId }: { vehicleId: string }) {
  const { vehicles, vehicleRoutes, setVehicleRoute } = useCollectorData();
  const { requests } = usePickupRequests();
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const route = useMemo(() => vehicleRoutes[vehicleId] ?? [], [vehicleRoutes, vehicleId]);

  const [filterWilayat, setFilterWilayat] = useState("");
  const [pendingClick, setPendingClick] = useState<{ lat: number; lng: number } | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [segment, setSegment] = useState(0);
  const [t, setT] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const autoAddedRef = useRef(new Set<string>());

  const myPending = requests.filter(
    (r) => r.collectorId === CURRENT_COLLECTOR.id && r.status === "pending"
  );
  const wilayats = useMemo(
    () => Array.from(new Set(myPending.map((r) => r.wilayat))),
    [myPending]
  );
  const filteredPending = filterWilayat
    ? myPending.filter((r) => r.wilayat === filterWilayat)
    : myPending;
  const filteredTotalLiters = filteredPending.reduce((s, r) => s + r.totalLiters, 0);
  const filteredTotalOMR = filteredPending.reduce((s, r) => s + r.totalOMR, 0);

  const routeRequestIds = new Set(route.map((p) => p.requestId).filter(Boolean));

  function addRequestToRoute(r: PickupRequest) {
    if (routeRequestIds.has(r.id)) return;
    setVehicleRoute(vehicleId, [...route, requestToRoutePoint(r)]);
  }

  function removeFromRoute(id: string) {
    setVehicleRoute(vehicleId, route.filter((p) => p.id !== id));
  }

  function moveInRoute(index: number, dir: -1 | 1) {
    const next = [...route];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setVehicleRoute(vehicleId, next);
  }

  function confirmCustomPoint() {
    if (!pendingClick || !customLabel.trim()) return;
    setVehicleRoute(vehicleId, [
      ...route,
      {
        id: `custom-${Date.now()}`,
        label: customLabel.trim(),
        lat: pendingClick.lat,
        lng: pendingClick.lng,
        kind: "custom",
      },
    ]);
    setPendingClick(null);
    setCustomLabel("");
  }

  // تجميع تلقائي: أي طلب جديد من نفس ولاية موجودة بالفعل في مسار هذي المركبة ينضاف تلقائيًا
  useEffect(() => {
    const routeWilayats = new Set(route.map((p) => p.wilayat).filter(Boolean));
    if (routeWilayats.size === 0) return;
    myPending.forEach((r) => {
      if (
        routeWilayats.has(r.wilayat) &&
        !routeRequestIds.has(r.id) &&
        !autoAddedRef.current.has(r.id)
      ) {
        autoAddedRef.current.add(r.id);
        setVehicleRoute(vehicleId, [...route, requestToRoutePoint(r)]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPending, route]);

  // محاكاة تتبّع الشاحنة على المسار
  useEffect(() => {
    if (!isTracking || route.length < 2) return;
    const interval = setInterval(() => {
      setT((prevT) => {
        const nextT = prevT + 0.03;
        if (nextT >= 1) {
          setSegment((prevSeg) => {
            const nextSeg = prevSeg + 1;
            if (nextSeg >= route.length - 1) {
              setIsTracking(false);
              return 0;
            }
            return nextSeg;
          });
          return 0;
        }
        return nextT;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isTracking, route.length]);

  const truckPosition =
    isTracking && route.length > 1 && route[segment] && route[segment + 1]
      ? {
          lat: lerp(route[segment].lat, route[segment + 1].lat, t),
          lng: lerp(route[segment].lng, route[segment + 1].lng, t),
        }
      : null;

  if (!vehicle) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
        المركبة غير موجودة
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-5 py-6">
      <div>
        <h1 className="text-lg font-extrabold text-neutral-900">
          مسار {vehicle.driverName} — {vehicle.plateNumber}
        </h1>
        <p className="text-sm text-neutral-400">
          اطّلع على أماكن الكميات المتوفرة، وجمّعها في مسار هذي المركبة
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterWilayat("")}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
            filterWilayat === "" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          الكل
        </button>
        {wilayats.map((w) => (
          <button
            key={w}
            onClick={() => setFilterWilayat(w)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              filterWilayat === w ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-right text-xs text-neutral-400">
              <th className="px-3 py-2 font-medium">المولّد</th>
              <th className="px-3 py-2 font-medium">الولاية</th>
              <th className="px-3 py-2 font-medium">الكمية</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPending.map((r) => (
              <tr key={r.id} className="border-b border-neutral-50 last:border-0">
                <td className="px-3 py-2">
                  <p className="font-semibold text-neutral-800">{r.generatorName}</p>
                  <p className="text-xs text-neutral-400">{r.branchName}</p>
                </td>
                <td className="px-3 py-2 text-neutral-600">{r.wilayat}</td>
                <td className="px-3 py-2 font-semibold text-neutral-800">{r.totalLiters} لتر</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => addRequestToRoute(r)}
                    disabled={routeRequestIds.has(r.id)}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 disabled:opacity-40"
                  >
                    {routeRequestIds.has(r.id) ? "بالمسار ✓" : "+ إضافة للمسار"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50 text-right text-xs font-bold text-neutral-600">
              <td className="px-3 py-2">الإجمالي ({filteredPending.length})</td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2">{filteredTotalLiters} لتر</td>
              <td className="px-3 py-2">{filteredTotalOMR} ر.ع</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <RouteMap
        pendingPoints={myPending.map((r) => ({
          id: r.id,
          label: r.generatorName,
          sub: `${r.wilayat} · ${r.totalLiters} لتر`,
          lat: r.lat,
          lng: r.lng,
        }))}
        routePoints={route}
        onPendingClick={(id) => {
          const r = myPending.find((x) => x.id === id);
          if (r) addRequestToRoute(r);
        }}
        onMapClick={(lat, lng) => setPendingClick({ lat, lng })}
        truckPosition={truckPosition}
      />

      {pendingClick && (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white p-3">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="اسم نقطة التجميع (مثال: محطة وقود الرستاق)"
            className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={confirmCustomPoint}
            disabled={!customLabel.trim()}
            className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            إضافة
          </button>
          <button
            onClick={() => {
              setPendingClick(null);
              setCustomLabel("");
            }}
            className="text-xs font-semibold text-neutral-400"
          >
            إلغاء
          </button>
        </div>
      )}
      <p className="-mt-2 text-[11px] text-neutral-400">
        اضغط على أي مكان بالخريطة لإضافة نقطة تجميع يدويًا للمسار
      </p>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-neutral-700">مسار الشاحنة ({route.length} نقطة)</p>
          <button
            onClick={() => setIsTracking((v) => !v)}
            disabled={route.length < 2}
            className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-30"
          >
            {isTracking ? "إيقاف التتبّع" : "▶ بدء تتبّع الشاحنة"}
          </button>
        </div>

        {route.length === 0 ? (
          <p className="text-xs text-neutral-400">
            ما فيه نقاط بالمسار بعد — أضف من الجدول أو اضغط على الخريطة
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {route.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="flex-1 text-neutral-700">
                  {p.label}
                  {p.kind === "custom" && (
                    <span className="mr-1 text-[10px] text-neutral-400">(نقطة يدوية)</span>
                  )}
                </span>
                <button
                  onClick={() => moveInRoute(i, -1)}
                  disabled={i === 0}
                  className="text-neutral-400 disabled:opacity-20"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveInRoute(i, 1)}
                  disabled={i === route.length - 1}
                  className="text-neutral-400 disabled:opacity-20"
                >
                  ▼
                </button>
                <button
                  onClick={() => removeFromRoute(p.id)}
                  className="text-neutral-300 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehicleRoutePage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-3">
        <Link href="/collectors/fleet" className="text-sm font-semibold text-neutral-400">
          ← رجوع للأسطول
        </Link>
        <InvareMark size={24} />
      </div>
      <RequireCollectorOwner>
        <RoutePlanner vehicleId={vehicleId} />
      </RequireCollectorOwner>
    </div>
  );
}
