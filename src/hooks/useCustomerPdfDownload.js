import { useCallback, useState } from "react";
import { triggerCustomerPdfDownload } from "../utils/customerPdfDownload";

export const useCustomerPdfDownload = (customerId, userName) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPdf = useCallback(async () => {
    if (!customerId) return;
    setIsDownloading(true);
    try {
      await triggerCustomerPdfDownload({ customerId, userName });
    } finally {
      setIsDownloading(false);
    }
  }, [customerId, userName]);

  return { downloadPdf, isDownloading };
};
