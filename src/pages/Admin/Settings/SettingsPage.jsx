import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import SettingsTabs from "./SettingsTabs";
import GeneralSettings from "./GeneralSettings";
import CannedResponses from "../Settings/CannedResponses/CannedResponses";
import ApiKeys from "./ApiKeys";
import { useTheme } from "../../../context/ThemeContext";

import Lottie from "lottie-react";
import settingsAnimation from "../../../animations/Desktop and smartphone app development (1).json";

const SettingsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "general");
  const { isDark } = useTheme();

 return (
  <div className="w-full px-2 pb-4">
    {/* DO NOT constrain width */}
    <div className="w-full">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Settings
          </h1>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Manage system preferences
          </p>
        </div>

        {/* SMALL ANIMATION */}
        <div className="w-50 h-1 mt-0.5 flex justify-center items-center">
          <Lottie animationData={settingsAnimation} loop autoplay />
        </div>
      </div>

      {/* TABS */}
      <div className="mb-1">
        <SettingsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* CONTENT */}
      <div
        className={`rounded-md p-3 ${
          isDark
            ? "bg-slate-900 border border-slate-800"
            : "bg-white border border-gray-200"
        }`}
      >
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "canned" && <CannedResponses />}
        {activeTab === "api" && <ApiKeys />}
      </div>
    </div>
  </div>
);

};


export default SettingsPage;
