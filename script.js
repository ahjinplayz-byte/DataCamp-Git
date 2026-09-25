// Handles ordering, reservations, reviews, and payment interactions.
const cartIcon = document.querySelector("#cart-icon");
const cart = document.querySelector(".cart");
const cartClose = document.querySelector("#cartClose");

// Toggle the side cart with the same control used to open it.
if (cartIcon && cart) {
    cartIcon.addEventListener("click", () => {
        const isOpen = cart.classList.toggle("active");

        cartIcon.setAttribute("aria-expanded", String(isOpen));
        
        // Hide the cart icon and show the close button
        cartIcon.style.display = "none";
        cartClose.style.display = "block";
    });
}

if (cartClose) {
    cartClose.addEventListener("click", () => {
        cart.classList.remove("active");

        cartIcon.setAttribute("aria-expanded", "false");
        
        // Hide the close button and show the cart icon
        cartClose.style.display = "none";
        cartIcon.style.display = "flex";
    });
}

// Global Helper function to sanitize user input and prevent XSS
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Show temporary notification toast
const showNotification = (message) => {
    let notificationContainer = document.querySelector("#cart-notification");

    if (!notificationContainer) {
        notificationContainer = document.createElement("div");
        notificationContainer.id = "cart-notification";
        document.body.appendChild(notificationContainer);
    }

    notificationContainer.textContent = message;
    notificationContainer.classList.add("show");

    setTimeout(() => {
        notificationContainer.classList.remove("show");
    }, 3000);
};

// Add to Cart Buttons Listener
const addCartButtons = document.querySelectorAll(".addCart");
const quantityModal = document.getElementById("quantityModal");
const quantityModalItem = document.getElementById("quantityModalItem");
const quantityModalImage = document.getElementById("quantityModalImage");
const quantityValue = document.getElementById("quantityValue");
const quantityDecreaseButton = document.getElementById("quantityDecrease");
const quantityIncreaseButton = document.getElementById("quantityIncrease");
const cancelQuantityButton = document.querySelector(".cancelQuantity");
const confirmQuantityButton = document.querySelector(".confirmQuantity");

let selectedFoodbox = null;
let modalQuantity = 1;

const openQuantityModal = foodbox => {
    selectedFoodbox = foodbox;
    const foodTitle = foodbox.querySelector(".foodTitle").textContent.trim();
    const foodImage = foodbox.querySelector("img").src;
    quantityModalItem.textContent = foodTitle;
    quantityModalImage.src = foodImage;
    quantityModalImage.alt = foodTitle;
    modalQuantity = 1;
    quantityValue.textContent = modalQuantity;
    quantityModal.classList.add("show");
    quantityModal.setAttribute("aria-hidden", "false");
};

const closeQuantityModal = () => {
    quantityModal.classList.remove("show");
    quantityModal.setAttribute("aria-hidden", "true");
};

addCartButtons.forEach(button => {
    button.addEventListener("click", event => {
        const foodbox = event.target.closest(".foodBox");
        openQuantityModal(foodbox);
    });
});

quantityDecreaseButton?.addEventListener("click", () => {
    if (modalQuantity > 1) {
        modalQuantity--;
        quantityValue.textContent = modalQuantity;
    }
});

quantityIncreaseButton?.addEventListener("click", () => {
    modalQuantity++;
    quantityValue.textContent = modalQuantity;
});

cancelQuantityButton?.addEventListener("click", closeQuantityModal);
confirmQuantityButton?.addEventListener("click", () => {
    if (selectedFoodbox) {
        addToCart(selectedFoodbox, modalQuantity);
        closeQuantityModal();
    }
});

quantityModal?.addEventListener("click", event => {
    if (event.target === quantityModal) {
        closeQuantityModal();
    }
});

const cartContent = document.querySelector(".cartContent");

const addToCart = (foodbox, quantity = 1) => {
    const foodImgSrc = foodbox.querySelector("img").src;
    const foodTitle = foodbox.querySelector(".foodTitle").textContent.trim();
    const foodPrice = foodbox.querySelector(".price").textContent;

    const cartItems = cartContent.querySelectorAll(".cartBox");
    const existingCartItem = Array.from(cartItems).find(cartBox => {
        return cartBox.querySelector(".cartFoodTitle").textContent === foodTitle;
    });

    if (existingCartItem) {
        const numberElement = existingCartItem.querySelector(".number");
        const currentQuantity = parseInt(numberElement.textContent, 10) || 0;
        const newQuantity = currentQuantity + quantity;
        numberElement.textContent = newQuantity;
        existingCartItem.querySelector(".decrement").style.color = "#333";
        showNotification(`${foodTitle} quantity updated to ${newQuantity}.`);
        updateCartCount(quantity);
        updateTotalPrice();
        return;
    }

    const cartBox = document.createElement("div");
    cartBox.classList.add("cartBox");
    cartBox.innerHTML = `
        <img src="${foodImgSrc}" alt="${foodTitle}">
        <div class="cartDetail">
            <h2 class="cartFoodTitle">${foodTitle}</h2>
            <span class="cartPrice">${foodPrice}</span>
            <div class="cartQuantity">
                <button class="decrement">-</button>
                <span class="number">${quantity}</span>
                <button class="increment">+</button>
            </div>
        </div>
        <i class="ri-delete-bin-line cartRemove"></i>
    `;
    
    cartContent.appendChild(cartBox);
    showNotification(`${foodTitle} (x${quantity}) added to cart.`);

    cartBox.querySelector(".cartRemove").addEventListener("click", () => {
        const itemQuantity = parseInt(cartBox.querySelector(".number").textContent, 10) || 0;
        cartBox.remove();
        updateCartCount(-itemQuantity);
        updateTotalPrice();
    });

    cartBox.querySelector(".cartQuantity").addEventListener("click", event => {
        const numberElement = cartBox.querySelector(".number");
        const decrementButton = cartBox.querySelector(".decrement");
        const oldQuantity = parseInt(numberElement.textContent, 10) || 0;
        let quantityValue = oldQuantity;

        if (event.target.classList.contains("decrement") && quantityValue > 1) {
            quantityValue--;
            if (quantityValue === 1) {
                decrementButton.style.color = "#999";
            }
        } else if (event.target.classList.contains("increment")) {
            quantityValue++;
            decrementButton.style.color = "#333";
        }

        const quantityChange = quantityValue - oldQuantity;
        if (quantityChange !== 0) {
            updateCartCount(quantityChange);
        }
        numberElement.textContent = quantityValue;

        updateTotalPrice();
    });

    updateCartCount(quantity);
    updateTotalPrice();
};

/**
 * Recalculates the total price of all items currently in the shopping cart.
 */
const updateTotalPrice = () => {
    const totalPriceElement = document.querySelector(".totalPrice");
    if (!totalPriceElement) return;

    const cartBoxes = cartContent ? cartContent.querySelectorAll(".cartBox") : [];
    let total = 0;

    cartBoxes.forEach(cartBox => {
        const priceElement = cartBox.querySelector(".cartPrice");
        const quantityElement = cartBox.querySelector(".number");
        
        const price = parseFloat(priceElement.textContent.replace("₱", ""));
        const quantity = parseInt(quantityElement.textContent, 10) || 0;
        
        total += price * quantity;
    });

    totalPriceElement.textContent = `₱${total.toFixed(2)}`;
};

/**
 * Tracks and updates the total number of items shown on the cart counter badge.
 */
let cartItemCount = 0;
const updateCartCount = change => {
    const cartItemCountBadge = document.querySelector(".cartItemCount");
    if (!cartItemCountBadge) return;

    cartItemCount += change;

    if (cartItemCount > 0) {
        cartItemCountBadge.style.visibility = "visible";
        cartItemCountBadge.textContent = cartItemCount;
    } else {
        cartItemCountBadge.style.visibility = "hidden";
        cartItemCountBadge.textContent = "";
    }
};

/**
 * Dynamically creates and displays a modal receipt listing purchased items and total cost.
 */
const displayReceipt = (purchasedItems, total) => {
    let receiptContainer = document.querySelector("#receiptModal");
    
    if (!receiptContainer) {
        receiptContainer = document.createElement("div");
        receiptContainer.id = "receiptModal";
        receiptContainer.classList.add("receiptModal");
        document.body.appendChild(receiptContainer);
    }

    let itemsHTML = "";
    purchasedItems.forEach(item => {
        itemsHTML += `
            <div class="receiptItem">
                <span>${item.title} (x${item.quantity})</span>
                <span>₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });

    receiptContainer.innerHTML = `
        <div class="receiptContent">
            <button id="closeReceiptBtn">&times;</button>
            <h2>Order Receipt</h2>
            <hr />
            <div class="receiptBody">
                ${itemsHTML}
            </div>
            <hr />
            <div class="receiptTotal">
                <strong>Total Paid:</strong> <strong>₱${total.toFixed(2)}</strong>
            </div>
        </div>
    `;

    receiptContainer.classList.add("show");

    receiptContainer.querySelector("#closeReceiptBtn").addEventListener("click", () => {
        receiptContainer.classList.remove("show");
    });
};

// ==========================================
// BUY NOW ACTION LISTENER
// ==========================================

const buyNowButton = document.querySelector(".btnBuy");
buyNowButton?.addEventListener("click", () => {
    const cartBoxes = cartContent.querySelectorAll(".cartBox");
    
    if (cartBoxes.length === 0) {
        showNotification("Your cart is empty. Please add items before buying.");
        return;
    }

    const purchasedItems = [];
    let total = 0;

    cartBoxes.forEach(cartBox => {
        const title = cartBox.querySelector(".cartFoodTitle").textContent;
        const price = parseFloat(cartBox.querySelector(".cartPrice").textContent.replace("₱", ""));
        const quantity = parseInt(cartBox.querySelector(".number").textContent, 10);
        
        purchasedItems.push({ title, price, quantity });
        total += price * quantity;

        cartBox.remove();
    });

    cartItemCount = 0;
    updateCartCount(0);
    updateTotalPrice();

    cart?.classList.remove("active");

    displayReceipt(purchasedItems, total);
});

// ==========================================
// RESERVATION SYSTEM MANAGEMENT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservationForm");
    const reservationList = document.getElementById("reservationList");
    const resDateInput = document.getElementById("resDate");

    if (!form || !reservationList || !resDateInput) return;

    const today = new Date().toISOString().split("T")[0];
    resDateInput.setAttribute("min", today);

    let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

    renderReservations();

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const newReservation = {
            id: Date.now(),
            name: document.getElementById("guestName").value,
            email: document.getElementById("email").value,
            partySize: document.getElementById("partySize").value,
            date: document.getElementById("resDate").value,
            time: document.getElementById("resTime").value,
        };

        reservations.push(newReservation);
        saveAndRender();

        form.reset();

        cart?.classList.add("active");
        cartIcon?.setAttribute("aria-expanded", "true");
    });

    window.deleteReservation = (id) => {
        reservations = reservations.filter((res) => res.id !== id);
        saveAndRender();
    };

    function saveAndRender() {
        localStorage.setItem("reservations", JSON.stringify(reservations));
        renderReservations();
    }

    function renderReservations() {
        if (reservations.length === 0) {
            reservationList.innerHTML = `<p class="emptyMsg">No reservations found.</p>`;
            return;
        }

        reservationList.innerHTML = reservations
            .map(
                (res) => `
                <div class="reservationItem">
                    <h3>${escapeHTML(res.name)} (${res.partySize} ${res.partySize == 1 ? 'Guest' : 'Guests'})</h3>
                    <p><strong>Date:</strong> ${res.date} at ${res.time}</p>
                    <p><strong>Contact:</strong> ${escapeHTML(res.email)}</p>
                    <button class="deleteBtn" onclick="deleteReservation(${res.id})" title="Cancel Booking">&times;</button>
                </div>
            `
            )
            .join("");
    }
});

// ==========================================
// GUEST REVIEWS MANAGEMENT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const reviewForm = document.getElementById("reviewForm");
    const reviewList = document.getElementById("guestReviewList");
    const reviewerName = document.getElementById("reviewerName");
    const reviewRating = document.getElementById("reviewRating");
    const reviewMessage = document.getElementById("reviewMessage");

    if (!reviewForm || !reviewList || !reviewerName || !reviewRating || !reviewMessage) return;

    let guestReviews = [];
    try {
        const savedReviews = JSON.parse(localStorage.getItem("guestReviews"));
        guestReviews = Array.isArray(savedReviews) ? savedReviews : [];
    } catch {
        localStorage.removeItem("guestReviews");
    }

    const initialReviews = [
        { name: "Sofia L.", rating: 5, message: "The food is amazing and the view is unforgettable. The mango shake is a must-try!", id: 1 },
        { name: "Marco J.", rating: 5, message: "Friendly staff, beautiful atmosphere, and the shrimp dish was cooked perfectly.", id: 2 },
        { name: "Emma R.", rating: 4, message: "A perfect spot for brunch by the water. Loved the desserts and the coffee selection.", id: 3 }
    ];

    const renderReviews = () => {
        reviewList.innerHTML = "";
        const allReviews = [...initialReviews, ...guestReviews];
        allReviews.forEach((review, index) => {
            addReviewCard(review, index >= 3);
        });
    };

    const addReviewCard = ({ name, rating, message, id }, isDeletable) => {
        const card = document.createElement("article");
        card.className = "reviewCard";
        card.dataset.id = id;

        const accent = document.createElement("div");
        accent.className = "reviewAccent";

        const stars = document.createElement("div");
        stars.className = "reviewStars";
        stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

        const reviewText = document.createElement("p");
        reviewText.textContent = `“${message}”`;

        const reviewer = document.createElement("span");
        reviewer.textContent = `— ${name}`;

        card.append(accent, stars, reviewText, reviewer);

        if (isDeletable) {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "deleteBtn";
            deleteBtn.innerHTML = "&times;";
            deleteBtn.onclick = () => deleteReview(id);
            card.appendChild(deleteBtn);
        }

        reviewList.appendChild(card);
    };

    window.deleteReview = (id) => {
        guestReviews = guestReviews.filter(review => review.id !== id);
        localStorage.setItem("guestReviews", JSON.stringify(guestReviews));
        renderReviews();
    };

    reviewForm.addEventListener("submit", event => {
        event.preventDefault();

        const review = {
            name: reviewerName.value.trim(),
            rating: Number(reviewRating.value),
            message: reviewMessage.value.trim(),
            id: Date.now()
        };

        if (!review.name || !review.message || review.rating < 1 || review.rating > 5) return;

        guestReviews.push(review);
        localStorage.setItem("guestReviews", JSON.stringify(guestReviews));
        renderReviews();

        reviewForm.reset();
    });

    renderReviews();
});

// ==========================================
// PAYMENT METHOD DISPLAY TOGGLE
// ==========================================

function handlePaymentChange() {
    const paymentMethodElem = document.getElementById('paymentMethod');
    if (!paymentMethodElem) return;

    const selectedMethod = paymentMethodElem.value;
    const qrBox = document.getElementById('qrBox');
    const codBox = document.getElementById('codBox');
    const qrTitle = document.getElementById('qrTitle');
    const paymentImage = document.getElementById('paymentImage');

    if (!qrBox || !codBox) return;

    qrBox.style.display = 'none';
    codBox.style.display = 'none';

    if (selectedMethod === 'cod') {
        codBox.style.display = 'block';
    } else if (selectedMethod && qrTitle && paymentImage) {
        let titleText = '';
        let imageSrc = '';

        switch (selectedMethod) {
            case 'gcash':
                titleText = 'GCash QR Payment';
                imageSrc = 'images/GCash.png';
                break;
        }

        qrTitle.innerText = titleText;
        paymentImage.src = imageSrc;
        paymentImage.alt = titleText;
        qrBox.style.display = 'block';
    }
}
