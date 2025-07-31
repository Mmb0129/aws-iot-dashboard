import React from "react";

const ChartControls = ({
  showTemperature,
  setShowTemperature,
  showMoisture,
  setShowMoisture,
  showSmoothedLine,
  setShowSmoothedLine,
  showPH,
  setShowPH,
}) => {
  return (
    <div className="mb-4 flex justify-end">
      <details className="relative">
        <summary className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50">
          Chart Controls ⚙️
        </summary>

        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg p-4 z-50">
          <h4 className="text-sm font-semibold mb-2">Toggle Lines</h4>

          <div className="flex items-center justify-between mb-2">
            <label className="text-sm">Temperature</label>
            <input
              type="checkbox"
              checked={showTemperature}
              onChange={(e) => setShowTemperature(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <label className="text-sm">Moisture</label>
            <input
              type="checkbox"
              checked={showMoisture}
              onChange={(e) => setShowMoisture(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <label className="text-sm">Smoothed Moisture</label>
            <input
              type="checkbox"
              checked={showSmoothedLine}
              onChange={(e) => setShowSmoothedLine(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm">pH</label>
            <input
              type="checkbox"
              checked={showPH}
              onChange={(e) => setShowPH(e.target.checked)}
            />
          </div>
        </div>
      </details>
    </div>
  );
};

export default ChartControls;
