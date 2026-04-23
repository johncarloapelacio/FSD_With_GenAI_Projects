// Dashboard storage keys and API endpoint keep session and menu access centralized.
const STORAGE_KEYS = {
    activeAccount: "activeAccount",
    dashboardAccess: "dashKey"
};

const MENU_API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?f=a";

// Shared UI state lets the page render from one source of truth.
const state = {
    cart: [],
    cartInView: false,
    total: 0
};

const elements = {};

// App bootstrap validates access, caches elements, wires events, and loads the menu.
document.addEventListener("DOMContentLoaded", () => {
    const activeAccount = localStorage.getItem(STORAGE_KEYS.activeAccount);

    if (!activeAccount) {
        window.location.href = "signin.html";
        return;
    }

    localStorage.removeItem(STORAGE_KEYS.dashboardAccess);
    cacheElements();
    bindEvents();
    updateActiveAccount(activeAccount);
    updateCartCount();
    setView("menu");
    renderMenuLoadingState();
    loadMenu();
});

// DOM element caching prevents repeated document queries during rendering.
function cacheElements() {
    elements.emailDisplay = document.getElementById("emailDisplay");
    elements.itemsInCart = document.getElementById("itemsInCart");
    elements.menuDisplay = document.getElementById("menuDisplay");
    elements.cartDisplay = document.getElementById("cartDisplay");
    elements.cartItem = document.getElementById("cartItem");
    elements.menuToggle = document.getElementById("menuButton");
    elements.cartToggle = document.getElementById("cartButton");
    elements.checkoutButton = document.getElementById("checkoutButton");
    elements.signOutButton = document.getElementById("signOutButton");
}

// Event delegation keeps menu and cart interactions efficient as content rerenders.
function bindEvents() {
    elements.menuToggle.addEventListener("click", displayMenu);
    elements.cartToggle.addEventListener("click", displayCart);
    elements.checkoutButton.addEventListener("click", checkOut);
    elements.signOutButton.addEventListener("click", signOut);

    elements.menuDisplay.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-item-id]");

        if (!button) {
            return;
        }

        addItem(Number(button.dataset.itemId), button.dataset.itemName, Number(button.dataset.price));
    });

    elements.cartItem.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-quantity-change]");

        if (!button) {
            return;
        }

        changeQty(Number(button.dataset.itemId), Number(button.dataset.quantityChange));
    });
}

// View toggling keeps only the requested section visible at a time.
function setView(view) {
    state.cartInView = view === "cart";
    elements.menuDisplay.style.display = state.cartInView ? "none" : "grid";
    elements.cartDisplay.style.display = state.cartInView ? "block" : "none";
}

function displayMenu() {
    setView("menu");
}

function displayCart() {
    setView("cart");
}

// Session helpers update the active account banner and handle sign-out cleanup.
function updateActiveAccount(email) {
    elements.emailDisplay.textContent = email;
}

function signOut() {
    localStorage.removeItem(STORAGE_KEYS.activeAccount);
    localStorage.removeItem(STORAGE_KEYS.dashboardAccess);
    window.location.href = "signin.html";
}

// Price formatting is deterministic so the same item keeps the same price every render.
function getItemPrice(itemId) {
    const baseCents = 799 + (Number(itemId) % 1300);
    return Number((baseCents / 100).toFixed(2));
}

function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Menu rendering uses DOM nodes instead of repeated innerHTML concatenation.
function renderMenuLoadingState() {
    elements.menuDisplay.innerHTML = "<p class=\"menu-message\">Loading menu items...</p>";
}

function renderMenuErrorState() {
    elements.menuDisplay.innerHTML = "<p class=\"menu-message\">Unable to load the menu right now. Please refresh the page.</p>";
}

function showItems(items) {
    elements.menuDisplay.innerHTML = "";
    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const price = getItemPrice(item.idMeal);
        const card = document.createElement("article");
        card.className = "bg-[url('images/marbleBG.png')] bg-cover p-4 rounded-4xl shadow-md flex flex-col items-center h-full";

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "w-full p-2 mb-2 overflow-hidden flex items-center justify-center";

        const image = document.createElement("img");
        image.src = item.strMealThumb;
        image.alt = item.strMeal;
        image.loading = "lazy";
        image.className = "object-cover w-full h-full rounded-lg max-h-48";
        imageWrapper.appendChild(image);

        const title = document.createElement("h3");
        title.className = "text-xl text-orange-200 font-semibold text-center";
        title.textContent = item.strMeal;

        const priceText = document.createElement("p");
        priceText.className = "text-gray-200 text-sm text-center";
        priceText.textContent = `Price: ${formatCurrency(price)}`;

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.dataset.itemId = String(item.idMeal);
        addButton.dataset.itemName = item.strMeal;
        addButton.dataset.price = String(price);
        addButton.className = "bg-purple-300 text-green-900 p-2 pb-2 font-sans font-bold italic rounded-4xl hover:bg-purple-400 transition-colors duration-200 cursor-pointer w-full mt-auto";
        addButton.textContent = "ADD TO CART";

        card.append(imageWrapper, title, priceText, addButton);
        fragment.appendChild(card);
    });

    elements.menuDisplay.appendChild(fragment);
}

// Cart updates recalculate totals once and rerender the full cart display from state.
function addItem(itemId, itemName, price) {
    const existingItem = state.cart.find((item) => item.id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({ id: itemId, name: itemName, price, quantity: 1 });
    }

    refreshCart();
}

function refreshCart() {
    state.total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    renderCart();
    updateCartCount();
}

function renderCart() {
    elements.cartItem.innerHTML = "";

    if (state.cart.length === 0) {
        elements.cartItem.innerHTML = "<p class=\"cart-message\">Your cart is empty. Add something from the menu to get started.</p>";
        return;
    }

    const fragment = document.createDocumentFragment();

    state.cart.forEach((item) => {
        const itemCard = document.createElement("article");
        itemCard.className = "bg-black rounded-4xl shadow p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between";

        const content = document.createElement("div");

        const title = document.createElement("h3");
        title.className = "text-xl text-orange-200 font-semibold mb-1";
        title.textContent = item.name;

        const price = document.createElement("p");
        price.className = "text-gray-200 mb-1";
        price.textContent = `Price: ${formatCurrency(item.price)}`;

        const quantity = document.createElement("p");
        quantity.className = "text-gray-200 mb-2";
        quantity.textContent = `Quantity: ${item.quantity}`;

        content.append(title, price, quantity);

        const controls = document.createElement("div");
        controls.className = "flex space-x-2 mt-2 md:mt-0";

        const incrementButton = document.createElement("button");
        incrementButton.type = "button";
        incrementButton.dataset.itemId = String(item.id);
        incrementButton.dataset.quantityChange = "1";
        incrementButton.className = "bg-green-800 hover:bg-green-900 text-white text-xl font-bold py-1 px-3 rounded-2xl cursor-pointer";
        incrementButton.textContent = "+";

        const decrementButton = document.createElement("button");
        decrementButton.type = "button";
        decrementButton.dataset.itemId = String(item.id);
        decrementButton.dataset.quantityChange = "-1";
        decrementButton.className = "bg-purple-400 hover:bg-purple-500 text-black text-xl font-bold py-1 px-3 rounded-2xl cursor-pointer";
        decrementButton.textContent = "-";

        controls.append(incrementButton, decrementButton);
        itemCard.append(content, controls);
        fragment.appendChild(itemCard);
    });

    const totalWrapper = document.createElement("div");
    totalWrapper.className = "text-center";

    const totalTitle = document.createElement("h3");
    totalTitle.className = "text-3xl font-bold";
    totalTitle.innerHTML = `Total Amount: <span class="text-green-900">${formatCurrency(state.total)}</span>`;

    totalWrapper.appendChild(totalTitle);
    fragment.appendChild(totalWrapper);
    elements.cartItem.appendChild(fragment);
}

function updateCartCount() {
    const itemCount = state.cart.reduce((count, item) => count + item.quantity, 0);
    elements.itemsInCart.textContent = `Items in Cart: ${itemCount}`;
}

function changeQty(itemId, change) {
    state.cart = state.cart
        .map((item) => {
            if (item.id === itemId) {
                return { ...item, quantity: item.quantity + change };
            }

            return item;
        })
        .filter((item) => item.quantity > 0);

    refreshCart();
}

// Checkout either switches to the cart view or generates a receipt for the current order.
function checkOut() {
    if (!state.cartInView) {
        displayCart();
        return;
    }

    if (state.cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const receiptLines = state.cart.map((item) => `${item.name} | ${formatCurrency(item.price)} | Qty: ${item.quantity}`);
    const totalCharged = formatCurrency(state.total);

    state.cart = [];
    refreshCart();
    alert(`Checkout Successful!\n\nReceipt:\n\n${receiptLines.join("\n")}\n\nTotal Charged: ${totalCharged}\nThank you for choosing John Carlo's!`);
}

// Menu loading fetches data once and renders a fallback message if the API fails.
async function loadMenu() {
    try {
        const response = await fetch(MENU_API_URL);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const menu = await response.json();
        showItems(menu.meals || []);
    } catch (error) {
        console.error(error);
        renderMenuErrorState();
    }
}

