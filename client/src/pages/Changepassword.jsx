import { useEffect, useState } from 'react';
import { toast } from "react-toastify";
import "../assets/css/changepasword.css";

const API_URL = import.meta.env.VITE_REACT_APP_API;

function Changepassword() {
  const [user, setUser] = useState('');
  const [id, setId] = useState('');
  const [, setToken] = useState('');
  const [password, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
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


  const getEmail = async (id) => {
    const response = await fetch(`${API_URL}/register/${id}`);
    if (response.ok) {
      const user = await response.json();
      setEmail(user.email);
    } else {
      console.log('Error retrieving the email');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('userForChangePassword');
    const storedId = localStorage.getItem('idForChangePassword');
    const storedToken = localStorage.getItem('tokenForChangePassword');
    if (!storedUser && !storedId) {
      window.location.replace('/');
    } else {
      setUser(storedUser);
      setId(storedId);
      setToken(storedToken);
      getEmail(storedId);
    }
  }, []);

  const Home = () => {
    window.location.href = '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== same_password) {
      toast.error("Passwords do not match.");
      return;
    }

    const response = await fetch(`${API_URL}/register/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        email,
        password,
      }),
    });

    if (response.status === 200) {
      setNewPassword("");
      setSame_password("");
      toast.success("Password updated successfully.");
    } else {
      toast.error("Error updating password.");
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo192.png" alt="Logo" style={{ width: 60, height: 60, marginBottom: 16 }} />
        </div>
        <div className="loginContainer">
          <h1 className="title" style={{ marginBottom: 8 }}>Change Password</h1>
          <p className="subtitle" style={{ marginBottom: 24, color: "#888" }}>
            Update your password for <b>{user}</b>
          </p>
          <form onSubmit={handleSubmit} className="form" style={{ width: "100%" }}>
            <div className="input-group">
              <label htmlFor="new-password" className="subtitle" style={{ marginBottom: 4 }}>
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                value={password}
                placeholder="Enter new password"
                className="input"
                style={{ marginBottom: 8 }}
              />
              {error && (
                <p className="errorMessage" style={{ color: "#e74c3c", marginBottom: 8 }}>
                  {error}
                </p>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="confirm-password" className="subtitle" style={{ marginBottom: 4 }}>
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                onChange={(e) => setSame_password(e.target.value)}
                value={same_password}
                placeholder="Confirm new password"
                className="input"
                style={{ marginBottom: 16 }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="email" className="subtitle" style={{ marginBottom: 4 }}>
                Email
              </label>
              <input
                id="email"
                type="text"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                placeholder="Email"
                className="input"
                style={{ marginBottom: 16 }}
                disabled
              />
            </div>
            <button type="submit" className="loginButton" style={{ width: "100%", marginBottom: 12 }}>
              Update Password
            </button>
            <button type="button" className="loginButton" style={{ width: "100%", background: "#eee", color: "#333" }} onClick={Home}>
              Home
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ color: "#888" }}>Remembered your password? </span>
            <a href="/" className="registerLink" style={{ color: "#3498db" }}>
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Changepassword;
