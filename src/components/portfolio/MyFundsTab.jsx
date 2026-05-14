import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../utils/loanCalculations.js";
import {
  listMyFunds,
  depositToFund,
  withdrawFromFund,
} from "../../services/FundService.js";
import { getAccounts } from "../../services/AccountService.js";
import "./MyFundsTab.css";

function fmtMoneyMinor(minor, currency = "RSD") {
  const major = (Number(minor) || 0) / 100;
  return formatCurrency(major, currency);
}

function fmtPct(value) {
  const n = Number(value) || 0;
  return `${n.toFixed(2)}%`;
}

const initialModal = (mode, fund, accounts) => ({
  mode,
  fund,
  amount: "",
  account: accounts[0]?.account_number || "",
});

export default function MyFundsTab() {
  const [funds, setFunds] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const triggerRef = useRef(null);
  const modalInputRef = useRef(null);
  const modalRef = useRef(null);
  const mountedRef = useRef(true);

  const permissionsRaw =
    localStorage.getItem("permissions") ||
    sessionStorage.getItem("permissions") ||
    "[]";

  let permissions = [];

  try {
    permissions = JSON.parse(permissionsRaw);
  } catch {
    permissions = [];
  }

  const isSupervisor =
    permissions.includes("admin") ||
    permissions.includes("supervisor") ||
    permissions.includes("employee");

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const [fundsData, accs] = await Promise.all([
          listMyFunds(),
          getAccounts().catch(() => []),
        ]);

        if (cancelled) return;

        setFunds(Array.isArray(fundsData) ? fundsData : []);
        setAccounts(Array.isArray(accs) ? accs : []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Greška pri učitavanju fondova.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!modal) return undefined;

    modalInputRef.current?.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();

        setModal(null);
        setModalError("");

        if (triggerRef.current) {
          triggerRef.current.focus?.();
          triggerRef.current = null;
        }

        return;
      }

      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

  function openModal(mode, fund, triggerEl) {
    triggerRef.current = triggerEl || null;
    setModalError("");
    setModal(initialModal(mode, fund, accounts));
  }

  function closeModal() {
    setModal(null);
    setModalError("");

    if (triggerRef.current) {
      triggerRef.current.focus?.();
      triggerRef.current = null;
    }
  }

  async function refresh() {
    try {
      const data = await listMyFunds();

      if (!mountedRef.current) return;

      setFunds(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!mountedRef.current) return;

      setActionError(e.message || "Osvežavanje nije uspelo.");
    }
  }

  async function handleConfirm() {
    if (!modal) return;

    const fn =
      modal.mode === "deposit"
        ? depositToFund
        : withdrawFromFund;

    setModalError("");
    setSubmitting(true);

    try {
      await fn(modal.fund.id, modal.amount, modal.account);

      const successWord =
        modal.mode === "deposit"
          ? "Uplata izvršena."
          : "Povlačenje izvršeno.";

      setActionMsg(successWord);
      setActionError("");

      closeModal();

      await refresh();
    } catch (e) {
      setModalError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          e.message ||
          "Operacija nije uspela."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="pf-loading">Učitavanje fondova…</div>;
  }

  if (error) {
    return <div className="pf-error">{error}</div>;
  }

  return (
    <div className="pf-funds-tab">
      {actionMsg && (
        <div
          className="pf-banner pf-banner--ok"
          role="status"
          aria-live="polite"
        >
          {actionMsg}
        </div>
      )}

      {actionError && (
        <div
          className="pf-banner pf-banner--error"
          role="alert"
          aria-live="assertive"
        >
          {actionError}
        </div>
      )}

      {isSupervisor ? (
        <div className="portfolio-table-wrapper">
          <table className="portfolio-table pf-table pf-funds-table">
            <thead>
              <tr>
                <th>Fond</th>
                <th>Menadžer</th>
                <th>Ukupna vrednost fonda</th>
                <th>Likvidnost</th>
              </tr>
            </thead>

            <tbody>
              {funds.length === 0 && (
                <tr>
                  <td colSpan={4} className="pf-empty">
                    Nema fondova za prikaz.
                  </td>
                </tr>
              )}

              {funds.map((f) => (
                <tr key={f.id}>
                  <td className="pf-fund-name">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span>{f.name}</span>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#94a3b8",
                          fontWeight: 400,
                        }}
                      >
                        Fond pod upravljanjem supervizora
                      </span>
                    </div>
                  </td>

                  <td>{f.manager || "—"}</td>

                  <td>
                    {fmtMoneyMinor(
                      f.nav_minor,
                      f.currency
                    )}
                  </td>

                  <td>
                    {fmtMoneyMinor(
                      f.value_minor,
                      f.currency
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="portfolio-table-wrapper">
          <table className="portfolio-table pf-table pf-funds-table">
            <thead>
              <tr>
                <th>Fond</th>
                <th>Menadžer</th>
                <th>Udeo</th>
                <th>Vrednost</th>
                <th aria-label="Akcije"></th>
              </tr>
            </thead>

            <tbody>
              {funds.length === 0 && (
                <tr>
                  <td colSpan={5} className="pf-empty">
                    Nemate udeo ni u jednom fondu.
                  </td>
                </tr>
              )}

              {funds.map((f) => (
                <tr key={f.id}>
                  <td className="pf-fund-name">
                    {f.name}
                  </td>

                  <td>{f.manager || "—"}</td>

                  <td>
                    <div className="pf-fund-share">
                      <div
                        className="pf-fund-share-bar"
                        aria-hidden="true"
                      >
                        <span
                          className="pf-fund-share-bar-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(f.share_pct) || 0
                              )
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="pf-fund-share-value">
                        {fmtPct(f.share_pct)}
                      </span>
                    </div>
                  </td>

                  <td>
                    {fmtMoneyMinor(
                      f.value_minor,
                      f.currency
                    )}
                  </td>

                  <td>
                    <div className="pf-fund-actions">
                      <button
                        type="button"
                        className="sell-btn pf-deposit-btn"
                        onClick={(e) =>
                          openModal(
                            "deposit",
                            f,
                            e.currentTarget
                          )
                        }
                      >
                        Uplata
                      </button>

                      <button
                        type="button"
                        className="sell-btn pf-withdraw-btn"
                        onClick={(e) =>
                          openModal(
                            "withdraw",
                            f,
                            e.currentTarget
                          )
                        }
                        disabled={!f.value_minor}
                      >
                        Povlačenje
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && !isSupervisor && (
        <div
          className="pf-overlay"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="pf-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            ref={modalRef}
          >
            <h2>
              {modal.mode === "deposit"
                ? "Uplata u"
                : "Povlačenje iz"}{" "}
              {modal.fund.name}
            </h2>

            <label className="pf-modal-label">
              Račun
            </label>

            <select
              className="pf-modal-input"
              value={modal.account}
              onChange={(e) =>
                setModal({
                  ...modal,
                  account: e.target.value,
                })
              }
            >
              <option value="">
                — Izaberite račun —
              </option>

              {accounts.map((a) => (
                <option
                  key={a.account_number}
                  value={a.account_number}
                >
                  {a.account_number} ·{" "}
                  {a.currency || "RSD"}
                </option>
              ))}
            </select>

            <label className="pf-modal-label">
              Iznos ({modal.fund.currency || "RSD"})
            </label>

            <input
              ref={modalInputRef}
              type="number"
              min="0"
              step="0.01"
              value={modal.amount}
              onChange={(e) =>
                setModal({
                  ...modal,
                  amount: e.target.value,
                })
              }
              className="pf-modal-input"
              placeholder="0.00"
            />

            {modalError && (
              <div className="pf-banner pf-banner--error pf-modal-banner">
                {modalError}
              </div>
            )}

            <div className="pf-modal-actions">
              <button
                type="button"
                className="pf-btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Otkaži
              </button>

              <button
                type="button"
                className="pf-btn-primary"
                onClick={handleConfirm}
                disabled={
                  submitting ||
                  !modal.amount ||
                  !modal.account
                }
              >
                {submitting
                  ? "Slanje…"
                  : modal.mode === "deposit"
                  ? "Uplati"
                  : "Povuci"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}