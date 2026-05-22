import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import ExternalOTCThreadModal from "../components/otc/ExternalOTCThreadModal.jsx";
import { listExternalOtcThreads } from "../services/OtcService.js";
import "./OtcOffersPage.css";

function fmtMoney(value, currency = "USD") {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("sr-RS", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function fmtDate(value) {
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

export default function OtcThreadsPage() {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                const data = await listExternalOtcThreads();
                if (!cancelled) {
                    setThreads(Array.isArray(data?.threads) ? data.threads : []);
                    setError("");
                }
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
    }, []);

    return (
        <div className="otc-page">
            <Sidebar />

            <h1 className="otc-title">Spoljni OTC pregovori</h1>

            {loading ? (
                <div className="otc-empty">Učitavanje…</div>
            ) : error ? (
                <div className="otc-empty otc-error">{error}</div>
            ) : (
                <div className="otc-table-wrapper">
                    <table className="otc-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Banka</th>
                                <th>Količina</th>
                                <th>Cena</th>
                                <th>Premium</th>
                                <th>Settlement</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {threads.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="otc-empty-cell">
                                        Nema spoljnih OTC pregovora.
                                    </td>
                                </tr>
                            ) : (
                                threads.map((thread) => (
                                    <tr
                                        key={thread.id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            setSelected({
                                                threadId: thread.id,
                                                bankCode: thread.remoteBankCode,
                                            })
                                        }
                                    >
                                        <td className="otc-ticker">{thread.securityTicker || "—"}</td>
                                        <td>{thread.remoteBankCode || "—"}</td>
                                        <td>{thread.quantity ?? "—"}</td>
                                        <td>{fmtMoney(thread.pricePerUnit, thread.currency)}</td>
                                        <td>{fmtMoney(thread.premium, thread.currency)}</td>
                                        <td>{fmtDate(thread.settlementDate)}</td>
                                        <td>{statusLabel(thread.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ExternalOTCThreadModal
                open={Boolean(selected?.threadId && selected?.bankCode)}
                threadId={selected?.threadId || null}
                bankCode={selected?.bankCode || null}
                onClose={() => setSelected(null)}
            />
        </div>
    );
}
