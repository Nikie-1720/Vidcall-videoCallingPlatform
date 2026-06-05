
import React, { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #13131a;
    --border: #1e1e2e;
    --accent: #d2691e;
    --accent-glow: rgba(210, 105, 30, 0.5);
    --accent-soft: rgba(210, 105, 30, 0.18);
    --text: #f0eeff;
    --muted: #6b6880;
    --error: #ff5f6d;
    --success: #43e97b;
  }

  body {
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .wrapper {
    position: relative;
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.18;
    animation: drift 12s ease-in-out infinite alternate;
    pointer-events: none;
    z-index: 0;
  }
  .blob-1 { width: 480px; height: 480px; background: #d2691e; top: -120px; left: -100px; animation-delay: 0s; }
  .blob-2 { width: 360px; height: 360px; background: #e8883a; bottom: -80px; right: -60px; animation-delay: -5s; }
  .blob-3 { width: 260px; height: 260px; background: #cd853f; top: 50%; left: 60%; animation-delay: -9s; }

  @keyframes drift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(30px, 20px) scale(1.06); }
  }

  .card {
    position: relative;
    z-index: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 48px 44px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 0 0 1px rgba(210,105,30,0.12), 0 32px 80px rgba(0,0,0,0.6);
    animation: slideUp 0.55s cubic-bezier(.22,.68,0,1.2) both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
  }
  .brand-mark {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #d2691e, #e8883a);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800;
    font-family: 'Syne', sans-serif;
    color: #fff;
    box-shadow: 0 0 16px var(--accent-glow);
  }
  .brand-name {
    font-family: 'Syne', sans-serif;
    font-size: 18px; font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text);
  }

  h1 {
    font-family: 'Syne', sans-serif;
    font-size: 26px; font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .subtitle {
    font-size: 14px; color: var(--muted);
    margin-bottom: 32px;
    font-weight: 400;
  }

  .tabs {
    display: flex;
    background: var(--bg);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 28px;
    border: 1px solid var(--border);
  }
  .tab {
    flex: 1; padding: 9px;
    border: none; background: none;
    color: var(--muted); cursor: pointer;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    transition: all 0.22s ease;
  }
  .tab.active {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 0 14px var(--accent-glow);
  }

  .field { margin-bottom: 18px; }
  .field label {
    display: block;
    font-size: 12px; font-weight: 500;
    letter-spacing: 0.6px; text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .input-wrap { position: relative; }
  .input-wrap .icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    font-size: 16px; opacity: 0.45;
    pointer-events: none;
    user-select: none;
  }
  input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px 12px 42px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input::placeholder { color: var(--muted); opacity: 0.55; }
  input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  input.error-input { border-color: var(--error); }

  .eye-btn {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 15px;
    transition: color 0.2s;
    padding: 4px;
  }
  .eye-btn:hover { color: var(--text); }

  .field-error {
    font-size: 12px; color: var(--error);
    margin-top: 5px; margin-left: 2px;
  }

  .submit-btn {
    width: 100%; margin-top: 8px;
    padding: 14px;
    background: linear-gradient(135deg, #d2691e, #e8883a);
    color: #fff; border: none;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.3px;
    box-shadow: 0 4px 24px var(--accent-glow);
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px var(--accent-glow);
  }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle; margin-right: 8px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .success-banner {
    background: rgba(67,233,123,0.1);
    border: 1px solid rgba(67,233,123,0.3);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 14px; color: var(--success);
    margin-top: 16px; text-align: center;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; } }

  .footer-text {
    text-align: center; margin-top: 24px;
    font-size: 13px; color: var(--muted);
  }
  .footer-text button {
    background: none; border: none;
    color: var(--accent); cursor: pointer;
    font-size: 13px; font-weight: 500;
    padding: 0; margin-left: 4px;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: opacity 0.2s;
  }
  .footer-text button:hover { opacity: 0.75; }
`;

const ICONS = {
  user: "👤",
  at: "✦",
  lock: "🔒",
  eye: "👁",
  eyeOff: "🙈",
};
 
function Field({ label, icon, type, placeholder, value, onChange, error, showToggle, onToggle, showPass }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="input-wrap">
        <span className="icon">{icon}</span>
        <input
          type={showToggle ? (showPass ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={error ? "error-input" : ""}
          autoComplete="off"
        />
        {showToggle && (
          <button className="eye-btn" onClick={onToggle} type="button" tabIndex={-1}>
            {showPass ? ICONS.eyeOff : ICONS.eye}
          </button>
        )}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default function Authentication() {
  

  const [mode, setMode] = React.useState("login");
  const [form, setForm] = React.useState({ name: "", username: "", password: "" });
  const [errors, setErrors] = React.useState({});
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const { handleLogin, handleRegister } = useContext(AuthContext);

 

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (mode === "register" && !form.name.trim()) e.name = "Full name is required.";
    if (!form.username.trim()) e.username = "Username is required.";
    else if (form.username.length < 3) e.username = "Must be at least 3 characters.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Must be at least 6 characters.";
    return e;
  };

  

  const handleSubmit = async () => {
  const e = validate();

  setErrors(e);

  if (Object.keys(e).length > 0) return;

  setLoading(true);
  setSuccess("");

  try {
    if (mode === "login") {
      await handleLogin(
        form.username,
        form.password
      );

      setSuccess(`Welcome back, @${form.username}!`);
    } else {
      const message = await handleRegister(
        form.name,
        form.username,
        form.password
      );

      setSuccess(message || "Account created successfully!");

      setTimeout(() => {
        switchMode("login");
      }, 1500);
    }
  } catch (error) {
    setErrors({
      server:
        error.response?.data?.message ||
        "Something went wrong. Please try again."
    });
  } finally {
    setLoading(false);
  }
};

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setSuccess("");
    setForm({ name: "", username: "", password: "" });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="wrapper">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="card">
          <div className="brand">
            <div className="brand-mark">V</div>
            <span className="brand-name">VidCall</span>
          </div>

          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="subtitle">
            {mode === "login" ? "Sign in to continue your journey." : "Join thousands of happy users today."}
          </p>

          <div className="tabs">
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
            <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>Register</button>
          </div>

          {mode === "register" && (
            <Field
              label="Full Name"
              icon={ICONS.user}
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={update("name")}
              error={errors.name}
            />
          )}

          <Field
            label="Username"
            icon={ICONS.at}
            type="text"
            placeholder="janedoe"
            value={form.username}
            onChange={update("username")}
            error={errors.username}
          />

          <Field
            label="Password"
            icon={ICONS.lock}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            showToggle
            showPass={showPass}
            onToggle={() => setShowPass((v) => !v)}
          />

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          {success && <div className="success-banner">{success}</div>}

          <div className="footer-text">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => switchMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}