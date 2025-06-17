import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

import "../assets/css/register.css";

const API_URL = import.meta.env.VITE_REACT_APP_API;

function register() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [same_password, setSame_password] = useState("");
  const [error, setError] = useState("");

  const validatePassword = (value) => {
    const requirements = [
      /\d/,
      /[a-z]/,
      /[A-Z]/,
      /[!@#$%^&*]/,
      /.{8,}/,
      /\S/,
    ];
    const errorMessages = [
      "Must include at least one number.",
      "Must include at least one lowercase letter.",
      "Must include at least one uppercase letter.",
      "Must include at least one special character.",
      "Password length must be 8 characters or more.",
      "Must not contain any whitespace."
    ];

    const errors = [];
    for (let i = 0; i < requirements.length; i++) {
      if (!requirements[i].test(value)) {
        errors.push(errorMessages[i]);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== same_password) {
      toast.error("Passwords do not match.");
      return;
    }
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        password,
        email,
      }),
    });
    const data = await response.json();

    if (response.status === 200) {
      setUser("");
      setEmail("");
      setPassword("");
      setError("");
      window.location.href = `/`;
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          {/* Replace with your logo import if available */}
          <img src="/logo192.png" alt="Logo" style={{ width: 60, height: 60, marginBottom: 16 }} />
        </div>
        <div className="loginContainer">
          <h1 className="title" style={{ marginBottom: 8 }}>Create Account</h1>
          <p className="subtitle" style={{ marginBottom: 24, color: "#888" }}>Sign up to get started</p>
          <form onSubmit={handleSubmit} className="form" style={{ width: "100%" }}>
            <div className="input-group">
              <label htmlFor="username" className="subtitle" style={{ marginBottom: 4 }}>Username</label>
              <input
                id="username"
                type="text"
                onChange={(e) => setUser(e.target.value)}
                value={user}
                placeholder="Enter your username"
                autoFocus
                className="input"
                style={{ marginBottom: 16 }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="email" className="subtitle" style={{ marginBottom: 4 }}>Email</label>
              <input
                id="email"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                placeholder="Enter your email"
                className="input"
                style={{ marginBottom: 16 }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="password" className="subtitle" style={{ marginBottom: 4 }}>Password</label>
              <input
                id="password"
                type="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                value={password}
                placeholder="Enter your password"
                className="input"
                style={{ marginBottom: 16 }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirm-password" className="subtitle" style={{ marginBottom: 4 }}>Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                onChange={(e) => setSame_password(e.target.value)}
                value={same_password}
                placeholder="Re-enter your password"
                className="input"
                style={{ marginBottom: 16 }}
              />
            </div>
            {error && (
              <p className="errorMessage" style={{ color: "#e74c3c", marginBottom: 12 }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              className="loginButton"
              style={{ width: "100%", marginBottom: 12 }}
              disabled={error.length > 0 && error !== "User already exists"}
            >
              Register
            </button>
          </form>
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#888" }}>Already have an account? </span>
            <a href="/" className="registerLink" style={{ color: "#3498db" }}>
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default register;
