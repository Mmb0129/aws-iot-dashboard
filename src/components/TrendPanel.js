// components/TrendPanel.js
import React, { useState } from "react";
import TrendSummaryCard from "./TrendSummaryCard";
import TrendChart from "./TrendChart";
import { calculateTrend, getMetricStats } from "../utils/trendUtils";

const TrendPanel = ({
  sensorData,
  latest,
  onClose,
  selectedRange,
  onRangeChange,
}) => {
  const ranges = [
    { label: "1h", value: 60 },
    { label: "6h", value: 360 },
    { label: "24h", value: 1440 },
  ];

  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const metrics = ["temperature", "moisture", "ph"];
  const currentMetric = metrics[currentMetricIndex];

  const handlePrev = () => {
    setCurrentMetricIndex((prev) => (prev - 1 + metrics.length) % metrics.length);
  };

  const handleNext = () => {
    setCurrentMetricIndex((prev) => (prev + 1) % metrics.length);
  };

  // Filter data based on selected time range
  const now = Date.now();
  const filteredData = sensorData.filter((d) => {
    const timestamp = (d.timestamp || d.ts) * 1000; // ✅ FIXED
    return timestamp >= now - selectedRange * 60 * 1000;
  });

  return (
    <div className="bg-gray-100 p-4 rounded-xl shadow-inner mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          📈 Sensor Trends (Last {selectedRange / 60}h)
        </h3>
        <button
          onClick={onClose}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Close
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            className={`px-3 py-1 rounded ${
              selectedRange === range.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-blue-600 text-blue-600"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <TrendSummaryCard
          title="Temperature"
          value={
            latest?.temperature !== undefined
              ? `${latest.temperature.toFixed(1)} °C`
              : "N/A"
          }
          trend={calculateTrend(sensorData, "temperature", selectedRange)}
          average={getMetricStats(sensorData, "temperature", selectedRange).avg}
        />
        <TrendSummaryCard
          title="Moisture"
          value={
            latest?.moisture !== undefined
              ? `${latest.moisture.toFixed(1)}%`
              : "N/A"
          }
          trend={calculateTrend(sensorData, "moisture", selectedRange)}
          average={getMetricStats(sensorData, "moisture", selectedRange).avg}
        />
        <TrendSummaryCard
          title="pH"
          value={
            latest?.ph !== undefined
              ? latest.ph.toFixed(2)
              : "N/A"
          }
          trend={calculateTrend(sensorData, "ph", selectedRange)}
          average={getMetricStats(sensorData, "ph", selectedRange).avg}
        />
      </div>

      {/* Chart Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handlePrev}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ⬅️
        </button>
        <div className="flex-1 mx-4">
          <TrendChart
            data={filteredData}
            metric={currentMetric}
            forecastCount={10}
          />
        </div>
        <button
          onClick={handleNext}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ➡️
        </button>
      </div>
    </div>
  );
};

export default TrendPanel;
