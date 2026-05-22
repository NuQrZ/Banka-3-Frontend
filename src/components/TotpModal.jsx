import { useRef, useState } from "react";

export default function TotpModal({
    open = true,
    title = "Potvrda akcije",
    subtitle = "Unesite 6-cifreni kod iz autentikator aplikacije.",
    confirmLabel = "Potvrdi",
    onConfirm,
    onCancel,
    loading,
    error: externalError = "",
}) {
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [internalError, setInternalError] = useState("");
    const inputs = useRef([]);

    const handleChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const newDigits = [...digits];
        newDigits[index] = digit;
        setDigits(newDigits);
        if (internalError) setInternalError("");

        if (digit && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
        if (e.key === "Enter") handleConfirm();
        if (e.key === "Escape") onCancel();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newDigits = [...digits];
        pasted.split("").forEach((char, i) => {
            newDigits[i] = char;
        });
        setDigits(newDigits);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleConfirm = async () => {
        const code = digits.join("");
        if (code.length !== 6) {
            setInternalError("Unesite svih 6 cifara.");
            return;
        }
        setInternalError("");
        try {
            await onConfirm(code);
        } catch (err) {
            setInternalError(err.message || "Neispravan kod. Pokusajte ponovo.");
            setDigits(["", "", "", "", "", ""]);
            inputs.current[0]?.focus();
        }
    };

    const code = digits.join("");
    const displayedError = externalError || internalError;

    if (!open) {
        return null;
    }

    return (
        <div
            className="totp-overlay"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
            }}
        >
            <div
                className="totp-modal"
                style={{
                    background: "#111827",
                    border: "1px solid #1e293b",
                    borderRadius: "16px",
                    padding: "32px",
                    width: "100%",
                    maxWidth: "420px",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                    }}
                >
                    <h2
                        style={{
                            color: "#f1f5f9",
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            margin: 0,
                        }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onCancel}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            fontSize: "1.2rem",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            lineHeight: 1,
                        }}
                    >
                        X
                    </button>
                </div>

                <p
                    style={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        marginBottom: "28px",
                        lineHeight: 1.5,
                    }}
                >
                    {subtitle}
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                        marginBottom: "16px",
                    }}
                >
                    {digits.map((digit, i) => (
                        <input
                            className="totp-input"
                            key={i}
                            ref={(el) => {
                                inputs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={handlePaste}
                            autoFocus={i === 0}
                            style={{
                                width: "48px",
                                height: "56px",
                                background: "#0f172a",
                                border: `2px solid ${displayedError ? "#ef4444" : digit ? "#3b82f6" : "#1e293b"}`,
                                borderRadius: "10px",
                                color: "#f1f5f9",
                                fontSize: "1.4rem",
                                fontWeight: 600,
                                textAlign: "center",
                                outline: "none",
                                transition: "border-color 0.15s",
                            }}
                        />
                    ))}
                </div>

                {displayedError && (
                    <p
                        className="totp-error"
                        style={{
                            color: "#ef4444",
                            fontSize: "0.85rem",
                            textAlign: "center",
                            marginBottom: "8px",
                        }}
                    >
                        {displayedError}
                    </p>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button
                        className="totp-btn-cancel"
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: "transparent",
                            border: "1.5px solid #1e293b",
                            borderRadius: "10px",
                            color: "#94a3b8",
                            fontSize: "0.92rem",
                            fontWeight: 500,
                            cursor: "pointer",
                        }}
                    >
                        Otkazi
                    </button>
                    <button
                        className="totp-btn-confirm"
                        onClick={handleConfirm}
                        disabled={loading || code.length !== 6}
                        style={{
                            flex: 2,
                            padding: "12px",
                            background: code.length === 6 && !loading ? "#3b82f6" : "#1e3a5f",
                            border: "none",
                            borderRadius: "10px",
                            color: "#fff",
                            fontSize: "0.92rem",
                            fontWeight: 600,
                            cursor: code.length === 6 && !loading ? "pointer" : "not-allowed",
                            opacity: loading ? 0.7 : 1,
                            transition: "background 0.2s",
                        }}
                    >
                        {loading ? "Proverava..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
