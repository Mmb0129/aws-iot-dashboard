import React, { useState, useEffect } from "react";
import axios from "./axiosInstance";
import SensorChart from "./components/SensorChart";
import SummaryCard from "./components/SummaryCard";
import AlertTable from "./components/AlertTable";
import AlertSummary from "./components/AlertSummary";
import ChartControls from "./components/ChartControls";
import { detectAndStoreAlert, isSensorStable } from "./components/SaveAlert";
import TrendPanel from "./components/TrendPanel";
import ThresholdEditor from "./components/ThresholdEditor";
import SensorSelector from "./components/SensorSelector";
import SettingsPanel from "./components/SettingsPanel";
import ExportControls from "./components/ExportControls";
import ResourceSetupButton from "./components/ResourceSetupButton";
import DashboardSettingsPanel from "./components/DashboardSettingsPanel";

import {
  getCurrentUser,
  signInWithRedirect,
  signOut,
  fetchAuthSession,
} from 'aws-amplify/auth';


import '@aws-amplify/ui';
import '@aws-amplify/auth/enable-oauth-listener'; // ✅ Required to finish the sign-in redirect

import { Amplify } from 'aws-amplify';
import { awsconfig } from './amplify-config';
import { getAuthHeaders } from "./authUtils";

Amplify.configure(awsconfig);

const SENSOR_DATA_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com/getSensorData";
const SAVE_ALERT_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com/saveAlert";
const ALERT_HISTORY_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com/getAlertHistory";
const THRESHOLD_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com";

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
  const [smoothingCount] = useState(5);

  const [showHistory, setShowHistory] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowLimit, setRowLimit] = useState(10);

  const [showSmoothedLine, setShowSmoothedLine] = useState(true);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showMoisture, setShowMoisture] = useState(true);
  const [showPH, setShowPH] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [showTrends, setShowTrends] = useState(false);
  const [selectedTrendRange, setSelectedTrendRange] = useState(60); // 60 mins = 1 hour

  const [thresholds, setThresholds] = useState(null);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [availableSensors, setAvailableSensors] = useState([]);
  const currentThresholds = thresholds ? thresholds[sensorId] ?? null : null;

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Utility to normalize threshold keys to camelCase
  
  const normalizeThresholds = (raw) => {
    return {
      sensorId: raw.SensorID,
      sensorName: raw.SensorName,
      temperatureMin: raw.TemperatureMin,
      temperatureMax: raw.TemperatureMax,
      moistureMin: raw.MoistureMin,
      moistureMax: raw.MoistureMax,
      phMin: raw.PhMin,
      phMax: raw.PhMax,
    };
  };
  
  const fetchSensorData = async () => {
    try {
      const fromTs = fromDate ? Math.floor(fromDate.getTime() / 1000) : null;
      const toTs = toDate ? Math.floor(toDate.getTime() / 1000) : null;
      let url = `${SENSOR_DATA_API}?sensorId=${sensorId}`;
      if (fromTs !== null) url += `&from=${fromTs}`;
      if (toTs !== null) url += `&to=${toTs}`;
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

      const withMA = filtered.map((item, idx, arr) => {
        const start = Math.max(0, idx - smoothingCount + 1);
        const window = arr.slice(start, idx + 1);
        const avg = (key) => window.reduce((sum, d) => sum + d[key], 0) / window.length;
        return {
          ...item,
          moisture_smooth: parseFloat(avg("moisture").toFixed(2)),
        };
      });

      setSensorData(withMA);
      if (withMA.length) setLatestReading(withMA[withMA.length - 1]);
    } catch (e) {
      console.error("Sensor fetch error:", e);
    }
  };

  const fetchAlertHistory = async (from, to) => {
    try {
      setLoadingHistory(true);
      let url = `${ALERT_HISTORY_API}?sensorId=${sensorId}`;
      if (from) url += `&from=${Math.floor(new Date(from).getTime() / 1000)}`;
      if (to) url += `&to=${Math.floor(new Date(to).getTime() / 1000)}`;
      const res = await axios.get(url);
      setAlertHistory(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const applyPreset = (preset) => {
    const now = new Date();
    let from;
    const to = new Date();

    if (preset === "1h") from = new Date(now.getTime() - 3600000);
    else if (preset === "today") from = new Date(now.setHours(0, 0, 0, 0));
    else if (preset === "week") from = new Date(now.setDate(now.getDate() - 7));

    setFromDate(from);
    setToDate(to);
  };

  const latest = sensorData.length > 0 ? sensorData[sensorData.length - 1] : null;

  useEffect(() => {
    fetchSensorData();
  }, [sensorId, fromDate, toDate]);

  useEffect(() => {
    if (sensorData.length >= 3 && thresholds) {
      detectAndStoreAlert({
        data: sensorData,
        sensorId,
        setActiveAlert,
        SAVE_ALERT_API,
        currentThresholds: thresholds,
      });
    }
  }, [sensorData, thresholds]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSensorData();
    }, 10000); // every 10 seconds
    return () => clearInterval(interval); // cleanup on unmount or toggle off
  }, [autoRefresh, sensorId, fromDate, toDate]);

  useEffect(() => {
    if (activeAlert && isSensorStable(sensorData, currentThresholds)) {
      const timeout = setTimeout(() => {
        setActiveAlert(null);
      }, 10000); // Display alert for 10 seconds
      return () => clearTimeout(timeout);
    }
  }, [sensorData, activeAlert, currentThresholds]);


  useEffect(() => {
    const fetchThresholds = async () => {
      if (!sensorId) return;
      
      try {
        setLoadingThresholds(true);
        const response = await axios.get(
          `${THRESHOLD_API}/getThreshold?SensorId=${sensorId}`
        );
        if (response.data) {
          const normalized = normalizeThresholds(response.data);
          setThresholds(normalized);
        } else {
          console.warn("No thresholds found for sensor:", sensorId);
          setThresholds(null);
        }
      } catch (error) {
        console.error("Error fetching thresholds:", error);
        setThresholds(null);
      } finally {
        setLoadingThresholds(false);
      }
    };

    fetchThresholds();
  }, [sensorId]);

  useEffect(() => {
    if (sensorId) {
      setSelectedSensor(sensorId);
    }
  }, [sensorId]);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await axios.get(`${THRESHOLD_API}/getAllThresholds`);
        const sensors = (res.data || []).map((s) => s.SensorID || s.SensorId).filter(Boolean);
        setAvailableSensors(sensors);
        if (sensors.length > 0 && !sensors.includes(sensorId)) {
          setSensorId(sensors[0]);
        }
      } catch (err) {
        console.error("Failed to fetch sensors", err);
      }
    };
    
    fetchSensors();
  }, []);

  useEffect(() => {
    console.log("Thresholds in App.js:", thresholds);
  }, [thresholds]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.log("Not signed in:", error);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);


  const handleSignIn = () => signInWithRedirect();
  const handleSignOut = () => signOut();


  const handleSensorsAdded = (newSensorIds) => {
    const updatedList = Array.from(new Set([...availableSensors, ...newSensorIds]));
    setAvailableSensors(updatedList);
    if (newSensorIds.length > 0) {
      setSensorId(newSensorIds[0]);
    }
  };

  const handleSensorRemoved = (removedId) => {
    const updated = availableSensors.filter((id) => id !== removedId);
    setAvailableSensors(updated);
    if (sensorId === removedId && updated.length > 0) {
      setSensorId(updated[0]);
    }
  };


   return (
  <div className="p-6 font-sans bg-gray-50 min-h-screen space-y-6">
   {/* Header */}
   <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
    <h2 className="text-2xl font-bold">🌾 Smart Farming Dashboard</h2>
    {user ? (
     <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
     >
      Sign Out
     </button>
    ) : (
     <button
      onClick={handleSignIn}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
     >
      Sign In
     </button>
    )}
   </div>

   {/* Loading & Auth */}
   {loadingUser ? (
    <div className="text-center mt-20 text-lg text-gray-700">
     Loading user info...
    </div>
   ) : !user ? (
    <div className="text-center mt-20 text-lg text-gray-700">
     Please sign in to access the dashboard.
    </div>
   ) : (
    <>
     <ResourceSetupButton />

     {/* Alert banner */}
     {activeAlert && (
      <div className="bg-red-100 text-red-800 p-3 mb-4 text-center font-semibold rounded">
       {activeAlert}
      </div>
     )}

     {/* Sensor controls */}
     <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <SettingsPanel
       onSensorsAdded={handleSensorsAdded}
       availableSensors={availableSensors}
       onSensorRemoved={handleSensorRemoved}
      />

      <SensorSelector
       sensorId={sensorId}
       onSensorIdChange={setSensorId}
       sensorList={availableSensors}
       onSensorRemoved={handleSensorRemoved}
      />
     </div>

     {/* Dashboard Controls */}
     <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <DashboardSettingsPanel
       onEditThresholds={() => setShowThresholdEditor(true)}
       onToggleTrends={() => setShowTrends((prev) => !prev)}
       onToggleAlerts={() => setShowAlertPanel((prev) => !prev)}
       showTrends={showTrends}
       showAlertPanel={showAlertPanel}
      />

      <button
       onClick={() => setAutoRefresh(!autoRefresh)}
       className={`text-sm px-3 py-1 rounded border ${
        autoRefresh
         ? "bg-green-100 text-green-700 border-green-300"
         : "bg-gray-200 text-gray-700 border-gray-300"
       }`}
      >
       {autoRefresh ? "🟢 Auto-Refresh On" : "⛔ Auto-Refresh Off"}
      </button>
     </div>

     {/* Date Range Filters */}
     <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
      <label className="text-sm">
       From:
       <input
        type="datetime-local"
        onChange={(e) => setFromDate(new Date(e.target.value))}
        className="ml-1 border rounded p-1"
       />
      </label>
      <label className="text-sm">
       To:
       <input
        type="datetime-local"
        onChange={(e) => setToDate(new Date(e.target.value))}
        className="ml-1 border rounded p-1"
       />
      </label>
      <button
       onClick={() => applyPreset("1h")}
       className="bg-blue-100 text-blue-700 px-3 py-1 rounded"
      >
       Last 1 Hour
      </button>
      <button
       onClick={() => applyPreset("today")}
       className="bg-green-100 text-green-700 px-3 py-1 rounded"
      >
       Today
      </button>
      <button
       onClick={() => applyPreset("week")}
       className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded"
      >
       This Week
      </button>
     </div>

     {/* Trend Panel */}
     {showTrends && (
      <TrendPanel
       sensorData={sensorData}
       latest={latest}
       selectedRange={selectedTrendRange}
       onRangeChange={(range) => setSelectedTrendRange(range)}
       onClose={() => setShowTrends(false)}
      />
     )}

     {/* Alert Panel */}
     {showAlertPanel && (
      <div className="bg-red-200 shadow-xl rounded-2xl p-6 space-y-6 mb-8 border border-gray-200">
       <h3 className="text-xl font-semibold text-center text-purple-700">
        Alert History
       </h3>

       <div className="flex flex-wrap justify-center gap-3">
        <button
         onClick={() => fetchAlertHistory(new Date(Date.now() - 3600000), new Date())}
         className="bg-purple-100 text-purple-800 px-4 py-2 rounded hover:bg-purple-200"
        >
         Last Hour
        </button>
        <button
         onClick={() => fetchAlertHistory(new Date().setHours(0, 0, 0, 0), new Date())}
         className="bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200"
        >
         Today
        </button>
        <button
         onClick={() => fetchAlertHistory(new Date(Date.now() - 604800000), new Date())}
         className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded hover:bg-yellow-200"
        >
         Last Week
        </button>
        {showHistory && (
         <button
          onClick={() => setShowHistory(false)}
          className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
         >
          Close
         </button>
        )}
       </div>

       {showHistory && (
        <div className="space-y-6">
         <AlertSummary data={alertHistory} />
         <AlertTable
          alerts={alertHistory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          rowLimit={rowLimit}
          setRowLimit={setRowLimit}
         />
        </div>
       )}
      </div>
     )}

     {/* Threshold Editor */}
     {showThresholdEditor && (
      <ThresholdEditor
       sensorId={sensorId}
       onClose={() => setShowThresholdEditor(false)}
      />
     )}

     {/* Metric Summary */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      <SummaryCard
       bg="#ffe0b2"
       border="#ff9800"
       icon="🌡️"
       label="Temperature"
       value={latestReading?.temperature + " °C"}
      />
      <SummaryCard
       bg="#bbdefb"
       border="#2196f3"
       icon="💧"
       label="Moisture"
       value={latestReading?.moisture + "%"}
      />
      <SummaryCard
       bg="#c8e6c9"
       border="#4caf50"
       icon="🧪"
       label="pH"
       value={latestReading?.ph}
      />
     </div>

     {/* Chart Area */}
     <div className="space-y-4">
      <ChartControls
       showTemperature={showTemperature}
       setShowTemperature={setShowTemperature}
       showMoisture={showMoisture}
       setShowMoisture={setShowMoisture}
       showSmoothedLine={showSmoothedLine}
       setShowSmoothedLine={setShowSmoothedLine}
       showPH={showPH}
       setShowPH={setShowPH}
      />

      <SensorChart
       data={sensorData}
       alertTimestamps={alertHistory.map((a) => Number(a.timestamp))}
       smoothingCount={smoothingCount}
       showTemperature={showTemperature}
       showMoisture={showMoisture}
       showSmoothedLine={showSmoothedLine}
       showPH={showPH}
       thresholds={thresholds}
      />
     </div>
    </>
   )}
  </div>
 );

};

export default App;
