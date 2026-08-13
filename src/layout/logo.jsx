import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

// ☀️ LIGHT MODE
import LightFullLogo from "../assets/images/Logo/activLine-final.png";
import LightIconLogo from "../assets/images/Logo/app_icon.png";

// 🌙 DARK MODE
import DarkFullLogo from "../assets/images/Logo/activLine-logo-dark.png";
import DarkIconLogo from "../assets/images/Logo/image.jpg";

const ActivlineLogo = ({ collapsed, profileImage, useFranchiseProfile }) => {
  const { isDark } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [profileImage]);

  const showFranchiseProfile =
    useFranchiseProfile && profileImage && !imageFailed;

  if (showFranchiseProfile) {
    return (
      <img
        src={profileImage}
        alt="Franchise Logo"
        onError={() => setImageFailed(true)}
        className={
          collapsed
            ? "h-12 w-12 rounded-xl object-cover transition-all duration-300"
            : "h-14 w-auto max-w-[180px] rounded-xl object-contain transition-all duration-300"
        }
      />
    );
  }

  // 👉 COLLAPSED SIDEBAR (ICON)
  if (collapsed) {
    return (
      <img
        src={isDark ? DarkIconLogo : LightIconLogo}
        alt="Activline Icon"
        className="h-12 w-auto transition-all duration-300"
      />
    );
  }

  // 👉 EXPANDED SIDEBAR (FULL LOGO)
  return (
    <img
      src={isDark ? DarkFullLogo : LightFullLogo}
      alt="Activline Logo"
      className="h-14 w-auto transition-all duration-300"
    />
  );
};

export default ActivlineLogo;
