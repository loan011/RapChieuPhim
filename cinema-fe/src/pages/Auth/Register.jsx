import { Link } from "react-router-dom";
import "../../styles/Register.css";

import { REGISTER_TEXT as T, useRegister } from "./register";

function Register() {
  const {
    form,
    error,
    loading,

    handleChange,
    handleCheckboxChange,
    handleRegister,
    handleGoogleRegister,
  } = useRegister();

  return (
    <div className="auth-page">
      <Link to={T.routes.home} className="back-home-btn" title={T.titles.backHome}>
        {T.icons.home}
      </Link>

      <div className="auth-box-page">
        <div className="auth-tabs">
          <Link to={T.routes.login}>{T.tabs.login}</Link>

          <button type="button" className="active">
            {T.tabs.register}
          </button>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <div>
            <label>{T.fields.name.label}</label>
            <input
              name="name"
              type="text"
              placeholder={T.fields.name.placeholder}
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>{T.fields.password.label}</label>
            <input
              name="password"
              type="password"
              placeholder={T.fields.password.placeholder}
              value={form.password}
              onChange={handleChange}
              required
            />

            <label>{T.fields.birthday.label}</label>
            <input
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
              required
            />

            <label>{T.fields.phone.label}</label>
            <input
              name="phone"
              type="text"
              placeholder={T.fields.phone.placeholder}
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>{T.fields.email.label}</label>
            <input
              name="email"
              type="email"
              placeholder={T.fields.email.placeholder}
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>{T.fields.confirmPassword.label}</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder={T.fields.confirmPassword.placeholder}
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <label>{T.fields.gender.label}</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              {T.genderOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <p className="policy">
            <input
              type="checkbox"
              name="policy"
              checked={form.policy}
              onChange={handleCheckboxChange}
            />{" "}
            {T.policy}
          </p>

          {error && <p className="register-error-text">{error}</p>}

          <button className="blue-btn" type="submit" disabled={loading}>
            {loading ? T.buttons.registering : T.buttons.register}
          </button>

          <button
            type="button"
            className="pink-btn"
            onClick={handleGoogleRegister}
          >
            {T.buttons.googleRegister}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;