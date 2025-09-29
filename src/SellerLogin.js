import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./fivlialogo.png";
import { ENDPOINTS } from "apis/endpoints";
import { post } from "apis/apiClient";
import getFcmToken from "fcmToken"
import "./Store.css";
import { startsWith } from "lodash";

function SellerLogin() {
  const [loginMode, setLoginMode] = useState("email"); // "email" | "phone"
  const [email, setEmail] = useState("");
  const [fcmToken, setFcmToken] = useState(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      alert("Please enter your email");
      return;
    }
    if (loginMode === "phone" && !mobileNumber) {
      alert("Please enter your mobile number");
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
        alert("OTP sent successfully!");
      } else {
        alert(res.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      alert(err?.response?.data?.message || "Server error. Try again later.");
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
      alert("Please enter OTP");
      return;
    }

    setLoading(true);
    try {
      const payload = {
      email: loginMode === "email" ? email : undefined,
      PhoneNumber: loginMode === "phone" ? mobileNumber : undefined,
      otp,
      type: "login",
    };
    if (fcmToken) {
      payload.fcmToken = fcmToken;
    }

    const res = await post(ENDPOINTS.VERIFY_OTP, payload);

      if (res.status === 200 && res.data?.sellerId) {
        alert("Login successful!");
        localStorage.setItem("userType", "seller");
        localStorage.setItem("sellerId", res.data.sellerId);
        localStorage.setItem("storeName", res.data.storeName);
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard1");
      } else {
        alert(res.data?.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      alert(err?.response?.data?.message || "Server error. Try again later.");
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
                style={{ cursor: "pointer", marginTop: "10px", color: "#007bff" }}
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
    </div>
  );
}

export default SellerLogin;
