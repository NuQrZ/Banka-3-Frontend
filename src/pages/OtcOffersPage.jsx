import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import OTCTradingModal from "../components/otc/OTCTradingModal.jsx";
import { getAccounts } from "../services/AccountService.js";
import {
    createExternalOtcOffer,
    listExternalPublicHoldings,
} from "../services/OtcService.js";
import "./OtcOffersPage.css";

function fmt(amount, currency = "USD") {
    const value = Number(amount || 0);
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("sr-RS", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function accountCurrency(account) {
    return account?.currency || account?.currency_code || "USD";
}

function accountAvailableBalance(account) {
    if (account?.available_balance != null) return Number(account.available_balance || 0);
    if (account?.balance != null) return Number(account.balance || 0);
    return 0;
}

function sanitizeDisplayName(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export default function OtcOffersPage() {
    const [offers, setOffers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");
    const [actionError, setActionError] = useState("");
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                const [holdings, accountList] = await Promise.all([
                    listExternalPublicHoldings(),
                    getAccounts(),
                ]);
                if (cancelled) return;

                setOffers(Array.isArray(holdings?.items) ? holdings.items : []);
                const normalizedAccounts = Array.isArray(accountList) ? accountList : [];
                setAccounts(normalizedAccounts);

                if (normalizedAccounts.length > 0) {
                    const usd = normalizedAccounts.find((acc) =>
                        String(accountCurrency(acc)).toUpperCase().includes("USD")
                    );
                    setSelectedAccountId(String((usd || normalizedAccounts[0]).id ?? ""));
                }

                setError("");
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e?.response?.data?.message ||
                            e.message ||
                            "Greška pri učitavanju spoljnih OTC ponuda."
                    );
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

    const selectedAccount = useMemo(
        () => accounts.find((acc) => String(acc.id) === String(selectedAccountId)) || null,
        [accounts, selectedAccountId]
    );

    async function handleCreateOffer(payload) {
        if (!selectedOffer) return;
        if (!selectedAccountId) {
            throw new Error("Izaberite račun sa kog kupujete.");
        }

        try {
            setCreating(true);
            setActionError("");
            const result = await createExternalOtcOffer({
                bankCode: selectedOffer.sellerBankPrefix,
                sellerUserRef: selectedOffer.sellerId,
                sellerDisplayName: sanitizeDisplayName(selectedOffer.sellerDisplayName || ""),
                buyerAccountId: selectedAccountId,
                securityTicker: selectedOffer.securityTicker,
                securityType: "stock",
                currency: selectedOffer.currency || "USD",
                quantity: payload.amount,
                pricePerUnit: String(payload.strikePrice),
                premium: String(payload.premium),
                settlementDate: payload.settlementDate,
            });

            setActionMsg(
                `Spoljna OTC ponuda za ${selectedOffer.securityTicker || "hartiju"} je poslata.`
            );
            setSelectedOffer(null);
            return result;
        } catch (e) {
            const message =
                e?.response?.data?.message ||
                e.message ||
                "Greška pri slanju spoljne OTC ponude.";
            setActionError(message);
            throw new Error(message);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="otc-page">
            <Sidebar />

            <h1 className="otc-title">Spoljne OTC ponude</h1>

            <div className="otc-banner" style={{ marginBottom: 16 }}>
                <strong>Kupovni račun:</strong>
                <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    style={{ marginLeft: 8 }}
                >
                    <option value="">-- Izaberite račun --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id || acc.account_number} value={acc.id}>
                                    {acc.account_number} {accountCurrency(acc) ? `(${accountCurrency(acc)})` : ""}
                                </option>
                            ))}
                        </select>
                {selectedAccount && (
                    <span style={{ marginLeft: 12 }}>
                        Raspoloživo:{" "}
                        {fmt(accountAvailableBalance(selectedAccount) / 100, accountCurrency(selectedAccount))}
                    </span>
                )}
            </div>

            {actionMsg && <div className="otc-banner otc-banner--ok">{actionMsg}</div>}
            {actionError && <div className="otc-banner otc-banner--error">{actionError}</div>}

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
                                <th>Količina</th>
                                <th>Banka</th>
                                <th>Prodavac</th>
                                <th>Referentna cena</th>
                                <th>Akcija</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="otc-empty-cell">
                                        Nema dostupnih spoljnih OTC ponuda.
                                    </td>
                                </tr>
                            )}
                            {offers.map((offer) => (
                                <tr
                                    key={`${offer.sellerBankPrefix}-${offer.sellerId}-${offer.securityTicker}`}
                                >
                                    <td className="otc-ticker">{offer.securityTicker || "—"}</td>
                                    <td>{offer.availableCount ?? "—"}</td>
                                    <td>{offer.sellerBankPrefix || "—"}</td>
                                    <td>{offer.sellerDisplayName || "—"}</td>
                                    <td>{fmt(offer.currentPrice, offer.currency || "USD")}</td>
                                    <td>
                                        <button
                                            className="otc-btn otc-btn--accept"
                                            onClick={() => {
                                                setActionError("");
                                                setActionMsg("");
                                                setSelectedOffer(offer);
                                            }}
                                        >
                                            Napravi ponudu
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <OTCTradingModal
                open={Boolean(selectedOffer)}
                stock={{
                    ticker: selectedOffer?.securityTicker,
                    seller: selectedOffer?.sellerDisplayName,
                    currency: selectedOffer?.currency,
                }}
                loading={creating}
                onClose={() => setSelectedOffer(null)}
                onConfirm={handleCreateOffer}
                error={actionError}
            />
        </div>
    );
}
