import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Store.css";
import logo from "./fivlialogo.png";

function StoreLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [id, setId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const passedId = location.state;
    setId(passedId);
  }, [location.state]);

 const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("https://api.fivlia.in/storeLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        PhoneNumber: username,
        password: password,
      }),
    });

    const data = await res.json();

    if (res.status === 200 && data.storeId) {
      alert("Login successful");

      // Save for future use
      localStorage.setItem("userType", "store");
      localStorage.setItem("storeId", data.storeId); // ⬅️ Store this ID

      // Redirect to dashboard
      window.location.href = "/dashboard1";
    } else {
      alert(data.message || "Invalid credentials");
    }
  } catch (err) {
    console.error("Login Error:", err);
    alert("Server error. Try again later.");
  }
};


  return (
    <div className="login-background">
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
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
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="password-wrapper">
            <input
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
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default StoreLogin;
