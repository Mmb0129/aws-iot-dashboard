import React from "react";
import html2canvas from "html2canvas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const calculateLinearForecast = (data, metric, forecastCount) => {
  const cleaned = data
    .map((d, i) => ({
      x: i,
      y: d[metric],
      timestamp: (d.timestamp || d.ts) * 1000,
    }))
    .filter((d) => d.y !== undefined && !isNaN(d.y));

  if (cleaned.length < 2) return { actual: [], forecast: [] };

  const n = cleaned.length;
  const sumX = cleaned.reduce((sum, d) => sum + d.x, 0);
  const sumY = cleaned.reduce((sum, d) => sum + d.y, 0);
  const sumXY = cleaned.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = cleaned.reduce((sum, d) => sum + d.x * d.x, 0);

  const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - a * sumX) / n;

  const actual = cleaned.map((d) => ({
    name: new Date(d.timestamp).toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }),
    actual: d.y,
  }));

  const lastTimestamp = cleaned[cleaned.length - 1].timestamp;

  const forecast = [];
  for (let i = 0; i < forecastCount; i++) {
    const ts = lastTimestamp + (i + 1) * 10 * 60 * 1000; // every 10 mins
    forecast.push({
      name: new Date(ts).toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }),
      forecast: parseFloat((a * (n + i) + b).toFixed(2)),
    });
  }

  return { actual, forecast };
};

const TrendChart = ({ data, metric, forecastCount = 5 }) => {
  const { actual, forecast } = calculateLinearForecast(data, metric, forecastCount);

  const combinedData = [
    ...actual.map((d) => ({ name: d.name, actual: d.actual })),
    ...forecast.map((d) => ({ name: d.name, forecast: d.forecast })),
  ];

  const colorMap = {
    temperature: "#f97316",
    moisture: "#3b82f6",
    ph: "#10b981",
  };

  const handleExport = async () => {
    const chartDiv = document.getElementById(`chart-${metric}`);
    if (!chartDiv) return;
    const canvas = await html2canvas(chartDiv);
    const link = document.createElement("a");
    link.download = `${metric}_trend_chart.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const trendWithArrow = actual.map((d, i) => {
    if (i === 0) return { ...d, trend: "→" };
    const prev = actual[i - 1].actual;
    const curr = d.actual;
    const trend = curr > prev ? "↑" : curr < prev ? "↓" : "→";
    return { ...d, trend };
  });

  return (
    <div id={`chart-${metric}`} className="w-full bg-white p-4 rounded-xl shadow-md relative">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-semibold capitalize">{metric} Trend & Forecast</h4>
        <button
          onClick={handleExport}
          className="text-sm text-blue-600 hover:underline"
          title="Download Chart"
        >
          ⬇️ Export
        </button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={colorMap[metric]}
            dot={{ r: 3 }}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#000000"
            strokeDasharray="5 5"
            name="Forecast"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-center mt-1 text-xs text-gray-500 gap-2">
        {trendWithArrow.map((d, idx) => (
          <span key={idx}>{d.trend}</span>
        ))}
      </div>
    </div>
  );
};

export default TrendChart;
