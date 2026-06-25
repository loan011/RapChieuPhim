import { Link } from "react-router-dom";
import "../../styles/ForgotPassword.css";

import {
  FORGOT_PASSWORD_TEXT as T,
  useForgotPassword,
} from "./forgotPassword";

function ForgotPassword() {
  const {
    email,
    setEmail,
    codeInput,
    setCodeInput,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,

    step,
    sendingCode,
    verifyingCode,
    resetting,

    handleSubmit,
    sendCode,
    backToEmailStep,
  } = useForgotPassword();

  return (
    <div className="forgot-page">
      <Link to={T.routes.login} className="forgot-back-home">
        {T.links.backToLogin}
      </Link>

      <form className="forgot-box" onSubmit={handleSubmit}>
        <h2>{T.title}</h2>

        {step !== "password" && (
          <div className="forgot-field">
            <label>{T.fields.email.label}</label>
            <input
              type="email"
              placeholder={T.fields.email.placeholder}
              value={email}
              disabled={step !== "email"}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {step === "email" && (
          <button className="forgot-btn" type="submit" disabled={sendingCode}>
            {sendingCode
              ? T.buttons.sendingCode
              : T.buttons.sendCode}
          </button>
        )}

        {step === "code" && (
          <>
            <div className="forgot-field">
              <label>{T.fields.code.label}</label>
              <input
                type="text"
                placeholder={T.fields.code.placeholder}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                required
              />
            </div>

            <button
              className="forgot-btn"
              type="submit"
              disabled={verifyingCode}
            >
              {verifyingCode
                ? T.buttons.verifyingCode
                : T.buttons.verifyCode}
            </button>

            <button
              type="button"
              className="forgot-btn"
              onClick={sendCode}
              disabled={sendingCode}
            >
              {sendingCode
                ? T.buttons.sendingCode
                : T.buttons.resendCode}
            </button>

            <button
              type="button"
              className="forgot-btn secondary"
              onClick={backToEmailStep}
            >
              {T.buttons.changeEmail}
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <div className="forgot-field">
              <label>{T.fields.newPassword.label}</label>
              <input
                type="password"
                placeholder={T.fields.newPassword.placeholder}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="forgot-field">
              <label>{T.fields.confirmPassword.label}</label>
              <input
                type="password"
                placeholder={T.fields.confirmPassword.placeholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button className="forgot-btn" type="submit" disabled={resetting}>
              {resetting
                ? T.buttons.resetting
                : T.buttons.resetPassword}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default ForgotPassword;