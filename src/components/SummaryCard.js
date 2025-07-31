import React from "react";

const SummaryCard = ({ bg, border, icon, label, value }) => {
  return (
    <div
      className="flex-1 p-4 rounded-lg shadow"
      style={{ backgroundColor: bg, border: `2px solid ${border}` }}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-sm text-gray-700">{label}</div>
      <div className="text-lg font-semibold">{value ?? "—"}</div>
    </div>
  );
};

export default SummaryCard;
