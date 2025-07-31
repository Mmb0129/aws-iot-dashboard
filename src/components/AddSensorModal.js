// components/AddSensorModal.js
import React, { useState } from "react";
import axios from "../axiosInstance";

const DEFAULT_THRESHOLDS = {
  temperature: { min: 20, max: 35 },
  moisture: { min: 30, max: 70 },
  ph: { min: 5.5, max: 7.5 },
};

const AddSensorModal = ({ onClose, onSensorsAdded }) => {
  const [count, setCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddSensors = async () => {
    const numToAdd = parseInt(count);
    if (isNaN(numToAdd) || numToAdd <= 0) {
      setError("Enter a valid number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Get existing sensors
      const { data } = await axios.get("https://s23filyqu8.execute-api.us-east-1.amazonaws.com/getAllThresholds");
      const existingSensors = (data || []).map((s) => s.SensorID).filter(Boolean);

      // 2. Find last used sensor number
      const lastNumber = existingSensors.reduce((max, id) => {
        const match = id && id.match(/Sensor-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);

      // 3. Add sensors skipping collisions
      const newSensors = [];
      let added = 0;
      let nextNumber = lastNumber + 1;

      while (added < numToAdd) {
        const sensorId = `Sensor-${String(nextNumber).padStart(3, "0")}`;

        if (!existingSensors.includes(sensorId)) {
          const newSensor = {
            SensorId: sensorId,
            sensorName: `Sensor ${String(nextNumber).padStart(3, "0")}`,
            ...DEFAULT_THRESHOLDS,
          };

          try {
            await axios.post("https://s23filyqu8.execute-api.us-east-1.amazonaws.com/setThreshold", newSensor);
            newSensors.push(sensorId);
            added++;
          } catch (err) {
            console.warn(`Failed to add ${sensorId}:`, err.message || err);
          }
        }

        nextNumber++;
      }

      onSensorsAdded(newSensors);
      onClose();
    } catch (err) {
      console.error("AddSensor error", err);
      setError("Failed to add sensors");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h2 className="text-lg font-semibold">Add Sensors</h2>
        <input
          type="number"
          className="w-full border rounded px-3 py-1"
          placeholder="How many sensors?"
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1 rounded bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleAddSensors}
            className="text-sm px-3 py-1 rounded bg-blue-500 text-white"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSensorModal;
