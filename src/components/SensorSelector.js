import React, { useEffect } from "react";

const SensorSelector = ({ sensorId, onSensorIdChange, sensorList }) => {
  useEffect(() => {
    if (sensorList.length > 0 && !sensorList.includes(sensorId)) {
      onSensorIdChange(sensorList[0]);
    }
  }, [sensorList]);

  return (
    <div className="flex gap-4 mb-4 flex-wrap items-center">
      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Sensor:</label>
        <select
          value={sensorId}
          onChange={(e) => onSensorIdChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {sensorList.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SensorSelector;
