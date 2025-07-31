import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";

// Constants for line colors
const LINE_COLORS = {
  temperature: "#e53935",
  moisture: "#1e88e5",
  moisture_smooth: "#ff9800",
  ph: "#43a047",
};

const MAX_DOTS = 200;

const SensorChart = ({
  data,
  alertTimestamps,
  smoothingCount,
  showTemperature,
  showMoisture,
  showSmoothedLine,
  showPH,
  thresholds,
}) => {
  const alertTsSet = useMemo(() => new Set(alertTimestamps), [alertTimestamps]);

  const isThresholdViolation = (key, value) => {
    if (!thresholds) return false;
    const min = thresholds[`${key}Min`];
    const max = thresholds[`${key}Max`];
    if (min == null || max == null) return false;
    return value < min || value > max;
  };


  const CustomDot = useCallback(
    ({ cx, cy, payload, index, dataKey }) => {
      const ts = payload.ts;
      const value = payload[dataKey];
      const isAlert = alertTsSet.has(ts);
      const isThresholdBreach =
        (dataKey === "temperature" && isThresholdViolation("temperature", value)) ||
        (dataKey === "moisture" && isThresholdViolation("moisture", value)) ||
        (dataKey === "ph" && isThresholdViolation("ph", value));

      if (isAlert || isThresholdBreach) {
        return (
          <circle
            key={`dot-${ts}-${index}-${dataKey}`}
            cx={cx}
            cy={cy}
            r={6}
            fill={isAlert ? "red" : "orange"}
            stroke="black"
            strokeWidth={1}
          />
        );
      }
      return null;
    },
    [alertTsSet]
  );

  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (active && payload && payload.length > 0) {
        const ts = payload[0]?.payload?.ts;
        const date = new Date(Number(label) * 1000);
        const isAlert = alertTsSet.has(ts);

        const thresholdWarnings = payload
          .filter((entry) =>
            isThresholdViolation(entry.dataKey, entry.value)
          )
          .map((entry) => entry.name);

        return (
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              padding: "8px",
              color: isAlert ? "red" : "black",
            }}
          >
            <strong>{date.toLocaleString()}</strong>
            {payload.map((entry, index) => (
              <div key={index}>
                <span
                  style={{
                    color: entry.stroke,
                    fontWeight:
                      isAlert || thresholdWarnings.includes(entry.name)
                        ? "bold"
                        : "normal",
                  }}
                >
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
            {isAlert && <div>🚨 Alert triggered</div>}
            {thresholdWarnings.length > 0 && (
              <div>⚠️ Threshold exceeded: {thresholdWarnings.join(", ")}</div>
            )}
          </div>
        );
      }
      return null;
    },
    [alertTsSet]
  );

  if (!data || data.length === 0) {
    return <div>No sensor data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={(tick) => {
            const timestamp = Number(tick);
            if (isNaN(timestamp)) return tick;
            return new Date(timestamp * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          }}
        />
        <YAxis />
        <Tooltip content={CustomTooltip} />
        <Legend />

        {/* Conditional line rendering */}
        {showTemperature && (
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={LINE_COLORS.temperature}
            name="Temperature (°C)"
            dot={
              data.length < MAX_DOTS
                ? (props) => CustomDot({ ...props, dataKey: "temperature" })
                : false
            }
            isAnimationActive={false}
          />
        )}
        {showMoisture && (
          <Line
            type="monotone"
            dataKey="moisture"
            stroke={LINE_COLORS.moisture}
            name="Moisture (%)"
            dot={
              data.length < MAX_DOTS
                ? (props) => CustomDot({ ...props, dataKey: "moisture" })
                : false
            }
            isAnimationActive={false}
          />
        )}
        {showSmoothedLine && (
          <Line
            type="monotone"
            dataKey="moisture_smooth"
            stroke={LINE_COLORS.moisture_smooth}
            name={`Moisture MA (${smoothingCount})`}
            dot={false}
            strokeDasharray="5 2"
            isAnimationActive={false}
          />
        )}
        {showPH && (
          <Line
            type="monotone"
            dataKey="ph"
            stroke={LINE_COLORS.ph}
            name="pH Level"
            dot={
              data.length < MAX_DOTS
                ? (props) => CustomDot({ ...props, dataKey: "ph" })
                : false
            }
            isAnimationActive={false}
          />
        )}

        <Brush
          dataKey="time"
          height={30}
          stroke="#8884d8"
          tickFormatter={(tick) =>
            new Date(Number(tick) * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

SensorChart.propTypes = {
  data: PropTypes.array.isRequired,
  alertTimestamps: PropTypes.array.isRequired,
  smoothingCount: PropTypes.number.isRequired,
  showTemperature: PropTypes.bool.isRequired,
  showMoisture: PropTypes.bool.isRequired,
  showSmoothedLine: PropTypes.bool.isRequired,
  showPH: PropTypes.bool.isRequired,
  thresholds: PropTypes.object,
};

export default SensorChart;
