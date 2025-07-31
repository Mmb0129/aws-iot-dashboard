// utils/trendUtils.js
export function calculateTrend(sensorData, metric, minutes = 60) {
  const now = Date.now(); // in ms
  const timeAgo = now - minutes * 60 * 1000;

  const recentData = sensorData.filter((entry) => {
    const timestampMs = (entry.timestamp || entry.ts) * 1000; // ✅ FIXED HERE
    return timestampMs >= timeAgo && timestampMs <= now;
  });

  if (recentData.length < 6) return "stable";

  const mid = Math.floor(recentData.length / 2);
  const earlyAvg =
    recentData.slice(0, mid).reduce((sum, d) => sum + d[metric], 0) / mid;
  const recentAvg =
    recentData.slice(mid).reduce((sum, d) => sum + d[metric], 0) /
    (recentData.length - mid);

  if (recentAvg > earlyAvg * 1.02) return "up";
  if (recentAvg < earlyAvg * 0.98) return "down";
  return "stable";
}

export function getMetricStats(sensorData, metric, minutes = 60) {
  const now = Date.now();
  const timeAgo = now - minutes * 60 * 1000;

  const filtered = sensorData.filter((entry) => {
    const ts = (entry.timestamp || entry.ts) * 1000;
    return ts >= timeAgo && ts <= now;
  });

  if (filtered.length === 0) return { avg: null, min: null, max: null };

  const values = filtered.map((d) => d[metric]);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { avg, min, max };
}

