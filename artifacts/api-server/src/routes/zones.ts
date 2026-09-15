import { Router, type IRouter } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, deviceUsersTable, reportsTable, zonesTable } from "@workspace/db";
import {
  CreateReportBody,
  CreateReportParams,
  CreateReportResponse,
  GetProfileParams,
  GetProfileResponse,
  GetZoneHistoryParams,
  GetZoneHistoryResponse,
  GetZoneParams,
  GetZoneResponse,
  ListZonesQueryParams,
  ListZonesResponse,
} from "@workspace/api-zod";
import { getRecentReports, getZoneWithStatus, listZonesWithStatus } from "../lib/zones";

const router: IRouter = Router();

router.get("/zones", async (req, res): Promise<void> => {
  const parsed = ListZonesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const zones = await listZonesWithStatus(parsed.data.search, parsed.data.limit);
  res.json(ListZonesResponse.parse(zones.map(({ centerLat: _lat, centerLng: _lng, radiusM: _radius, ...zone }) => zone)));
});

router.get("/zones/:zoneId", async (req, res): Promise<void> => {
  const parsed = GetZoneParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const zone = await getZoneWithStatus(parsed.data.zoneId);
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  res.json(GetZoneResponse.parse(zone));
});

router.get("/zones/:zoneId/history", async (req, res): Promise<void> => {
  const parsed = GetZoneHistoryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const zone = await getZoneWithStatus(parsed.data.zoneId);
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  const reports = await getRecentReports(parsed.data.zoneId);
  const now = Date.now();
  const points = Array.from({ length: 12 }, (_, index) => {
    const end = new Date(now - (11 - index) * 60 * 60_000);
    const start = new Date(end.getTime() - 60 * 60_000);
    const bucket = reports.filter((report) => report.createdAt >= start && report.createdAt < end);
    const onCount = bucket.filter((report) => report.status === "ON").length;
    const offCount = bucket.filter((report) => report.status === "OFF").length;
    const total = onCount + offCount;
    const status = total === 0 ? "NONE" : onCount / total >= 0.8 ? "ON" : offCount / total >= 0.8 ? "OFF" : "MIXED";
    return { at: end.toISOString(), onCount, offCount, status };
  });
  res.json(GetZoneHistoryResponse.parse(points));
});

router.post("/zones/:zoneId/reports", async (req, res): Promise<void> => {
  const params = CreateReportParams.safeParse(req.params);
  const body = CreateReportBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const zone = await getZoneWithStatus(params.data.zoneId);
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  const cutoff = new Date(Date.now() - 10 * 60_000);
  const [recentReport] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.zoneId, params.data.zoneId), eq(reportsTable.deviceId, body.data.deviceId), gte(reportsTable.createdAt, cutoff)))
    .orderBy(desc(reportsTable.createdAt))
    .limit(1);
  if (recentReport) {
    const current = await getZoneWithStatus(params.data.zoneId);
    if (!current) {
      res.status(404).json({ error: "Zone not found" });
      return;
    }
    res.status(200).json(CreateReportResponse.parse({
      recorded: false,
      message: "We already received a recent check-in from this device.",
      zone: current,
    }));
    return;
  }

  const [report] = await db.insert(reportsTable).values({
    zoneId: params.data.zoneId,
    deviceId: body.data.deviceId,
    status: body.data.status,
    geoLat: body.data.geoLat ?? null,
    geoLng: body.data.geoLng ?? null,
  }).returning();
  await db.insert(deviceUsersTable).values({ deviceId: body.data.deviceId }).onConflictDoNothing();
  const current = await getZoneWithStatus(params.data.zoneId);
  if (!current || !report) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  res.status(201).json(CreateReportResponse.parse({
    recorded: true,
    message: body.data.status === "ON" ? "Thanks — power is back on." : "Thanks — outage recorded.",
    zone: current,
  }));
});

router.get("/profile/:deviceId", async (req, res): Promise<void> => {
  const parsed = GetProfileParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.deviceId, parsed.data.deviceId))
    .orderBy(reportsTable.createdAt);
  const first = reports[0]?.createdAt ?? null;
  const last = reports.at(-1)?.createdAt ?? null;
  res.json(GetProfileResponse.parse({
    deviceId: parsed.data.deviceId,
    reportCount: reports.length,
    zonesReported: new Set(reports.map((report) => report.zoneId)).size,
    firstReportAt: first?.toISOString() ?? null,
    lastReportAt: last?.toISOString() ?? null,
  }));
});

export default router;