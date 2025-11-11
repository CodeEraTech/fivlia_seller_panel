import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./fivlialogo.png";
import { ENDPOINTS } from "apis/endpoints";
import { post } from "apis/apiClient";
import getFcmToken from "fcmToken";
import "./Store.css";
import { Snackbar, Alert } from "@mui/material";
import { getDeviceInfo } from "utils/getDeviceInfo";
function SellerLogin() {
  const [loginMode, setLoginMode] = useState("email"); // "email" | "phone"
  const [email, setEmail] = useState("");
  const [fcmToken, setFcmToken] = useState(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const navigate = useNavigate();

  // ✅ Handle Email Verification Status
 // ✅ Handle Email Verification Status (true / false only)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("verified");

  if (status) {
    let message = "";
    let severity = "info";

    if (status === "true") {
      message = "✅ Email verified successfully! You can now log in.";
      severity = "success";
    } else {
      message = "❌ Email verification failed or link expired. Please try again.";
      severity = "error";
    }

    setAlert({
      open: true,
      message,
      severity,
    });

    // Optional: clean up URL after showing alert
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, "", url.toString());
    }, 5000);
  }
}, []);


  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    const sellerId = localStorage.getItem("token");
    if (sellerId) {
      navigate("/dashboard1", { replace: true });
    }
  }, []);

  useEffect(() => {
    async function fetchToken() {
      const token = await getFcmToken();
      setFcmToken(token);
    }
    fetchToken();
  }, []);

  // =========================
  // 🔹 Send OTP
  // =========================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (loginMode === "email" && !email) {
      setAlert({
        open: true,
        message: "Please enter your email",
        severity: "warning",
      });
      return;
    }
    if (loginMode === "phone" && !mobileNumber) {
      setAlert({
        open: true,
        message: "Please enter your mobile number",
        severity: "warning",
      });
      return;
    }

    let formattedPhone = mobileNumber;
    if (loginMode === "phone" && !formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone}`;
      setMobileNumber(formattedPhone); // optional: update state for UI
    }

    setLoading(true);
    try {
      const res = await post(ENDPOINTS.LOGIN, {
        email: loginMode === "email" ? email : undefined,
        PhoneNumber: loginMode === "phone" ? formattedPhone : undefined,
        type: "seller",
      });

      if (res.status === 200) {
        setOtpSent(true);
        setAlert({
          open: true,
          message: "OTP sent successfully!",
          severity: "success",
        });
      } else {
        setAlert({
          open: true,
          message: res.data?.message || "Failed to send OTP",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      setAlert({
        open: true,
        message: err?.response?.data?.message || "Server error. Try again later.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔹 Verify OTP
  // =========================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setAlert({
        open: true,
        message: "Please enter OTP",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const { deviceId, deviceType } = await getDeviceInfo();
      const payload = {
        email: loginMode === "email" ? email : undefined,
        PhoneNumber: loginMode === "phone" ? mobileNumber : undefined,
        otp,
        deviceId,
        deviceType,
        type: "login",
        token: fcmToken, 
      };

      const res = await post(ENDPOINTS.VERIFY_OTP, payload);

      if (res.status === 200 && res.data?.sellerId) {
        setAlert({
          open: true,
          message: "Login successful!",
          severity: "success",
        });
        localStorage.setItem("deviceId", deviceId);
        localStorage.setItem("userType", "seller");
        localStorage.setItem("sellerId", res.data.sellerId);
        localStorage.setItem("storeName", res.data.storeName);
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard1");
      } else {
        setAlert({
          open: true,
          message: res.data?.message || "Invalid OTP",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setAlert({
        open: true,
        message: err?.response?.data?.message || "Server error. Try again later.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-background">
      <style>{`
        .login-toggle {
          display: flex;
          justify-content: space-evenly;
          margin: 20px 0;
        }
        .login-toggle button {
          background: transparent;
          color: black;
          font-weight: 600;
          border-bottom: 2px solid;
        }
        .login-toggle button:hover {
          border-color: #007bff;
          background: transparent;
          cursor: pointer;
          color: #007bff;
        }
        .login-toggle button.active {
          border-color: #007bff;
          color: #007bff;
        }
      `}</style>

      <div className="login-container">
        <form
          className="login-form"
          onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
        >
          <img
            src={logo}
            style={{
              width: "130px",
              display: "flex",
              justifyContent: "center",
              alignSelf: "center",
            }}
            alt="Fivlia"
          />
          <h2>Seller Login</h2>

          {/* 🔹 Toggle Login Mode */}
          <div className="login-toggle">
            <button
              type="button"
              className={loginMode === "email" ? "active" : ""}
              onClick={() => {
                setLoginMode("email");
                setOtpSent(false);
                setOtp("");
              }}
            >
              Login with Email
            </button>
            <button
              type="button"
              className={loginMode === "phone" ? "active" : ""}
              onClick={() => {
                setLoginMode("phone");
                setOtpSent(false);
                setOtp("");
              }}
            >
              Login with Phone
            </button>
          </div>

          {/* 🔹 Email or Phone Input */}
          {!otpSent ? (
            <>
              {loginMode === "email" ? (
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              ) : (
                <input
                  type="tel"
                  placeholder="Enter Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <p
                className="resend-otp"
                style={{
                  cursor: "pointer",
                  marginTop: "10px",
                  color: "#007bff",
                }}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
              >
                Resend OTP
              </p>
            </>
          )}
        </form>
      </div>

      {/* 🔹 Snackbar Alert */}
      <Snackbar
        open={alert.open}
        autoHideDuration={5000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setAlert({ ...alert, open: false })}
          severity={alert.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default SellerLogin;
