import { toast } from "react-hot-toast";
import { downloadCustomerDetailsPdf } from "../api/customer.api";

const sanitizeFilenamePart = (value) =>
  String(value || "customer")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 80);

export const getCustomerPdfErrorMessage = async (error, fallback = "Failed to download PDF") => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      if (!text) return fallback;
      try {
        const parsed = JSON.parse(text);
        return parsed?.message || parsed?.error || text;
      } catch {
        return text.length > 200 ? fallback : text;
      }
    } catch {
      return error?.message || fallback;
    }
  }

  if (typeof data === "object" && data !== null) {
    return data.message || data.error || fallback;
  }

  return error?.message || fallback;
};

/**
 * Downloads customer details PDF via admin API (shared by Admin / Staff / Franchise).
 */
export const triggerCustomerPdfDownload = async ({ customerId, userName } = {}) => {
  if (!customerId) {
    toast.error("Customer ID is missing.");
    return false;
  }

  try {
    const res = await downloadCustomerDetailsPdf(customerId);
    const blob = new Blob([res.data], { type: "application/pdf" });

    if (!blob.size) {
      toast.error("Received an empty PDF file.");
      return false;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customer_${sanitizeFilenamePart(userName || customerId)}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("PDF downloaded successfully");
    return true;
  } catch (error) {
    const message = await getCustomerPdfErrorMessage(error);
    toast.error(message);
    return false;
  }
};
