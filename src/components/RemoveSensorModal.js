import React, { useState } from "react";
import axios from "../axiosInstance";

const THRESHOLD_API = "https://s23filyqu8.execute-api.us-east-1.amazonaws.com";

const RemoveSensorModal = ({ sensors, onClose, onSensorRemoved }) => {
  const [selectedSensor, setSelectedSensor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRemove = async () => {
    if (!selectedSensor) {
      setError("Please select a sensor to remove");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${THRESHOLD_API}/deleteThreshold`, {
        SensorId: selectedSensor,
      });

      onSensorRemoved(selectedSensor);
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to remove sensor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-20">
      <div className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h2 className="text-lg font-semibold">Remove Sensor</h2>
        
        <select
          className="w-full border rounded px-3 py-1 disabled:opacity-60"
          value={selectedSensor}
          onChange={(e) => setSelectedSensor(e.target.value)}
          disabled={loading}
        >
            <option value="">-- Select Sensor --</option>
            {(sensors || []).map((id) => (
                <option key={id} value={id}>
                    {id}
                </option>
            ))}
        </select>


        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1 rounded bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleRemove}
            className="text-sm px-3 py-1 rounded bg-red-600 text-white"
            disabled={loading}
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveSensorModal;
