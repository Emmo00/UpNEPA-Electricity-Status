import { and, desc, eq, gte, ilike, or } from "drizzle-orm";
import { db, reportsTable, zonesTable } from "@workspace/db";

const WINDOW_MINUTES = 30;

type DerivedStatus = "ON" | "OFF" | "MIXED" | "STALE" | "NONE";

export type DerivedZone = {
  id: number;
  name: string;
  parentArea: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  status: DerivedStatus;
  onCount: number;
  offCount: number;
  totalReports: number;
  lastConfirmedAt: string | null;
  minutesAgo: number | null;
  isStale: boolean;
};

function deriveStatus(onCount: number, offCount: number, hasRecent: boolean, hasHistorical: boolean): DerivedStatus {
  const total = onCount + offCount;
  if (total === 0) return hasHistorical ? "STALE" : "NONE";
  if (onCount / total >= 0.8) return "ON";
  if (offCount / total >= 0.8) return "OFF";
  return "MIXED";
}

function minutesSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
}

export async function getZoneWithStatus(zoneId: number): Promise<DerivedZone | null> {
  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, zoneId)).limit(1);
  if (!zone) return null;

  const allReports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.zoneId, zoneId))
    .orderBy(desc(reportsTable.createdAt));
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const recentReports = allReports.filter((report) => report.createdAt >= cutoff);
  const onCount = recentReports.filter((report) => report.status === "ON").length;
  const offCount = recentReports.filter((report) => report.status === "OFF").length;
  const latest = allReports[0]?.createdAt ?? null;
  const status = deriveStatus(onCount, offCount, recentReports.length > 0, allReports.length > 0);

  return {
    id: zone.id,
    name: zone.name,
    parentArea: zone.parentArea,
    centerLat: zone.centerLat,
    centerLng: zone.centerLng,
    radiusM: zone.radiusM,
    status,
    onCount,
    offCount,
    totalReports: recentReports.length,
    lastConfirmedAt: latest?.toISOString() ?? null,
    minutesAgo: minutesSince(latest),
    isStale: status === "STALE" || status === "NONE",
  };
}

export async function listZonesWithStatus(search: string | undefined, limit: number): Promise<DerivedZone[]> {
  const conditions = search?.trim()
    ? or(ilike(zonesTable.name, `%${search.trim()}%`), ilike(zonesTable.parentArea, `%${search.trim()}%`))
    : undefined;
  const zones = await db.select().from(zonesTable).where(conditions).orderBy(zonesTable.name).limit(limit);
  const results = await Promise.all(zones.map((zone) => getZoneWithStatus(zone.id)));
  return results.filter((zone): zone is DerivedZone => zone !== null);
}

export async function getRecentReports(zoneId: number, hours = 12) {
  const cutoff = new Date(Date.now() - hours * 60 * 60_000);
  return db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.zoneId, zoneId), gte(reportsTable.createdAt, cutoff)))
    .orderBy(reportsTable.createdAt);
}