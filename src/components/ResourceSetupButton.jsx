import React, { useEffect, useState } from "react";
import axios from "../axiosInstance"; // uses auto-auth header injection

const ResourceSetupButton = () => {
  const [setupDone, setSetupDone] = useState(false);
  const [setupInProgress, setSetupInProgress] = useState(false);

  useEffect(() => {
    const checkUserSetup = async () => {
      try {
        const res = await axios.get("https://s23filyqu8.execute-api.us-east-1.amazonaws.com/checkUserSetup");
        if (res.data.setupComplete === true) {
          setSetupDone(true);
          localStorage.setItem("resourceSetupDone", "true");
        }
      } catch (err) {
        console.error("❌ Failed to check setup status:", err);
      }
    };

    checkUserSetup();
  }, []);

  const triggerResourceSetup = async () => {
    try {
      setSetupInProgress(true);

      await axios.post("https://s23filyqu8.execute-api.us-east-1.amazonaws.com/createIotResources");
      await axios.post("https://s23filyqu8.execute-api.us-east-1.amazonaws.com/provisionUserStack");

      localStorage.setItem("resourceSetupDone", "true");
      setSetupDone(true);
      alert("✅ Resources successfully initialized!");
    } catch (err) {
      console.error("❌ Resource setup failed:", err);
      alert("Something went wrong. Try again.");
    } finally {
      setSetupInProgress(false);
    }
  };

  if (setupDone) return null;

  return (
    <div className="text-right my-4">
      <button
        onClick={triggerResourceSetup}
        disabled={setupInProgress}
        className={`px-4 py-2 rounded ${
          setupInProgress
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {setupInProgress ? "Setting up..." : "Initialize My Resources"}
      </button>
    </div>
  );
};

export default ResourceSetupButton;
