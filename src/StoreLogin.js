import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import "./Store.css";
import logo from "./fivlialogo.png";
import auth from "./firebaseConfig"; // 🔥 Import initialized auth from your config file

function StoreLogin() {
  const [email, setEmail] = useState(""); // Changed from username to email
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
        email: email, // this is your input
        password: password,
      }),
    });

    const data = await res.json();

    if (res.status === 200 && data.storeId) {
      alert("Login successful");

      localStorage.setItem("userType", "store");
      localStorage.setItem("storeId", data.storeId);

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
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default StoreLogin;
