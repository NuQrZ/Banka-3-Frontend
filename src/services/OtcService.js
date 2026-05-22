import api from "./api";

// TODO: Zameniti sa pravim API pozivima kada backend implementira OTC endpointe

const MOCK_OFFERS = [
    {
        id: 1,
        ticker: "AAPL",
        quantity: 10,
        price_per_unit: 17500,
        total_price: 175000,
        currency: "RSD",
        seller: "Marko Marković",
        status: "pending",
        created_at: Date.now() / 1000 - 3600,
    },
    {
        id: 2,
        ticker: "MSFT",
        quantity: 5,
        price_per_unit: 27000,
        total_price: 135000,
        currency: "RSD",
        seller: "Jana Janić",
        status: "accepted",
        created_at: Date.now() / 1000 - 7200,
    },
    {
        id: 3,
        ticker: "GOOGL",
        quantity: 3,
        price_per_unit: 11000,
        total_price: 33000,
        currency: "RSD",
        seller: "Petar Petrović",
        status: "rejected",
        created_at: Date.now() / 1000 - 10800,
    },
    {
        id: 4,
        ticker: "GOVT",
        quantity: 20,
        price_per_unit: 10500,
        total_price: 210000,
        currency: "RSD",
        seller: "Ana Anić",
        status: "pending",
        created_at: Date.now() / 1000 - 1800,
    },
];

export async function listActiveOffers() {
    // TODO: return (await api.get("/otc/offers")).data;
    return MOCK_OFFERS;
}

export async function acceptOffer(offerId) {
    // TODO: return (await api.post(`/otc/offers/${offerId}/accept`)).data;
    return { success: true };
}

export async function rejectOffer(offerId) {
    // TODO: return (await api.post(`/otc/offers/${offerId}/reject`)).data;
    return { success: true };
}

export async function counterOffer(offerId, payload) {
    // TODO: return (await api.post(`/otc/offers/${offerId}/counter`, payload)).data;
    return { success: true };
}

function normalizeExternalHoldingsResponse(data) {
    if (Array.isArray(data?.items)) {
        return data;
    }

    if (!Array.isArray(data?.banks)) {
        return { items: [] };
    }

    const items = data.banks.flatMap((bank) =>
        (bank.holdings || []).map((holding) => ({
            ...holding,
            sellerBankPrefix: holding.sellerBankPrefix || bank.bankCode,
        }))
    );

    return { items };
}

export async function listExternalPublicHoldings(params = {}) {
    try {
        const { data } = await api.get("/otc/external-discovery", { params });
        return normalizeExternalHoldingsResponse(data);
    } catch {
        const { data } = await api.get("/otc/discovery", {
            params: { ...params, external: true },
        });
        return normalizeExternalHoldingsResponse(data);
    }
}

export async function createExternalOtcOffer(payload) {
    const requestBody = {
        ...payload,
        bankCode: payload.bankCode || payload.sellerBankPrefix,
    };
    const { data } = await api.post("/otc/external-offers", requestBody);
    return data;
}

export async function listExternalOtcThreads(params = {}) {
    const { data } = await api.get("/otc/external-offers", { params });
    if (Array.isArray(data)) {
        return { threads: data };
    }
    return data;
}

export async function getExternalOtcThread(threadId) {
    const { data } = await api.get(`/otc/external-offers/${encodeURIComponent(threadId)}`);
    return data;
}

export async function counterExternalOtcOffer(bankCode, threadId, payload) {
    const { data } = await api.post(
        `/otc/external-offers/${encodeURIComponent(bankCode)}/${encodeURIComponent(threadId)}/counter`,
        payload,
    );
    return data;
}

export async function withdrawExternalOtcOffer(bankCode, threadId) {
    const { data } = await api.post(
        `/otc/external-offers/${encodeURIComponent(bankCode)}/${encodeURIComponent(threadId)}/withdraw`,
        {},
    );
    return data;
}

export async function acceptExternalOtcOffer(bankCode, threadId) {
    const { data } = await api.post(
        `/otc/external-offers/${encodeURIComponent(bankCode)}/${encodeURIComponent(threadId)}/accept`,
        {},
    );
    return data;
}

export async function listExternalOtcContracts(params = {}) {
    const { data } = await api.get("/otc/external-contracts", { params });
    if (Array.isArray(data)) {
        return { contracts: data };
    }
    return data;
}

export async function exerciseExternalOtcContract(bankCode, contractId, payload = {}, totpCode = "") {
    const config = totpCode ? { headers: { TOTP: totpCode } } : undefined;
    const { data } = await api.post(
        `/otc/external-contracts/${encodeURIComponent(bankCode)}/${encodeURIComponent(contractId)}/exercise`,
        payload,
        config,
    );
    return data;
}

export function isExternalOtcTotpError(error) {
    const status = error?.response?.status;
    const raw =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error?.response?.data ||
        "";

    const message = String(raw).toLowerCase().trim();

    return (
        status === 401 ||
        status === 403 ||
        message.includes("totp") ||
        message.includes("wrong code") ||
        message.includes("invalid code") ||
        message.includes("invalid totp") ||
        message.includes("invalid otp") ||
        message.includes("neispravan kod") ||
        message.includes("pogrešan kod") ||
        message.includes("pogresan kod")
    );
}

export function isExternalOtcTotpMissingSetup(error) {
    const raw =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error?.response?.data ||
        "";

    const message = String(raw).toLowerCase().trim();
    return message.includes("doesn't have totp setup") || message.includes("does not have totp setup");
}

export function mapExternalOtcExerciseError(error) {
    if (!error?.response) {
        return "Izvršenje spoljnog OTC ugovora trenutno nije moguće zbog problema sa mrežom. Pokušajte ponovo.";
    }

    if (isExternalOtcTotpMissingSetup(error)) {
        return "Za izvršenje spoljnog OTC ugovora morate prvo aktivirati dvostepenu verifikaciju (TOTP).";
    }

    if (isExternalOtcTotpError(error)) {
        return "Uneti TOTP kod nije ispravan. Pokušajte ponovo.";
    }

    const raw =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error?.response?.data ||
        "";
    const message = String(raw).toLowerCase().trim();

    if (message.includes("remote bank rejected exercise")) {
        return "Spoljna banka je odbila izvršenje OTC ugovora.";
    }
    if (message.includes("service unavailable") || error?.response?.status === 503) {
        return "Izvršenje spoljnog OTC ugovora trenutno nije moguće zbog privremenog problema sa sistemom. Pokušajte ponovo kasnije.";
    }

    return "Došlo je do greške pri izvršenju spoljnog OTC ugovora. Pokušajte ponovo.";
}
