import { post } from "apis/apiClient";
import { ENDPOINTS } from "apis/endpoints";

export async function logoutSeller() {
  try {
    const sellerId = localStorage.getItem("sellerId");
    const deviceId = localStorage.getItem("deviceId");

    if (!sellerId || !deviceId) {
      console.warn("Missing sellerId or deviceId for logout");
      return;
    }

    const res = await post(ENDPOINTS.LOGOUT, { sellerId, deviceId });

    if (res.status === 200) {
      console.log("Logout successful:", res.data.message);
    } else {
      console.warn("Logout failed:", res.data.message);
    }
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    // Always clear local session data
    localStorage.removeItem("token");
    localStorage.removeItem("sellerId");
    localStorage.removeItem("storeName");
    localStorage.removeItem("userType");
    localStorage.removeItem("deviceId");

    window.location.href = "/"; // redirect to login
  }
}
