import { useState } from "react";
import "../assets/css/login.css";
import logo from "../assets/logo192.png";

const API_URL = import.meta.env.VITE_REACT_APP_API;
function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [incorrectLogin, setIncorrectLogin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        password,
      }),
    });

    if (response.status === 200) {
      const data = await response.json();
      const token = data.token;
      const user_id = data.user_id;

      localStorage.setItem("token", token);
      localStorage.setItem('user', user);
      localStorage.setItem('id', user_id);
      window.location.href = `/`;
    } else {
      setIncorrectLogin(true);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Logo" style={{ width: 60, height: 60, marginBottom: 16 }} />
        </div>
        <div className="loginContainer">
          <h1 className="title" style={{ marginBottom: 8 }}>Welcome Back</h1>
          <p className="subtitle" style={{ marginBottom: 24, color: "#888" }}>Sign in to your account</p>
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
              <label htmlFor="password" className="subtitle" style={{ marginBottom: 4 }}>Password</label>
              <input
                id="password"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                placeholder="Enter your password"
                className="input"
                style={{ marginBottom: 16 }}
              />
            </div>
            {incorrectLogin && (
              <p className="errorMessage" style={{ color: "#e74c3c", marginBottom: 12 }}>
                Incorrect username or password
              </p>
            )}
            <button type="submit" className="loginButton" style={{ width: "100%", marginBottom: 12 }}>
              Login
            </button>
          </form>
          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#888" }}>Don't have an account? </span>
            <a href="/register" className="registerLink" style={{ color: "#3498db" }}>
              Register
            </a>
          </div>
        </div>
      </div>
    </div>

  );
}

export default Login;
