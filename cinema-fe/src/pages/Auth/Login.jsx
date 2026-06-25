import { Link } from "react-router-dom";
import "../../styles/Login.css";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import { LOGIN_TEXT as T, useLogin } from "./login";

function Login() {
  const {
    email,
    setEmail,
    password,
    setPassword,

    error,
    loading,
    showPassword,
    toggleShowPassword,

    handleLogin,
    handleGoogleLogin,
  } = useLogin();

  return (
    <div className="auth-page">
      <Link to={T.routes.home} className="back-home-btn" title={T.titles.backHome}>
        {T.icons.home}
      </Link>

      <div className="auth-box-page">
        <div className="auth-tabs">
          <button type="button" className="active">
            {T.tabs.login}
          </button>

          <Link to={T.routes.register}>{T.tabs.register}</Link>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label>{T.fields.email.label}</label>
          <input
            name="email"
            type="email"
            placeholder={T.fields.email.placeholder}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>{T.fields.password.label}</label>

          <div className="password-wrapper">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={T.fields.password.placeholder}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="password-eye"
              onClick={toggleShowPassword}
              title={
                showPassword
                  ? T.titles.hidePassword
                  : T.titles.showPassword
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <p className="login-error-text">{error}</p>}

          <Link to={T.routes.forgotPassword} className="forgot">
            {T.links.forgotPassword}
          </Link>

          <button className="blue-btn" type="submit" disabled={loading}>
            {loading ? T.buttons.loggingIn : T.buttons.login}
          </button>

          <button
            type="button"
            className="pink-btn"
            onClick={handleGoogleLogin}
          >
            {T.buttons.googleLogin}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;