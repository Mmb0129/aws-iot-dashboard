// AlertTable.js
import React, { useState, useEffect } from "react";
import AlertSummary from "./AlertSummary";
import ExportControls from "./ExportControls";

const AlertTable = ({ alerts = [], autoDownload, onToggleDownload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [alertsPerPage, setAlertsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAlerts, setFilteredAlerts] = useState([]);

  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = alerts.filter((alert) =>
      alert.alertType.toLowerCase().includes(lowerSearch)
    );
    setFilteredAlerts(filtered);

    if (autoDownload && filtered.length) {
      const csv = filtered.map((r) =>
        [
          new Date(r.timestamp * 1000).toLocaleString(),
          r.alertType,
          r.temperature,
          r.ph,
          r.moisture,
        ].join(",")
      );
      const blob = new Blob([
        "Time,Alert Type,Temperature,pH,Moisture\n" + csv.join("\n"),
      ]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "auto-alerts.csv";
      a.click();
    }
  }, [alerts, searchTerm, autoDownload]);

  const indexOfLastAlert = currentPage * alertsPerPage;
  const indexOfFirstAlert = indexOfLastAlert - alertsPerPage;
  const currentAlerts = filteredAlerts.slice(indexOfFirstAlert, indexOfLastAlert);
  const totalPages = Math.ceil(filteredAlerts.length / alertsPerPage);

  const getRowColor = (type) => {
    if (type.includes("high")) return "bg-red-50";
    if (type.includes("low")) return "bg-yellow-50";
    return "bg-white";
  };

  return (
    <div className="mt-6 p-4 bg-white shadow-md rounded-lg border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 6.65a7.5 7.5 0 010 10.6z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by alert type"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Rows per page:</label>
          <select
            value={alertsPerPage}
            onChange={(e) => {
              setAlertsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {[10, 20, 50, 100].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AlertSummary alerts={filteredAlerts} />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left table-auto">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Temp (°C)</th>
              <th className="px-4 py-2">pH</th>
              <th className="px-4 py-2">Moisture</th>
            </tr>
          </thead>
          <tbody>
            {currentAlerts.map((alert, idx) => (
              <tr
                key={idx}
                className={`${getRowColor(alert.alertType)} hover:bg-blue-50 transition duration-150`}
              >
                <td className="px-4 py-2">{new Date(alert.timestamp * 1000).toLocaleString()}</td>
                <td className="px-4 py-2">{alert.alertType}</td>
                <td className="px-4 py-2">{alert.temperature}</td>
                <td className="px-4 py-2">{alert.ph}</td>
                <td className="px-4 py-2">{alert.moisture}</td>
              </tr>
            ))}
            {currentAlerts.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No matching alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-200 rounded disabled:opacity-1000 hover:bg-gray-300 transition"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span>
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-200 rounded disabled:opacity-1000 hover:bg-gray-300 transition"
        >
          Next
        </button>
      </div>

      <div className="mt-6">
        <ExportControls
          alerts={filteredAlerts}
          autoDownload={autoDownload}
          onToggleDownload={onToggleDownload}
        />
      </div>
    </div>
  );
};

export default AlertTable;
