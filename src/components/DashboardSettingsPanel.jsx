import React, { useState } from "react";
import { Settings } from "lucide-react"; // Optional icon

const DashboardSettingsDropdown = ({
  onEditThresholds,
  onToggleTrends,
  onToggleAlerts,
  showTrends,
  showAlertPanel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left mb-4">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-1 bg-gray-200 text-black rounded text-sm hover:bg-gray-300"
        >
          <Settings className="w-4 h-4 mr-2" />
          Dashboard Settings
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-40 origin-top-right rounded border bg-white shadow text-sm">
          <div className="py-1">
            <button
              onClick={() => {
                onEditThresholds();
                setIsOpen(false);
              }}
              className="block px-2 py-1 text-left w-full hover:bg-gray-100"
            >
              Edit Thresholds
            </button>
            <button
              onClick={() => {
                onToggleTrends();
                setIsOpen(false);
              }}
              className="block px-2 py-1 text-left w-full hover:bg-gray-100"
            >
              {showTrends ? "Hide Trends" : "Show Trends"}
            </button>
            <button
              onClick={() => {
                onToggleAlerts();
                setIsOpen(false);
              }}
              className="block px-2 py-1 text-left w-full hover:bg-gray-100"
            >
              {showAlertPanel ? "Hide Alerts" : "Show Alerts"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSettingsDropdown;
