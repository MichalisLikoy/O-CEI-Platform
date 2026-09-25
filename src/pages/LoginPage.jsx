import {
  AlertCircle,
  Anchor,
  Eye,
  EyeOff,
  LockKeyhole,
  User,
  Waves,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/o-cei.png';
import logo2 from '../assets/V-DETECT.png';

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (username === 'ocei' && password === '1review!') {
      localStorage.setItem('ocei_authenticated', 'true');
      navigate('/dashboard');
      return;
    }

    setError('Invalid username or password.');
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-overlay" />

        <div className="login-brand">
          <div className="login-brand-logos">
            <div className="login-brand-logo-box">
              <img src={logo} alt="O-CEI" />
            </div>

            <div className="login-brand-logo-box">
              <img src={logo2} alt="V-DETECT" />
            </div>
          </div>

          <span>Maritime Monitoring System</span>
        </div>


        <div className="login-visual-content">
          <div className="login-visual-badge">
            <Anchor size={16} />
            Malta Port Operations
          </div>

          <h2>
            Smarter monitoring for cleaner and more efficient port operations.
          </h2>

          <p>
            Monitor vessels, port calls, energy consumption and live vessel
            classifications from one central platform.
          </p>

          <div className="login-features">
            <div>
              <strong>Live</strong>
              <span>Port monitoring</span>
            </div>

            <div>
              <strong>ML</strong>
              <span>Energy predictions</span>
            </div>

            <div>
              <strong>CO₂</strong>
              <span>Emission tracking</span>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          O-CEI · Open Clean Energy Infrastructure
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-container">
          <div className="login-mobile-logo">
            <img
              src={logo}
              alt="O-CEI"
              className="login-mobile-logo-image"
            />

            <span>MARITIME MONITORING SYSTEM</span>
          </div>

          <div className="login-form-header">
            <span className="login-form-eyebrow">Secure access</span>
            <h2>Welcome back</h2>
            <p>Sign in to access the O-CEI monitoring dashboard.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>

            <div className="login-input-wrapper">
              <User size={18} />

              <input
                id="username"
                type="text"
                value={username}
                placeholder="Enter your username"
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <label htmlFor="password">Password</label>

            <div className="login-input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Enter your password"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />

              <button
                type="button"
                className="login-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-submit-button">
              Sign in
            </button>
          </form>

          

          <p className="login-security-message">
            Protected access to the O-CEI monitoring environment.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;