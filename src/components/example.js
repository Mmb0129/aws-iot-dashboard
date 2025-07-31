import React, { useEffect, useState } from "react";
import axios from "axios";
import SensorChart from "./SensorChart";
import SummaryCard from "./SummaryCard";

const SENSOR_DATA_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com/getSensorData";
const SAVE_ALERT_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com/saveAlert";
const ALERT_HISTORY_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com/getAlertHistory";

const AVAILABLE_SENSORS = ["Sensor-001", "Sensor-002", "Sensor-003"];

const ALERT_THRESHOLD = {
  Rice: {
    temperature: [25, 35],
    ph: [5.5, 6.5],
    moisture: [60, 100],
  },
};

const App = () => {
  const [sensorId, setSensorId] = useState("Sensor-001");
  const [sensorData, setSensorData] = useState([]);
  const [latestReading, setLatestReading] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [savingAlert, setSavingAlert] = useState(false);
  const [smoothingCount] = useState(5);

  const [showHistory, setShowHistory] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const downloadCSV = () => {
    const headers = ["Time", "Type", "Temperature", "pH", "Moisture"];
    const rows = alertHistory.map((item) => [
      new Date(item.timestamp * 1000).toLocaleString(),
      item.alertType,
      item.temperature,
      item.ph,
      item.moisture,
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "alert_history.csv";
    link.click();
  };

  const withMovingAverage = (data, key) => {
    return data.map((item, idx, arr) => {
      const start = Math.max(0, idx - smoothingCount + 1);
      const window = arr.slice(start, idx + 1);
      const avg = window.reduce((sum, d) => sum + d[key], 0) / window.length;
      return { ...item, [${key}_smooth]: parseFloat(avg.toFixed(2)) };
    });
  };

  const fetchSensorData = async () => {
    try {
      const fromTs = fromDate ? Math.floor(fromDate.getTime() / 1000) : null;
      const toTs = toDate ? Math.floor(toDate.getTime() / 1000) : null;

      let url = ${SENSOR_DATA_API}?sensorId=${sensorId};
      if (fromTs !== null) url += &from=${fromTs};
      if (toTs !== null) url += &to=${toTs};

      const res = await axios.get(url);

      const formatted = res.data.map((d) => ({
        ...d,
        ts: Number(d.timestamp),
        fullTime: new Date(d.timestamp * 1000),
        time: new Date(d.timestamp * 1000).toLocaleTimeString(),
      }));

      const filtered = formatted.filter((d) => {
        if (fromDate && d.fullTime < fromDate) return false;
        if (toDate && d.fullTime > toDate) return false;
        return true;
      });

      const smoothed = withMovingAverage(filtered, "moisture");

      setSensorData(smoothed);
      if (smoothed.length) setLatestReading(smoothed[smoothed.length - 1]);

      detectAndSaveAlerts(smoothed);
    } catch (e) {
      console.error("Error fetching sensor data:", e);
    }
  };

  const detectAndSaveAlerts = async (data) => {
    if (data.length < 3) return;
    const last3 = data.slice(-3);
    const average = (key) => last3.reduce((sum, d) => sum + d[key], 0) / 3;
    const thresholds = ALERT_THRESHOLD.Rice;

    const tempAvg = average("temperature");
    const phAvg = average("ph");
    const moistureAvg = average("moisture");

    let alertMessage = null;
    let alertType = null;

    if (tempAvg < thresholds.temperature[0]) {
      alertType = "temperature_low";
      alertMessage = ⚠️ Temperature too low! Avg: ${tempAvg.toFixed(1)}°C (Limit: ${thresholds.temperature[0]}°C);
    } else if (tempAvg > thresholds.temperature[1]) {
      alertType = "temperature_high";
      alertMessage = ⚠️ Temperature too high! Avg: ${tempAvg.toFixed(1)}°C (Limit: ${thresholds.temperature[1]}°C);
    } else if (phAvg < thresholds.ph[0]) {
      alertType = "ph_low";
      alertMessage = ⚠️ pH too low! Avg: ${phAvg.toFixed(2)} (Limit: ${thresholds.ph[0]});
    } else if (phAvg > thresholds.ph[1]) {
      alertType = "ph_high";
      alertMessage = ⚠️ pH too high! Avg: ${phAvg.toFixed(2)} (Limit: ${thresholds.ph[1]});
    } else if (moistureAvg < thresholds.moisture[0]) {
      alertType = "moisture_low";
      alertMessage = ⚠️ Moisture too low! Avg: ${moistureAvg.toFixed(1)}% (Limit: ${thresholds.moisture[0]}%);
    } else if (moistureAvg > thresholds.moisture[1]) {
      alertType = "moisture_high";
      alertMessage = ⚠️ Moisture too high! Avg: ${moistureAvg.toFixed(1)}% (Limit: ${thresholds.moisture[1]}%);
    }

    if (alertMessage && alertType) {
      setActiveAlert(alertMessage);

      const timestamp = Math.floor(Date.now() / 1000);
      const alertItem = {
        sensorId,
        timestamp,
        alertType,
        temperature: parseFloat(tempAvg.toFixed(1)),
        ph: parseFloat(phAvg.toFixed(2)),
        moisture: parseFloat(moistureAvg.toFixed(1)),
      };

      try {
        setSavingAlert(true);
        await axios.post(SAVE_ALERT_API, alertItem);
        setAlerts((prev) => [...prev, { ...alertItem, alertType: alertMessage }]);
      } catch (err) {
        console.error("Error saving alert:", err);
      } finally {
        setSavingAlert(false);
      }
    } else {
      setActiveAlert(null);
    }
  };

  const fetchAlertHistory = async (from, to) => {
    try {
      setLoadingHistory(true);
      let url = ${ALERT_HISTORY_API}?sensorId=${sensorId};
      if (from) url += &from=${Math.floor(new Date(from).getTime() / 1000)};
      if (to) url += &to=${Math.floor(new Date(to).getTime() / 1000)};

      const res = await axios.get(url);
      setAlertHistory(res.data);
      setShowHistory(true);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch alert history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
  }, [sensorId, fromDate, toDate]);

  const applyPreset = (preset) => {
    const now = new Date();
    let from;
    const to = new Date();

    switch (preset) {
      case "1h":
        from = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "today":
        from = new Date();
        from.setHours(0, 0, 0, 0);
        break;
      case "week":
        from = new Date();
        from.setDate(from.getDate() - 7);
        break;
      default:
        return;
    }

    setFromDate(from);
    setToDate(to);
  };

  const paginatedAlerts = alertHistory.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6">🌾 Smart Farming Dashboard</h2>

      {activeAlert && (
        <div className="bg-red-100 text-red-800 p-3 mb-4 text-center font-semibold rounded">
          {activeAlert}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium">Select Sensor:</label>
        <select
          value={sensorId}
          onChange={(e) => setSensorId(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {AVAILABLE_SENSORS.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <label className="flex flex-col text-sm">
          From:
          <input type="datetime-local" onChange={(e) => setFromDate(new Date(e.target.value))} className="border rounded p-1 text-sm" />
        </label>
        <label className="flex flex-col text-sm">
          To:
          <input type="datetime-local" onChange={(e) => setToDate(new Date(e.target.value))} className="border rounded p-1 text-sm" />
        </label>
        <button onClick={() => applyPreset("1h")} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Last 1 Hour</button>
        <button onClick={() => applyPreset("today")} className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">Today</button>
        <button onClick={() => applyPreset("week")} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200">This Week</button>
      </div>

      {!showHistory && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => fetchAlertHistory(null, new Date())}
            className="bg-purple-100 text-purple-800 px-4 py-2 rounded hover:bg-purple-200"
          >
            Show Alert History
          </button>
        </div>
      )}

      {showHistory && (
        <div className="overflow-x-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <button onClick={() => fetchAlertHistory(new Date(Date.now() - 60 * 60 * 1000), new Date())} className="bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200">Last Hour</button>
            <button onClick={() => {
              const start = new Date();
              start.setHours(0, 0, 0, 0);
              fetchAlertHistory(start, new Date());
            }} className="bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200">Today</button>
            <button onClick={() => fetchAlertHistory(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())} className="bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200">Last Week</button>
            <button onClick={downloadCSV} className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Download CSV</button>
            <button onClick={() => setShowHistory(false)} className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Close</button>
          </div>

          {loadingHistory ? (
            <p className="text-center text-gray-500">Loading alert history...</p>
          ) : (
            <>
              <table className="min-w-full table-auto border border-gray-300 bg-white shadow-lg rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">Time</th>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">Temp (°C)</th>
                    <th className="px-4 py-2 border">pH</th>
                    <th className="px-4 py-2 border">Moisture (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlerts.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{new Date(item.timestamp * 1000).toLocaleString()}</td>
                      <td className="px-4 py-2 border">{item.alertType}</td>
                      <td className="px-4 py-2 border">{item.temperature}</td>
                      <td className="px-4 py-2 border">{item.ph}</td>
                      <td className="px-4 py-2 border">{item.moisture}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center mt-4 gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Previous</button>
                <span className="px-3 py-1">Page {currentPage}</span>
                <button disabled={currentPage * rowsPerPage >= alertHistory.length} onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Next</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 mt-6 mb-6">
        <SummaryCard bg="#ffe0b2" border="#ff9800" icon="🌡️" label="Temperature" value={latestReading?.temperature + " °C"} />
        <SummaryCard bg="#bbdefb" border="#2196f3" icon="💧" label="Moisture" value={latestReading?.moisture + "%"} />
        <SummaryCard bg="#c8e6c9" border="#4caf50" icon="🧪" label="pH" value={latestReading?.ph} />
      </div>

      <SensorChart data={sensorData} alertTimestamps={[]} smoothingCount={smoothingCount} />
    </div>
  );
};

export default App;  