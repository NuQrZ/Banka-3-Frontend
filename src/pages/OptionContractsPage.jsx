import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import TotpModal from "../components/TotpModal.jsx";
import { listSignedOptionContracts } from "../services/OptionContractsService.js";
import {
    exerciseExternalOtcContract,
    isExternalOtcTotpError,
    isExternalOtcTotpMissingSetup,
    listExternalOtcContracts,
    mapExternalOtcExerciseError,
} from "../services/OtcService.js";
import { formatCurrency } from "../utils/loanCalculations.js";
import useFailedAttempts, {
    BLOCKED_MESSAGE,
    MAX_FAILED_ATTEMPTS,
} from "../utils/useFailedAttempts.js";
import "./OptionContractsPage.css";

const FILTERS = [
    { key: "all", label: "Svi" },
    { key: "valid", label: "Vazeci" },
    { key: "expired", label: "Istekli" },
];

function formatDate(unix) {
    if (!unix) return "-";
    return new Date(unix * 1000).toLocaleDateString("sr-RS");
}

function formatDateTime(unix) {
    if (!unix) return "-";
    return new Date(unix * 1000).toLocaleString("sr-RS");
}

function optionTypeLabel(value) {
    const raw = String(value || "").toLowerCase();
    if (raw.includes("call")) return "CALL";
    if (raw.includes("put")) return "PUT";
    return value && value !== "-" ? String(value).toUpperCase() : "-";
}

function statusLabel(status) {
    switch (status) {
        case "expired":
            return "Istekao";
        case "exercised":
            return "Iskoriscen";
        default:
            return "Vazeci";
    }
}

function mapExternalContract(contract) {
    const settlementUnix = contract?.settlementDate
        ? Math.floor(Date.parse(contract.settlementDate) / 1000)
        : null;
    const lastModifiedUnix = contract?.updatedAt
        ? Math.floor(Date.parse(contract.updatedAt) / 1000)
        : null;

    return {
        id: contract?.id,
        holdingId: `external-${contract?.id || Math.random()}`,
        ticker: contract?.securityTicker || "-",
        name: contract?.remoteDisplayName || "Spoljni OTC ugovor",
        optionType: "CALL",
        amount: Number(contract?.quantity || 0),
        reservedQuantity: 0,
        avgCost: 0,
        currentPrice: 0,
        profit: 0,
        strikePrice: Number(contract?.strikePrice || 0),
        currency: contract?.currency || "USD",
        settlementUnix,
        lastModifiedUnix,
        status:
            contract?.status === "exercised"
                ? "exercised"
                : settlementUnix && settlementUnix < Math.floor(Date.now() / 1000)
                    ? "expired"
                    : "valid",
        accountNumber: contract?.localAccountNumber || "-",
        isExternal: true,
        remoteBankCode: contract?.remoteBankCode || "",
        remoteDisplayName: contract?.remoteDisplayName || "",
        raw: contract,
    };
}

export default function OptionContractsPage() {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshTick, setRefreshTick] = useState(0);
    const [pendingExercise, setPendingExercise] = useState(null);
    const [showTotp, setShowTotp] = useState(false);
    const [totpError, setTotpError] = useState("");
    const [totpLoading, setTotpLoading] = useState(false);
    const { attempts, isBlocked, increment, reset } = useFailedAttempts("external-otc-exercise");

    useEffect(() => {
        let cancelled = false;

        async function loadContracts() {
            try {
                setLoading(true);
                const [localData, externalData] = await Promise.all([
                    listSignedOptionContracts(),
                    listExternalOtcContracts({ status: "any" }),
                ]);

                if (!cancelled) {
                    const localRows = Array.isArray(localData) ? localData : [];
                    const externalRows = Array.isArray(externalData?.contracts)
                        ? externalData.contracts.map(mapExternalContract)
                        : [];
                    setContracts([...localRows, ...externalRows]);
                    setError("");
                }
            } catch (e) {
                if (!cancelled) {
                    setError(
                        e?.response?.data?.message ||
                        e.message ||
                        "Greska pri ucitavanju opcionih ugovora."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadContracts();
        return () => {
            cancelled = true;
        };
    }, [refreshTick]);

    const counts = useMemo(() => {
        return contracts.reduce(
            (acc, c) => {
                acc.all += 1;
                if (acc[c.status] !== undefined) acc[c.status] += 1;
                return acc;
            },
            { all: 0, valid: 0, expired: 0, exercised: 0 }
        );
    }, [contracts]);

    const visibleContracts = useMemo(() => {
        const q = search.trim().toLowerCase();

        return contracts.filter((contract) => {
            if (filter !== "all" && contract.status !== filter) return false;
            if (!q) return true;

            return [
                contract.ticker,
                contract.name,
                contract.accountNumber,
                contract.remoteDisplayName,
            ].some((value) => String(value || "").toLowerCase().includes(q));
        });
    }, [contracts, filter, search]);

    async function handleTotpConfirm(code) {
        if (!pendingExercise) return;

        try {
            setTotpLoading(true);
            setTotpError("");
            setError("");
            await exerciseExternalOtcContract(
                pendingExercise.remoteBankCode,
                pendingExercise.id,
                {},
                code
            );
            setShowTotp(false);
            setPendingExercise(null);
            reset();
            setRefreshTick((prev) => prev + 1);
        } catch (e) {
            if (isExternalOtcTotpMissingSetup(e)) {
                setShowTotp(false);
                setPendingExercise(null);
                setTotpError("");
                setError(
                    "Za izvrsenje spoljnog OTC ugovora morate prvo aktivirati dvostepenu verifikaciju (TOTP). Bicete preusmereni na podesavanje."
                );
                navigate("/verify");
                return;
            }

            if (isExternalOtcTotpError(e)) {
                increment();
                const nextAttempts = attempts + 1;
                if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
                    setShowTotp(false);
                    setPendingExercise(null);
                    setTotpError(BLOCKED_MESSAGE);
                } else {
                    setTotpError(mapExternalOtcExerciseError(e));
                }
                return;
            }

            setShowTotp(false);
            setPendingExercise(null);
            setTotpError("");
            setError(mapExternalOtcExerciseError(e));
        } finally {
            setTotpLoading(false);
        }
    }

    return (
        <div className="option-contracts-page oc-page">
            <Sidebar />

            <div className="oc-header">
                <div>
                    <h1 className="oc-title">Opcioni ugovori</h1>
                    <p className="oc-subtitle">
                        Lokalni i spoljni OTC ugovori na jednom mestu.
                    </p>
                </div>

                <button
                    className="oc-refresh-btn"
                    onClick={() => setRefreshTick((prev) => prev + 1)}
                >
                    Osvezi
                </button>
            </div>

            <div className="oc-summary">
                <div className="oc-summary-card">
                    <span>Ukupno</span>
                    <strong>{counts.all}</strong>
                </div>
                <div className="oc-summary-card oc-summary-card--valid">
                    <span>Vazeci</span>
                    <strong>{counts.valid}</strong>
                </div>
                <div className="oc-summary-card oc-summary-card--expired">
                    <span>Istekli</span>
                    <strong>{counts.expired}</strong>
                </div>
            </div>

            <div className="oc-toolbar">
                <div className="oc-tabs" role="tablist" aria-label="Filter opcionih ugovora">
                    {FILTERS.map((item) => (
                        <button
                            key={item.key}
                            role="tab"
                            aria-selected={filter === item.key}
                            className={`oc-tab${filter === item.key ? " oc-tab--active" : ""}`}
                            onClick={() => setFilter(item.key)}
                        >
                            {item.label}
                            <span>{counts[item.key] || 0}</span>
                        </button>
                    ))}
                </div>

                <input
                    className="oc-search"
                    type="text"
                    placeholder="Pretrazi po tickeru, nazivu ili racunu..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading && <div className="oc-state">Ucitavanje opcionih ugovora...</div>}
            {!loading && error && <div className="oc-state oc-state--error">{error}</div>}

            {!loading && !error && (
                <div className="oc-table-wrapper">
                    <table className="oc-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Ticker</th>
                                <th>Naziv</th>
                                <th>Tip</th>
                                <th>Kolicina</th>
                                <th>Raspolozivo</th>
                                <th>Strike</th>
                                <th>Avg cena</th>
                                <th>Trenutna</th>
                                <th>Profit</th>
                                <th>Datum isteka</th>
                                <th>Racun</th>
                                <th>Izvor</th>
                                <th>Modifikovano</th>
                                <th>Akcija</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleContracts.length === 0 && (
                                <tr>
                                    <td colSpan={15} className="oc-empty">
                                        Nema opcionih ugovora koji odgovaraju izabranom filteru.
                                    </td>
                                </tr>
                            )}

                            {visibleContracts.map((contract) => {
                                const available = Math.max(
                                    0,
                                    (contract.amount || 0) - (contract.reservedQuantity || 0)
                                );
                                const profitClass =
                                    (contract.profit || 0) >= 0
                                        ? "oc-profit--plus"
                                        : "oc-profit--minus";

                                return (
                                    <tr key={`${contract.id}-${contract.holdingId}`}>
                                        <td>
                                            <span className={`oc-status oc-status--${contract.status}`}>
                                                {statusLabel(contract.status)}
                                            </span>
                                        </td>
                                        <td className="oc-ticker">{contract.ticker}</td>
                                        <td>{contract.name}</td>
                                        <td>{optionTypeLabel(contract.optionType)}</td>
                                        <td>{contract.amount}</td>
                                        <td>{available}</td>
                                        <td>
                                            {contract.strikePrice > 0
                                                ? formatCurrency(contract.strikePrice, contract.currency)
                                                : "-"}
                                        </td>
                                        <td>{formatCurrency(contract.avgCost || 0, contract.currency)}</td>
                                        <td>{formatCurrency(contract.currentPrice || 0, contract.currency)}</td>
                                        <td className={`oc-profit ${profitClass}`}>
                                            {(contract.profit || 0) >= 0 ? "+" : ""}
                                            {formatCurrency(contract.profit || 0, contract.currency)}
                                        </td>
                                        <td>{formatDate(contract.settlementUnix)}</td>
                                        <td>{contract.accountNumber}</td>
                                        <td>
                                            {contract.isExternal
                                                ? `Banka ${contract.remoteBankCode || "?"}`
                                                : "Nasa banka"}
                                        </td>
                                        <td>{formatDateTime(contract.lastModifiedUnix)}</td>
                                        <td>
                                            {contract.isExternal &&
                                                contract.status === "valid" &&
                                                contract.remoteBankCode && (
                                                    <button
                                                        className="oc-refresh-btn"
                                                        onClick={() => {
                                                            if (isBlocked) {
                                                                setTotpError(BLOCKED_MESSAGE);
                                                                setShowTotp(false);
                                                                return;
                                                            }
                                                            setError("");
                                                            setPendingExercise(contract);
                                                            setTotpError("");
                                                            setShowTotp(true);
                                                        }}
                                                    >
                                                        Iskoristi
                                                    </button>
                                                )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <TotpModal
                open={showTotp}
                title="Potvrda izvrsenja"
                subtitle="Unesite 6-cifreni kod iz autentikator aplikacije da biste izvrsili spoljni OTC ugovor."
                confirmLabel="Potvrdi izvrsenje"
                onConfirm={handleTotpConfirm}
                onCancel={() => {
                    setShowTotp(false);
                    setPendingExercise(null);
                    setTotpError("");
                }}
                loading={totpLoading}
                error={totpError}
            />
        </div>
    );
}
