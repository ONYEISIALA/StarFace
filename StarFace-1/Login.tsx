import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    const user = users.find(
      (u: any) => u.username === username && u.password === password
    );

    if (user) {
      alert("Login successful!");
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      navigate("/social"); // redirect to Social page
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fff, #fff)",
        fontFamily: "Arial, sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#0a1f44", // Dark Blue
          padding: "2.5rem",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "350px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        {/* Big Yellow Title */}
        <h1
          style={{
            color: "#FFD700", // Bright yellow
            fontSize: "2.4rem",
            marginBottom: "0.5rem",
            fontWeight: "bold",
          }}
        >
        🌟  StarFace    🌟
        </h1>
 {/* Subtitle */}
 <p
          style={{
            fontSize: "0.95rem",
            color: "#ccc",
            marginBottom: "1.2rem",
            fontStyle: "italic",
          }}
        >
          A safe social world for the next generation of young stars
        </p>
        <h2 style={{ marginBottom: "1.5rem", color: "#ddd" }}>🔐 Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            marginBottom: "1rem",
            fontSize: "14px",
            background: "#1b2a5a",
            color: "#fff",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #444",
            marginBottom: "1.5rem",
            fontSize: "14px",
            background: "#1b2a5a",
            color: "#fff",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #ffcc00, #ff9900)",
            color: "#0a1f44",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Login
        </button>

        <p style={{ marginTop: "1rem", fontSize: "14px", color: "#ccc" }}>
          New here?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{
              color: "#FFD700",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
