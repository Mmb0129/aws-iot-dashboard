import React from "react";

const getAlertCounts = (alerts) => {
  const counts = {};
  alerts.forEach((alert) => {
    counts[alert.alertType] = (counts[alert.alertType] || 0) + 1;
  });
  return counts;
};

const AlertSummary = ({ alerts = [] }) => {
  if (!alerts.length) return null;

  const counts = getAlertCounts(alerts);
  const total = alerts.length;

  return (
    <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
          <span className="text-xl"></span> Alert Summary
        </h3>
        <span className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full">
          {total} total
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(counts).map(([type, count]) => (
          <div
            key={type}
            className="bg-white border border-red-100 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition"
          >
            <span className="text-sm font-medium text-gray-700">{type}</span>
            <span className="text-sm font-bold text-red-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertSummary;
