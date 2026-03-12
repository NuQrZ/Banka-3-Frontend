export function validatePasswordStrength(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("at least 8 characters");
    }
    if (!/[a-zA-Z]/.test(password)) {
        errors.push("at least one letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("at least one special character");
    }

    return errors;
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
    return /^[+]?[0-9\s/-]{6,20}$/.test(phone);
}