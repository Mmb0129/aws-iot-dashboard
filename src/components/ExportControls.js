import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ExportControls = ({
  alerts,
  autoDownload,
  onToggleDownload,
  showButtons = true, // ✅ Optional prop (default = true)
}) => {
  const downloadCSV = () => {
    const csv = alerts.map((r) =>
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
    a.download = "alerts.csv";
    a.click();
  };

  const exportExcel = () => {
    const sheet = alerts.map((a) => ({
      Time: new Date(a.timestamp * 1000).toLocaleString(),
      Type: a.alertType,
      Temperature: a.temperature,
      pH: a.ph,
      Moisture: a.moisture,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheet);
    XLSX.utils.book_append_sheet(wb, ws, "Alerts");
    XLSX.writeFile(wb, "alerts.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Alert Report", 14, 16);
    doc.autoTable({
      startY: 22,
      head: [["Time", "Type", "Temperature", "pH", "Moisture"]],
      body: alerts.map((a) => [
        new Date(a.timestamp * 1000).toLocaleString(),
        a.alertType,
        a.temperature,
        a.ph,
        a.moisture,
      ]),
    });
    doc.save("alerts.pdf");
  };

  // ✅ Hide everything if both buttons and toggle are not needed
  if (!showButtons && !onToggleDownload) return null;

  return (
    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      {showButtons && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadCSV}
            className="bg-gray-200 text-sm px-3 py-1 rounded hover:bg-gray-300"
          >
            Download CSV
          </button>
          <button
            onClick={exportExcel}
            className="bg-green-200 text-sm px-3 py-1 rounded hover:bg-green-300"
          >
            Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-200 text-sm px-3 py-1 rounded hover:bg-red-300"
          >
            Export PDF
          </button>
        </div>
      )}

      {onToggleDownload && (
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoDownload}
            onChange={onToggleDownload}
          />
          Auto-download on filter
        </label>
      )}
    </div>
  );
};

export default ExportControls;
