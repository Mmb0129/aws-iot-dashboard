// components/TrendSummaryCard.js
import React from "react";

const TrendSummaryCard = ({ title, trend, average }) => {
  const getTrendSymbol = () => {
    switch (trend) {
      case "up":
        return "🔼";
      case "down":
        return "⬇️";
      default:
        return "⏸️";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-red-600";
      case "down":
        return "text-green-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 text-center w-40">
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      {average !== undefined && average !== null && (
        <div className={`text-base font-semibold ${getTrendColor()}`}>
          Avg: {average.toFixed(2)} {getTrendSymbol()}
        </div>
      )}
    </div>
  );
};

export default TrendSummaryCard;
