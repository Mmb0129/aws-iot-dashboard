import React, { useState } from "react";
import AddSensorModal from "./AddSensorModal";
import RemoveSensorModal from "./RemoveSensorModal"; // ⬅️ New import

const SettingsPanel = ({ onSensorsAdded, availableSensors, onSensorRemoved }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="bg-gray-200 px-3 py-1 rounded text-sm"
      >
        ⚙️ Settings
      </button>

      {showOptions && (
        <div className="absolute bg-white border shadow p-2 mt-2 z-10 w-40 rounded text-sm">
          <button
            className="w-full text-left px-2 py-1 hover:bg-gray-100"
            onClick={() => {
              setShowAddModal(true);
              setShowOptions(false);
            }}
          >
            + Add Sensor
          </button>
          <button
            onClick={() => setShowRemoveModal(true)}
            className="w-full text-left px-2 py-1 hover:bg-gray-100"
          >
            - Remove Sensor
          </button>
        </div>
      )}

      {showAddModal && (
        <AddSensorModal
          onClose={() => setShowAddModal(false)}
          onSensorsAdded={onSensorsAdded}
        />
      )}

      {showRemoveModal && (
        <RemoveSensorModal
          sensors={availableSensors}
          onClose={() => setShowRemoveModal(false)}
          onSensorRemoved={(id) => {
            onSensorRemoved(id);             // Notify App.js
            setShowRemoveModal(false);       // Close modal
          }}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
