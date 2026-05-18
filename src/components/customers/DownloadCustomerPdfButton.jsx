import React from "react";
import { Download } from "lucide-react";
import { useCustomerPdfDownload } from "../../hooks/useCustomerPdfDownload";

const DownloadCustomerPdfButton = ({
  customerId,
  userName,
  isDark = false,
  disabled = false,
  className = "",
}) => {
  const { downloadPdf, isDownloading } = useCustomerPdfDownload(customerId, userName);
  const isDisabled = disabled || isDownloading || !customerId;

  return (
    <button
      type="button"
      onClick={downloadPdf}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
        isDark
          ? "bg-white/10 text-white border-white/20 hover:bg-white/15 disabled:opacity-50"
          : "bg-white text-violet-700 border-violet-200 hover:bg-violet-50 shadow-sm disabled:opacity-50"
      } ${className}`}
    >
      <Download className={`w-4 h-4 ${isDownloading ? "animate-pulse" : ""}`} />
      {isDownloading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
};

export default DownloadCustomerPdfButton;
