import { useEffect, useMemo, useState } from "react";
import {
    acceptExternalOtcOffer,
    counterExternalOtcOffer,
    getExternalOtcThread,
    withdrawExternalOtcOffer,
} from "../../services/OtcService.js";
import "./OTCTradingModal.css";

function formatMoney(value, currency = "USD") {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("sr-RS", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("sr-RS");
}

function statusLabel(status) {
    switch (status) {
        case "open":
            return "Otvorena";
        case "accepted":
            return "Prihvaćena";
        case "withdrawn":
            return "Povučena";
        case "expired":
            return "Istekla";
        default:
            return status || "—";
    }
}

export default function ExternalOTCThreadModal({
    open = false,
    threadId = null,
    bankCode = null,
    onClose,
}) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [detail, setDetail] = useState(null);
    const [form, setForm] = useState({
        quantity: "",
        pricePerUnit: "",
        premium: "",
        settlementDate: "",
    });

    useEffect(() => {
        if (!open || !threadId) return;

        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError("");
                const data = await getExternalOtcThread(threadId);
                if (cancelled) return;
                setDetail(data || null);

                const latest = Array.isArray(data?.iterations) && data.iterations.length > 0
                    ? data.iterations[data.iterations.length - 1]
                    : null;

                setForm({
                    quantity: latest?.quantity != null ? String(latest.quantity) : "",
                    pricePerUnit: latest?.pricePerUnit || "",
                    premium: latest?.premium || "",
                    settlementDate: latest?.settlementDate
                        ? String(latest.settlementDate).slice(0, 10)
                        : "",
                });
            } catch (e) {
                if (!cancelled) {
                    setError(e?.response?.data?.message || e.message || "Greška pri učitavanju pregovora.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [open, threadId]);

    const thread = detail?.thread || null;
    const iterations = Array.isArray(detail?.iterations) ? detail.iterations : [];
    const latest = iterations.length > 0 ? iterations[iterations.length - 1] : null;

    const waitingOnMe = useMemo(() => {
        return thread?.status === "open" && latest?.proposedBySide === "remote";
    }, [thread, latest]);

    async function refreshAfterMutation() {
        const data = await getExternalOtcThread(threadId);
        setDetail(data || null);
    }

    async function handleAccept() {
        if (!threadId || !bankCode) return;
        try {
            setSubmitting(true);
            setError("");
            const data = await acceptExternalOtcOffer(bankCode, threadId);
            if (data?.mirrorError) {
                throw new Error(data.mirrorError);
            }
            await refreshAfterMutation();
            onClose?.();
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "Greška pri prihvatanju ponude.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleWithdraw() {
        if (!threadId || !bankCode) return;
        try {
            setSubmitting(true);
            setError("");
            const data = await withdrawExternalOtcOffer(bankCode, threadId);
            if (data?.mirrorError) {
                throw new Error(data.mirrorError);
            }
            await refreshAfterMutation();
            onClose?.();
        } catch (e) {
            setError(e?.response?.data?.message || e.message || "Greška pri povlačenju ponude.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCounterSubmit(e) {
        e.preventDefault();
        if (!threadId || !bankCode) return;

        const quantity = Number(form.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
            setError("Količina mora biti pozitivan ceo broj.");
            return;
        }
        if (!form.settlementDate) {
            setError("Datum izvršenja je obavezan.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            const data = await counterExternalOtcOffer(bankCode, threadId, {
                quantity,
                pricePerUnit: form.pricePerUnit,
                premium: form.premium,
                settlementDate: form.settlementDate,
            });
            if (data?.mirrorError) {
                throw new Error(data.mirrorError);
            }
            await refreshAfterMutation();
        } catch (e2) {
            setError(e2?.response?.data?.message || e2.message || "Greška pri slanju kontraponude.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!open) return null;

    return (
        <div className="otc-overlay" onClick={onClose}>
            <div className="otc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="otc-modal-header">
                    <h2 className="otc-modal-title">
                        Spoljni OTC pregovor {thread?.securityTicker ? `- ${thread.securityTicker}` : ""}
                    </h2>
                    <button onClick={onClose} className="otc-modal-close" aria-label="Zatvori">
                        ×
                    </button>
                </div>

                {loading ? (
                    <p className="otc-modal-subtitle">Učitavanje...</p>
                ) : (
                    <>
                        <p className="otc-modal-subtitle">
                            Status: <strong>{statusLabel(thread?.status)}</strong>
                        </p>

                        <div className="otc-form" style={{ maxHeight: "220px", overflowY: "auto", marginBottom: 16 }}>
                            {iterations.length === 0 ? (
                                <p>Nema iteracija.</p>
                            ) : (
                                iterations.map((it, index) => (
                                    <div key={it.id || index} className="otc-form-group" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
                                        <div className="otc-form-label">
                                            #{index + 1} {it.proposedBySide === "local" ? "(ja)" : "(druga strana)"}
                                        </div>
                                        <div>Količina: {it.quantity ?? "—"}</div>
                                        <div>Cena: {formatMoney(it.pricePerUnit, thread?.currency)}</div>
                                        <div>Premium: {formatMoney(it.premium, thread?.currency)}</div>
                                        <div>Datum izvršenja: {formatDate(it.settlementDate)}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {waitingOnMe ? (
                            <form className="otc-form" onSubmit={handleCounterSubmit}>
                                <div className="otc-form-group">
                                    <label htmlFor="ext-qty" className="otc-form-label">Količina</label>
                                    <input
                                        id="ext-qty"
                                        className="otc-input"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={form.quantity}
                                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                    />
                                </div>
                                <div className="otc-form-group">
                                    <label htmlFor="ext-price" className="otc-form-label">Cena po komadu</label>
                                    <input
                                        id="ext-price"
                                        className="otc-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.pricePerUnit}
                                        onChange={(e) => setForm((prev) => ({ ...prev, pricePerUnit: e.target.value }))}
                                    />
                                </div>
                                <div className="otc-form-group">
                                    <label htmlFor="ext-premium" className="otc-form-label">Premium</label>
                                    <input
                                        id="ext-premium"
                                        className="otc-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.premium}
                                        onChange={(e) => setForm((prev) => ({ ...prev, premium: e.target.value }))}
                                    />
                                </div>
                                <div className="otc-form-group">
                                    <label htmlFor="ext-settlement" className="otc-form-label">Datum izvršenja</label>
                                    <input
                                        id="ext-settlement"
                                        className="otc-input"
                                        type="date"
                                        value={form.settlementDate}
                                        onChange={(e) => setForm((prev) => ({ ...prev, settlementDate: e.target.value }))}
                                    />
                                </div>
                                {error && <p className="otc-modal-error">{error}</p>}
                                <div className="otc-modal-actions">
                                    <button type="button" className="otc-btn otc-btn--cancel" onClick={handleWithdraw} disabled={submitting}>
                                        Odustani
                                    </button>
                                    <button type="button" className="otc-btn otc-btn--confirm" onClick={handleAccept} disabled={submitting}>
                                        Prihvati
                                    </button>
                                    <button type="submit" className="otc-btn otc-btn--confirm" disabled={submitting}>
                                        Pošalji kontraponudu
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {error && <p className="otc-modal-error">{error}</p>}
                                {thread?.status === "open" && (
                                    <div className="otc-modal-actions">
                                        <button type="button" className="otc-btn otc-btn--cancel" onClick={handleWithdraw} disabled={submitting}>
                                            Povuci ponudu
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
