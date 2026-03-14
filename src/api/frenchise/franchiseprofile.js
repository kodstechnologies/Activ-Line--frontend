import api from "../axios";

/**
 * Fetches the profile of the currently logged-in franchise admin.
 * @returns {Promise<Object>} The API response data.
 */
export const getMyProfile = () => {
  return api.get("/api/franchise/admin-credentials/me");
};

/**
 * Updates the profile of the currently logged-in franchise admin.
 * @param {FormData | Object} formData - The data to update, which can be a FormData object for file uploads.
 * @returns {Promise<Object>} The API response data.
 */
export const updateMyProfile = (formData) => {
  return api.put("/api/franchise/admin-credentials/me", formData, {
    headers: {
      // Axios will set the correct 'Content-Type' for FormData automatically.
      // If not sending a file, it will be 'application/json'.
    },
  });
};
