import React, { useState, useEffect } from "react";
import axios from "../axiosInstance";

const ThresholdEditor = ({ sensorId, onClose }) => {
  const [thresholds, setThresholds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await axios.get(`https://s23filyqu8.execute-api.us-east-1.amazonaws.com/getThreshold?SensorId=${sensorId}`);
        setThresholds(res.data);
      } catch (err) {
        setError("Failed to load threshold values.");
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, [sensorId]);

  const handleChange = (field, value) => {
    setThresholds((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (
      !thresholds.SensorName ||
      thresholds.TemperatureMin >= thresholds.TemperatureMax ||
      thresholds.MoistureMin >= thresholds.MoistureMax ||
      thresholds.PhMin >= thresholds.PhMax
    ) {
      setError("Please check that all fields are filled and min values are less than max.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      SensorId: sensorId,
      sensorName: thresholds.SensorName,
      temperature: {
        min: parseFloat(thresholds.TemperatureMin),
        max: parseFloat(thresholds.TemperatureMax),
      },
      moisture: {
        min: parseFloat(thresholds.MoistureMin),
        max: parseFloat(thresholds.MoistureMax),
      },
      ph: {
        min: parseFloat(thresholds.PhMin),
        max: parseFloat(thresholds.PhMax),
      },
    };

    try {
      await axios.post("https://s23filyqu8.execute-api.us-east-1.amazonaws.com/setThreshold", payload);
      setSuccess("Thresholds saved successfully.");
    } catch (err) {
      setError("Failed to save thresholds.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 bg-white rounded shadow-lg">Loading thresholds...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Thresholds</h2>

        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sensor Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={thresholds.SensorName}
              onChange={(e) => handleChange("SensorName", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Min"
                value={thresholds.TemperatureMin}
                onChange={(e) => handleChange("TemperatureMin", e.target.value)}
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Max"
                value={thresholds.TemperatureMax}
                onChange={(e) => handleChange("TemperatureMax", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Moisture (%)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Min"
                value={thresholds.MoistureMin}
                onChange={(e) => handleChange("MoistureMin", e.target.value)}
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Max"
                value={thresholds.MoistureMax}
                onChange={(e) => handleChange("MoistureMax", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">pH</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Min"
                value={thresholds.PhMin}
                onChange={(e) => handleChange("PhMin", e.target.value)}
              />
              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Max"
                value={thresholds.PhMax}
                onChange={(e) => handleChange("PhMax", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${saving && "opacity-50"}`}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThresholdEditor;
