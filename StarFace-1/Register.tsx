import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper: compute age and birthday check
function ageInfo(dob: Date) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  // Adjust if birthday hasn't happened yet this year
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  // Check if today is their birthday and they turn 18
  const is18Today =
    age === 18 &&
    today.getMonth() === dob.getMonth() &&
    today.getDate() === dob.getDate();

  return { age, is18Today };
}

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!username.trim() || !password.trim() || !dobDay || !dobMonth || !dobYear) {
      alert("Please fill in all fields (including Date of Birth).");
      return;
    }

    const d = parseInt(dobDay, 10);
    const m = parseInt(dobMonth, 10);
    const y = parseInt(dobYear, 10);

    // Validate date
    const dob = new Date(y, m - 1, d);
    if (dob.getFullYear() !== y || dob.getMonth() !== m - 1 || dob.getDate() !== d) {
      alert("Invalid Date of Birth.");
      return;
    }

    const { age, is18Today } = ageInfo(dob);

    if (age >= 18 || is18Today) {
      alert("Sorry, only users under 18 can register.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u: any) => u.username === username)) {
      alert("Username already exists.");
      return;
    }

    const newUser = { username, password, dob: dob.toISOString() };
    localStorage.setItem("users", JSON.stringify([...users, newUser]));
    alert("Registration successful!");
    navigate("/login");
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
        {/* Brand */}
        <h1
          style={{
            color: "#FFD700",
            fontSize: "2.2rem",
            marginBottom: "0.3rem",
            fontWeight: "bold",
          }}
        >
          StarFace
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

        <h2 style={{ marginBottom: "1.5rem", color: "#ddd" }}>📝 Register</h2>

        {/* Username */}
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

        {/* Password */}
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
            marginBottom: "1rem",
            fontSize: "14px",
            background: "#1b2a5a",
            color: "#fff",
          }}
        />

        {/* DOB Fields */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            type="number"
            placeholder="Day"
            min={1}
            max={31}
            value={dobDay}
            onChange={(e) => setDobDay(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#1b2a5a",
              color: "#fff",
            }}
          />
          <input
            type="number"
            placeholder="Month"
            min={1}
            max={12}
            value={dobMonth}
            onChange={(e) => setDobMonth(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#1b2a5a",
              color: "#fff",
            }}
          />
          <input
            type="number"
            placeholder="Year"
            value={dobYear}
            onChange={(e) => setDobYear(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #444",
              background: "#1b2a5a",
              color: "#fff",
            }}
          />
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
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
        >
          Register
        </button>

        {/* Login Link */}
        <p style={{ marginTop: "1rem", fontSize: "14px", color: "#ccc" }}>
          Already registered?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{
              color: "#FFD700",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
