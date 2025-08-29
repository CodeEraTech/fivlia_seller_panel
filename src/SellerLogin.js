import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Store.css";
import logo from "./fivlialogo.png";
import { ENDPOINTS } from "apis/endpoints";
import { post } from "apis/apiClient";

function SellerLogin() {
  const [loginMode, setLoginMode] = useState("email"); // "email" | "phone"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authtoken = localStorage.getItem("token");
    if (authtoken) {
      navigate("/dashboard1");
    }
  }, [navigate]);

  // =========================
  // 🔹 Email + Password Login
  // =========================
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await post(ENDPOINTS.LOGIN, {
        email,
        password,
      });

      if (res.status === 200 && res.data?.storeId) {
        alert("Login successful");
        localStorage.setItem("userType", "store");
        localStorage.setItem("storeId", res.data.storeId);
        navigate("/dashboard1");
      } else {
        alert(res.data?.message || "Invalid email/password");
      }
    } catch (err) {
      console.error("Email Login Error:", err);
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔹 Send OTP (Phone Login)
  // =========================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobileNumber) {
      alert("Please enter mobile number");
      return;
    }
    setLoading(true);

    try {
      const res = await post(ENDPOINTS.SEND_OTP, { mobileNumber });
      if (res.status === 200) {
        setOtpSent(true);
        alert("OTP sent successfully");
      } else {
        alert(res.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("OTP Send Error:", err);
      alert("Server error. Try again later.");
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
      const res = await post(ENDPOINTS.VERIFY_OTP, {
        mobileNumber,
        otp,
      });

      if (res.status === 200 && res.data?.token) {
        alert("Login successful");
        localStorage.setItem("userType", "seller");
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard1");
      } else {
        alert(res.data?.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP Verify Error:", err);
      alert("Server error. Try again later.");
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
          onSubmit={loginMode === "email" ? handleEmailLogin : handleSendOtp}
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
              }}
            >
              Login with Phone
            </button>
          </div>

          {/* 🔹 Email + Password Form */}
          {loginMode === "email" && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="password-wrapper">
                <input
                  style={{ width: "343px" }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </>
          )}

          {/* 🔹 Phone + OTP Form */}
          {loginMode === "phone" && (
            <>
              {!otpSent ? (
                <>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                  />
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
                  <button onClick={handleVerifyOtp} disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                  {/* <p
                    className="resend-otp"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Resend OTP
                  </p> */}
                </>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default SellerLogin;