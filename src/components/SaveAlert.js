import axios from "../axiosInstance";

const lastAlertTimeRef = {};

// Main alert detection and storage function
export const detectAndStoreAlert = async ({
  data,
  sensorId,
  setActiveAlert,
  SAVE_ALERT_API,
  currentThresholds, // ✅ Dynamic thresholds per sensor
}) => {
  if (data.length < 3 || !currentThresholds) return;

  const lastThree = data.slice(-3);
  const timestamps = lastThree.map((d) => d.ts);
  const withinOneMinute =
    Math.max(...timestamps) - Math.min(...timestamps) <= 60;

  if (!withinOneMinute) return;

  const {
    temperatureMin: tempMin,
    temperatureMax: tempMax,
    phMin,
    phMax,
    moistureMin: moistMin,
    moistureMax: moistMax,
  } = currentThresholds;


  const allHighTemp = lastThree.every((d) => d.temperature > tempMax);
  const allLowTemp = lastThree.every((d) => d.temperature < tempMin);
  const allHighPH = lastThree.every((d) => d.ph > phMax);
  const allLowPH = lastThree.every((d) => d.ph < phMin);
  const allHighMoisture = lastThree.every((d) => d.moisture > moistMax);
  const allLowMoisture = lastThree.every((d) => d.moisture < moistMin);

  let alertType = null;

  if (allHighTemp) alertType = "High Temperature";
  else if (allLowTemp) alertType = "Low Temperature";
  else if (allHighPH) alertType = "High pH";
  else if (allLowPH) alertType = "Low pH";
  else if (allHighMoisture) alertType = "High Moisture";
  else if (allLowMoisture) alertType = "Low Moisture";

  if (!alertType) return;

  const lastTimestamp = lastThree[2].ts;
  const recentKey = `${sensorId}_${alertType}`;

  if (
    lastAlertTimeRef[recentKey] &&
    lastTimestamp - lastAlertTimeRef[recentKey] < 300
  ) {
    return; // Deduplicate if within 5 minutes
  }

  lastAlertTimeRef[recentKey] = lastTimestamp;

  const payload = {
    sensorId,
    alertType,
    timestamp: lastTimestamp,
    temperature: lastThree[2].temperature,
    ph: lastThree[2].ph,
    moisture: lastThree[2].moisture,
  };

  try {
    await axios.post(SAVE_ALERT_API, payload);
    const time = new Date(lastTimestamp * 1000).toLocaleTimeString();
    setActiveAlert(`${alertType} detected at ${time}`);
  } catch (err) {
    console.error("Alert storage failed:", err);
  }
};

// Sensor stability check based on dynamic thresholds
export const isSensorStable = (data, currentThresholds) => {
  if (data.length < 3 || !currentThresholds) return true;

  const lastThree = data.slice(-3);
  const {
    temperatureMin: tempMin,
    temperatureMax: tempMax,
    phMin,
    phMax,
    moistureMin: moistMin,
    moistureMax: moistMax,
  } = currentThresholds;

  return lastThree.every(
    (d) =>
      d.temperature >= tempMin &&
      d.temperature <= tempMax &&
      d.ph >= phMin &&
      d.ph <= phMax &&
      d.moisture >= moistMin &&
      d.moisture <= moistMax
  );
};
