import { useState } from "react";
import { useNavigate, useLocation, useParams  } from "react-router-dom";
import { validatePasswordStrength } from "../utils/validators";
import { confirmPasswordReset } from "../services/AuthService";
import "./ChangePasswordPage.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { token } = location.state || {};



  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strengthErrors, setStrengthErrors] = useState([]);
  const [matchError, setMatchError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setSubmitError("");
    setMatchError("");

    // validacija jačine lozinke
    const errors = validatePasswordStrength(newPassword);
    setStrengthErrors(errors);
    if (errors.length > 0) return;

    // validacija poklapanja
    if (newPassword !== confirmPassword) {
      setMatchError("Lozinke se ne poklapaju.");
      return;
    }

    try {
      setSubmitting(true);

      await confirmPasswordReset({
        token,
        password: newPassword,
      });

      setSuccessMessage("Lozinka uspešno promenjena.");
      setNewPassword("");
      setConfirmPassword("");

      // opciono redirect posle par sekundi
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
        "Greška pri promeni lozinke."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-bg">
      <img src="/bank-logo.png" alt="logo" className="bank-logo" />
      <img src="/menu-icon.png" alt="menu" className="menu-icon" />

      <div className="cp-page-center">
        <div className="cp-card">
          <h2 className="cp-title">Promena lozinke</h2>

          <form onSubmit={handleSubmit}>
            <div className="cp-fields">

              <div className="cp-field">
                <label className="cp-label">Nova lozinka</label>
                <input
                  className="cp-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="cp-field">
                <label className="cp-label">Potvrdite novu lozinku</label>
                <input
                  className="cp-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {strengthErrors.length > 0 && (
                <div className="cp-error-box">
                  <strong>Lozinka mora sadržati:</strong>
                  <ul>
                    {strengthErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {matchError && <p className="cp-error">{matchError}</p>}
              {submitError && <p className="cp-error">{submitError}</p>}
              {successMessage && <p className="cp-success">{successMessage}</p>}
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="cp-btn-back"
                onClick={() => navigate("/login")}
              >
                Nazad
              </button>

              <button
                type="submit"
                className="cp-btn-submit"
                disabled={submitting}
              >
                {submitting ? "Čuvanje..." : "Promeni lozinku"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
