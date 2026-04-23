// Authentication storage keys and validation rules shared by register and sign-in flows.
const STORAGE_KEYS = {
    accounts: "accounts",
    activeAccount: "activeAccount",
    dashboardAccess: "dashKey"
};

const MIN_PASSWORD_LENGTH = 5;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/i;

// Local storage helpers keep reads and writes consistent across both pages.
function getStoredAccounts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.accounts) || "[]");
}

function saveStoredAccounts(accounts) {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}

// Shared field validation prevents duplicated branching in the form handlers.
function validateCredentials(email, password) {
    if (!email) {
        return "Email required";
    }

    if (!EMAIL_PATTERN.test(email)) {
        return "Please enter an email with the required pattern\nThe special characters % . + _ - are allowed only before the @ symbol\nExample: ab%12.Cd+23_Ef-45@gh67.IJkl";
    }

    if (!password) {
        return "Password required";
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }

    return "";
}

// Page navigation helpers remain available to the current button markup.
function signinPage() {
    window.location.href = "signin.html";
}

function registerPage() {
    window.location.href = "register.html";
}

// Registration flow rejects duplicates and stores only normalized credentials.
function register(event) {
    event.preventDefault();

    const form = document.getElementById("registerForm");
    const email = document.getElementById("newEmailId").value.trim();
    const password = document.getElementById("newPasswordId").value.trim();
    const validationMessage = validateCredentials(email, password);

    if (validationMessage) {
        alert(validationMessage);
        return;
    }

    const accounts = getStoredAccounts();
    const accountExists = accounts.some((credentials) => credentials.un === email);

    if (accountExists) {
        alert("Account already exists. Please sign in.");
        form.reset();
        signinPage();
        return;
    }

    accounts.push({ un: email, pw: password });
    saveStoredAccounts(accounts);
    alert("Account created!");
    form.reset();
    signinPage();
}

// Sign-in flow validates the active session before granting one dashboard entry.
function validation(event) {
    event.preventDefault();

    const form = document.getElementById("signinForm");
    const email = document.getElementById("emailId").value.trim();
    const password = document.getElementById("pwId").value.trim();
    const validationMessage = validateCredentials(email, password);

    if (validationMessage) {
        alert(validationMessage);
        return;
    }

    const accounts = getStoredAccounts();
    const matchingAccount = accounts.find((credentials) => credentials.un === email && credentials.pw === password);

    if (!matchingAccount) {
        alert("Invalid credentials");
        return;
    }

    if (localStorage.getItem(STORAGE_KEYS.activeAccount)) {
        alert("There's already an account signed in. Please sign out of the current account before signing in.");
        return;
    }

    localStorage.setItem(STORAGE_KEYS.dashboardAccess, "true");
    localStorage.setItem(STORAGE_KEYS.activeAccount, email);
    form.reset();
    alert("Welcome!");
    window.location.href = "dashboard.html";
}

// Page-specific event wiring removes reliance on inline form submission behavior.
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const signinForm = document.getElementById("signinForm");
    const loginPageButton = document.getElementById("loginPageBtn");
    const registerPageButton = document.getElementById("registerBtn");

    if (registerForm) {
        registerForm.addEventListener("submit", register);
    }

    if (signinForm) {
        signinForm.addEventListener("submit", validation);
    }

    if (loginPageButton) {
        loginPageButton.addEventListener("click", signinPage);
    }

    if (registerPageButton) {
        registerPageButton.addEventListener("click", registerPage);
    }
});