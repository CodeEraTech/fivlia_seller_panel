// src/utils/getDeviceInfo.js
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export async function getDeviceInfo() {
  // Load the FingerprintJS library
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  // Unique per device/browser combo (very accurate)
  const deviceId = result.visitorId;

  let deviceType = "laptop"; // default for laptop/desktop

  return { deviceId, deviceType };
}
