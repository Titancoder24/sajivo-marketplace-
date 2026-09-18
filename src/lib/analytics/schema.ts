import { z } from "zod";

const count = z.number().int().nonnegative();
const distribution = z.array(z.object({ name: z.string(), value: count }));

// Missing metrics are an incompatible response, never evidence of zero activity.
export const analyticsSummarySchema = z.object({
  dau: count,
  wau: count,
  mau: count,
  sessions24h: count,
  sessions30d: count,
  pageViews24h: count,
  pageViews30d: count,
  topRoutes: z.array(z.object({ path: z.string(), views: count, sessions: count })),
  topEvents: distribution,
  hourly: z.array(z.object({ hour: count.max(23), events: count, sessions: count })),
  devices: distribution,
  referrers: distribution,
  funnel: distribution,
  daily: z.array(z.object({ day: z.string(), views: count, sessions: count, active_users: count })),
});

export const analyticsHeatmapSchema = z.array(z.object({
  path: z.string().optional(),
  x_bucket: count.max(9),
  y_bucket: count.max(9),
  clicks: count,
}));

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;
