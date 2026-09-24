// Database of Scrunchies with specific colors & images
const products = [
    {
        id: 1,
        name: "Mulberry Silk Scrunchie",
        category: "Silk",
        price: 49,
        description: "Made with 100% pure 22 Momme Mulberry Silk. Protects your hair from breakage, retains moisture, and leaves no crease behind.",
        colors: [
            { name: "Blush Pink", hex: "#af5865", image: "images/blush-pink-mulberrry-silk.jpg" },
            { name: "Soft Lavender", hex: "#c8b6ff", image: "images/lavender-mulberry-silk.png" },
            { name: "Pure White", hex: "#ffffff", image: "images/pure-white-mulberry-silk.png" }
        ],
        image: "images/blush-pink-mulberrry-silk.jpg",
        tag: "Best Seller"
    },
    {
        id: 2,
        name: "Dreams Velvet Scrunchie",
        category: "Velvet",
        price: 49,
        description: "Super soft premium velvet texture. Gives a lush volume to your ponytail with extra-strong elastic stretch.",
        colors: [
            { name: "Soft Lavender", hex: "#b6a3ee", image: "images/lavender-dreams-velvet.jpg" },
            { name: "Magenta Pink", hex: "#a51665", image: "images/magenta-pink-dreams-velvet.png" }
        ],
        image: "images/lavender-dreams-velvet.jpg",
        tag: "Popular"
    },
    {
        id: 3,
        name: "Bow Scrunchie",
        category: "Oversized & Bows",
        price: 69,
        description: "Aesthetic bow scrunchie designed for Instagram-worthy hair ties. Perfect for buns and half-up styles.",
        colors: [
            { name: "Blush Pink", hex: "#d88291", image: "images/cotton-pink-bow.png" },
            { name: "Pure White", hex: "#fbf9fd", image: "images/cotton-white-bow.png" }
        ],
        image: "images/cotton-bow.jpg",
        tag: "New Trend"
    },
    {
        id: 4,
        name: "Satin Dark Shaded Scrunchie",
        category: "Satin",
        price: 29,
        description: "Smooth satin texture that glides through hair without tugging. Ideal for all hair types.",
        colors: [
            { name: "Black", hex: "#020202", image: "images/black-satin.jpg" },
            { name: "Brown", hex: "#4b1414", image: "images/brown-satin.png" }
        ],
        image: "images/black-satin.jpg",
        tag: "Regular"
    }
];

let cart = [];
let activeCategory = 'All';
let currentlySelectedProduct = null;
let currentlySelectedColor = null;
window.pendingAction = null;

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    renderProducts(products);
    updateCartUI();
    checkUserProfile();
});

// --- USER ENROLLMENT & PROFILE LOGIC ---
function checkUserProfile() {
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    const profileNav = document.getElementById("profileNavBtn");

    if (user && user.email) {
        if (profileNav) {
            profileNav.innerHTML = `<i class="fa-solid fa-circle-user me-1"></i> ${user.name}`;
            profileNav.onclick = () => openProfileDrawer();
        }
    } else {
        if (profileNav) {
            profileNav.innerHTML = `<i class="fa-solid fa-user me-1"></i> Account`;
            profileNav.onclick = () => requireEnrollment();
        }
    }
}

function requireEnrollment(callbackAction) {
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    
    if (!user || !user.email) {
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
        window.pendingAction = callbackAction;
    } else {
        if (typeof callbackAction === 'function') {
            callbackAction();
        }
    }
}

function handleEnrollment(event) {
    event.preventDefault();
    const name = document.getElementById("userName").value.trim();
    const email = document.getElementById("userEmail").value.trim();

    if (name && email) {
        const userData = { name: name, email: email, enrolledAt: new Date().toISOString() };
        localStorage.setItem("scrunchie_user", JSON.stringify(userData));

        const authModalEl = document.getElementById('authModal');
        const modalInstance = bootstrap.Modal.getInstance(authModalEl);
        if (modalInstance) modalInstance.hide();

        showToast(`✨ Welcome ${name}! Profile created successfully.`);
        checkUserProfile();

        if (window.pendingAction && typeof window.pendingAction === 'function') {
            window.pendingAction();
            window.pendingAction = null;
        }
    }
}

/* ============================================================
   UPDATED PROFILE, ORDERS & DYNAMIC REVIEW LOGIC
   ============================================================ */

// 1. Open Profile Drawer & Clean UI
function openProfileDrawer() {
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    if (!user) {
        requireEnrollment();
        return;
    }

    document.getElementById('profileUserName').innerText = user.name || user.email.split('@')[0];
    document.getElementById('profileUserEmail').innerText = user.email;
    document.getElementById('profileUserAvatar').innerText = (user.name || user.email)[0].toUpperCase();

    // Hide orders container initially
    const container = document.getElementById('myOrdersContainer');
    if (container) container.classList.add('d-none');

    const profileDrawer = new bootstrap.Offcanvas(document.getElementById('profileDrawer'));
    profileDrawer.show();
}

// 2. Toggle My Orders List on Click
function toggleMyOrdersList() {
    const container = document.getElementById('myOrdersContainer');
    if (!container) return;

    if (!container.classList.contains('d-none')) {
        container.classList.add('d-none');
        return;
    }

    container.classList.remove('d-none');
    renderMyOrdersList();
}

// 3. Render My Orders List with Image, Items & Review Button
function renderMyOrdersList() {
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    const container = document.getElementById('myOrdersContainer');
    if (!user || !container) return;

    const userOrders = JSON.parse(localStorage.getItem(`orders_${user.email}`)) || [];

    if (userOrders.length === 0) {
        container.innerHTML = `<p class="text-muted small text-center my-3">No orders placed yet!</p>`;
        return;
    }

    const reviewsStore = JSON.parse(localStorage.getItem('order_reviews_store')) || {};

    container.innerHTML = userOrders.map(order => {
        const isReviewed = reviewsStore[order.orderId] ? true : false;

        const itemsHtml = order.items ? order.items.map(item => `
            <div class="d-flex align-items-center gap-2 mb-2">
                <img src="${item.image || 'https://placehold.co/50x50'}" alt="${item.name}" class="rounded-2" style="width: 42px; height: 42px; object-fit: cover;">
                <div class="flex-grow-1">
                    <div class="fw-semibold text-dark fs-13">${item.name}</div>
                    <small class="text-muted fs-11">${item.selectedColor || 'Default'} x ${item.quantity}</small>
                </div>
                <div class="fw-bold text-dark fs-13">₹${item.price * item.quantity}</div>
            </div>
        `).join('') : '';

        return `
            <div class="card border-0 shadow-sm rounded-3 mb-3 bg-light">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold text-dark fs-13">#${order.orderId}</span>
                        <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill fs-11">${order.status || 'Delivered'}</span>
                    </div>
                    <small class="text-muted d-block mb-2 fs-11">${order.date || 'Recent Order'}</small>
                    
                    <div class="border-top border-bottom py-2 my-2">
                        ${itemsHtml}
                    </div>

                    <div class="d-flex justify-content-between align-items-center pt-1">
                        <span class="fw-bold text-dark fs-13">Total: ₹${order.total}</span>
                        ${isReviewed 
                            ? `<button class="btn btn-sm btn-light text-success border-0 rounded-pill fs-11 disabled">✅ Reviewed</button>`
                            : `<button class="btn btn-sm btn-outline-danger rounded-pill fs-11 px-3" onclick="openOrderReviewModal('${order.orderId}')">⭐ Give Review</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 4. Open Review Modal for specific Order
function openOrderReviewModal(orderId) {
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    const userOrders = JSON.parse(localStorage.getItem(`orders_${user.email}`)) || [];
    const order = userOrders.find(o => o.orderId === orderId);

    if (!order) return;

    document.getElementById('reviewTargetOrderId').value = orderId;
    document.getElementById('reviewModalFeedback').value = '';

    const productsContainer = document.getElementById('reviewModalProductsList');
    productsContainer.innerHTML = order.items.map((item, idx) => `
        <div class="border-bottom pb-2 mb-2 product-review-row" data-product-id="${item.id}" data-product-name="${item.name}">
            <div class="d-flex align-items-center gap-2 mb-1">
                <img src="${item.image || 'https://placehold.co/40x40'}" class="rounded-2" style="width: 36px; height: 36px; object-fit: cover;">
                <span class="fw-semibold fs-13 text-dark">${item.name}</span>
            </div>
            <div class="d-flex align-items-center gap-1 star-rating-picker" data-rating="5">
                <small class="text-muted me-2 fs-12">Rating:</small>
                ${[1,2,3,4,5].map(star => `<i class="fa-solid fa-star text-warning fs-14 cursor-pointer star-btn" onclick="setRowStarRating(this, ${star})"></i>`).join('')}
            </div>
        </div>
    `).join('');

    const modal = new bootstrap.Modal(document.getElementById('orderReviewModal'));
    modal.show();
}

// Star Picker Helper
function setRowStarRating(starEl, rating) {
    const parent = starEl.closest('.star-rating-picker');
    parent.setAttribute('data-rating', rating);
    const stars = parent.querySelectorAll('.star-btn');
    stars.forEach((s, i) => {
        if (i < rating) {
            s.classList.remove('fa-regular', 'text-muted');
            s.classList.add('fa-solid', 'text-warning');
        } else {
            s.classList.remove('fa-solid', 'text-warning');
            s.classList.add('fa-regular', 'text-muted');
        }
    });
}

// 5. Submit Order Review and Update Product Ratings
function submitOrderReview() {
    const orderId = document.getElementById('reviewTargetOrderId').value;
    const feedback = document.getElementById('reviewModalFeedback').value;
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));

    let reviewsStore = JSON.parse(localStorage.getItem('order_reviews_store')) || {};
    let productRatingsMap = JSON.parse(localStorage.getItem('product_ratings_map')) || {};

    const rows = document.querySelectorAll('.product-review-row');
    const itemRatings = [];

    rows.forEach(row => {
        const pId = row.getAttribute('data-product-id');
        const pName = row.getAttribute('data-product-name');
        const rating = parseInt(row.querySelector('.star-rating-picker').getAttribute('data-rating')) || 5;

        itemRatings.push({ productId: pId, productName: pName, rating: rating });

        // Calculate and update global rating per product
        if (!productRatingsMap[pId]) {
            productRatingsMap[pId] = { totalStars: 0, reviewCount: 0 };
        }
        productRatingsMap[pId].totalStars += rating;
        productRatingsMap[pId].reviewCount += 1;
    });

    reviewsStore[orderId] = {
        userEmail: user.email,
        feedback: feedback,
        ratings: itemRatings,
        date: new Date().toLocaleDateString('en-IN')
    };

    localStorage.setItem('order_reviews_store', JSON.stringify(reviewsStore));
    localStorage.setItem('product_ratings_map', JSON.stringify(productRatingsMap));

    // Close Modal
    const modalEl = document.getElementById('orderReviewModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    if (typeof showToast === 'function') {
        showToast('🎉 Thank you! Your review & rating have been saved.');
    }

    renderMyOrdersList();
}

// Logout Function
function logoutUser() {
    localStorage.removeItem("scrunchie_user");
    showToast("Logged out successfully!");
    setTimeout(() => location.reload(), 1000);
}

// Render Product Cards
function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-magnifying-glass fs-1 text-muted mb-3"></i>
                <h5 class="text-muted">No scrunchies found!</h5>
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(product => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="product-card h-100 d-flex flex-column justify-content-between" style="cursor: pointer;" onclick="openProductModal(${product.id})">
                <div>
                    <div class="product-img-wrapper">
                        <span class="tag-badge">${product.tag}</span>
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/300x300/ffe5ec/ff4d6d?text=${encodeURIComponent(product.name)}'">
                    </div>
                    <div class="p-3">
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <span class="small text-muted fw-medium">${product.category}</span>
                        </div>
                        <h6 class="fw-bold text-dark mb-2 product-title">${product.name}</h6>
                        <div class="d-flex align-items-center gap-1 mb-2">
                            ${product.colors.map(c => `<span class="color-dot" style="background-color: ${c.hex};" title="${c.name}"></span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="p-3 pt-0 d-flex align-items-center justify-content-between border-top border-light mt-auto">
                    <span class="fs-5 fw-bold" style="color: var(--deep-pink);">₹${product.price}</span>
                    <button class="btn btn-outline-pink btn-sm" onclick="event.stopPropagation(); requireEnrollment(() => addToCart(${product.id}))">
                        <i class="fa-solid fa-plus me-1"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Trigger product specific review section logic after rendering grid
    if (typeof displayReviewsOnProducts === 'function') {
        displayReviewsOnProducts();
    }
}

// Filter Products by Category
function filterCategory(category, btnElement) {
    activeCategory = category;
    
    document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (category === 'All') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

// Live Search Functionality
function searchProducts() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
    );
    renderProducts(filtered);
}

// Open Product Modal & Set Default Color
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentlySelectedProduct = product;
    currentlySelectedColor = product.colors[0];

    document.getElementById('modal-product-img').src = currentlySelectedColor.image || product.image;
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-tag').textContent = product.tag;
    document.getElementById('modal-product-price').textContent = `₹${product.price}`;
    document.getElementById('modal-product-desc').textContent = product.description;

    const colorNameSpan = document.getElementById('modal-selected-color-name');
    if (colorNameSpan) colorNameSpan.textContent = currentlySelectedColor.name;

    const colorContainer = document.getElementById('modal-color-options');
    colorContainer.innerHTML = product.colors.map((colorObj, index) => `
        <div class="modal-color-dot ${index === 0 ? 'active' : ''}" 
             style="background-color: ${colorObj.hex};" 
             title="${colorObj.name}"
             onclick="selectModalColor('${colorObj.name}', this)">
        </div>
    `).join('');

    const modalBtn = document.getElementById('modal-add-to-cart-btn');
    modalBtn.onclick = () => {
        requireEnrollment(() => {
            addToCart(currentlySelectedProduct.id, currentlySelectedColor);
            const modalEl = bootstrap.Modal.getInstance(document.getElementById('productDetailModal'));
            if (modalEl) modalEl.hide();
        });
    };

    const modal = new bootstrap.Modal(document.getElementById('productDetailModal'));
    modal.show();
}

// Select Color inside Modal
function selectModalColor(colorName, element) {
    if (!currentlySelectedProduct) return;

    const chosenColorObj = currentlySelectedProduct.colors.find(c => c.name === colorName);
    if (!chosenColorObj) return;

    currentlySelectedColor = chosenColorObj;

    const colorNameSpan = document.getElementById('modal-selected-color-name');
    if (colorNameSpan) colorNameSpan.textContent = currentlySelectedColor.name;

    document.querySelectorAll('.modal-color-dot').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (currentlySelectedColor.image) {
        document.getElementById('modal-product-img').src = currentlySelectedColor.image;
    }
}

// Add Item to Cart
function addToCart(productId, colorObject = null) {
    const item = products.find(p => p.id === productId);
    const selectedColor = colorObject || item.colors[0];
    
    const cartItemId = `${productId}-${selectedColor.name}`;
    const existing = cart.find(c => c.cartItemId === cartItemId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            cartItemId: cartItemId,
            id: item.id,
            name: item.name,
            price: item.price,
            selectedColor: selectedColor.name,
            image: selectedColor.image || item.image,
            quantity: 1
        });
    }

    updateCartUI();
    showToast(`✨ ${item.name} (${selectedColor.name}) added to bag!`);
}

// Update Cart Quantities
function updateQuantity(cartItemId, delta) {
    const item = cart.find(c => c.cartItemId === cartItemId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(c => c.cartItemId !== cartItemId);
        }
    }
    updateCartUI();
}

// Render Cart items in Offcanvas Drawer
function updateCartUI() {
    const container = document.getElementById('cart-items-body');
    const cartBadge = document.getElementById('cart-badge');
    const cartTotal = document.getElementById('cart-total-price');

    if (!container || !cartBadge || !cartTotal) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartBadge.textContent = totalItems;
    cartTotal.textContent = `₹${totalPrice}`;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center my-auto py-5 text-muted">
                <i class="fa-solid fa-bag-shopping display-1 text-danger mb-3 opacity-25"></i>
                <h6>Your bag is completely empty!</h6>
                <small>Add some cute scrunchies to get started ✨</small>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
            <img src="${item.image}" class="cart-item-img" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" alt="${item.name}">
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold small">${item.name}</h6>
                <small class="text-muted d-block">Color: ${item.selectedColor}</small>
                <small class="text-muted">₹${item.price} x ${item.quantity}</small>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="qty-btn" onclick="updateQuantity('${item.cartItemId}', -1)">-</button>
                <span class="fw-bold small">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.cartItemId}', 1)">+</button>
            </div>
        </div>
    `).join('');
}

// Open Checkout Modal & Sync Cart Data
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast("⚠️ Your bag is empty! Add products first.");
        return;
    }

    requireEnrollment(() => {
        // Hide Cart Offcanvas
        const cartOffcanvasEl = document.getElementById('cartOffcanvas');
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(cartOffcanvasEl);
        if (cartOffcanvas) cartOffcanvas.hide();

        // Render Checkout Items
        const checkoutContainer = document.getElementById('checkoutItemsList');
        checkoutContainer.innerHTML = cart.map(item => `
            <div class="d-flex align-items-center justify-content-between text-muted small">
                <div>
                    <span class="fw-semibold text-dark">${item.name}</span>
                    <span class="d-block text-xs">Color: ${item.selectedColor} (x${item.quantity})</span>
                </div>
                <span class="fw-bold text-dark">₹${item.price * item.quantity}</span>
            </div>
        `).join('');

        calculateCheckoutTotals();

        // Open Checkout Modal
        const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        checkoutModal.show();
    });
}

// Calculate Checkout Totals (Handle COD extra charges)
function calculateCheckoutTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const isCOD = selectedPayment === 'COD';
    
    const codFeeRow = document.getElementById('codFeeRow');
    if (codFeeRow) {
        if (isCOD) {
            codFeeRow.classList.remove('d-none');
        } else {
            codFeeRow.classList.add('d-none');
        }
    }

    const grandTotal = isCOD ? subtotal + 20 : subtotal;

    document.getElementById('checkoutSubtotal').textContent = `₹${subtotal}`;
    document.getElementById('checkoutGrandTotal').textContent = `₹${grandTotal}`;
}

// Toggle Payment Box Details
function togglePaymentDetails(type) {
    const upiBox = document.getElementById('upiDetailBox');
    
    document.querySelectorAll('.payment-card').forEach(card => card.classList.remove('active-payment'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-payment');
    }

    if (type === 'upi') {
        if (upiBox) upiBox.classList.remove('d-none');
    } else {
        if (upiBox) upiBox.classList.add('d-none');
    }

    calculateCheckoutTotals();
}

// Handle Order Submit Event & Save Order History
function handleOrderSubmit(e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    if (!user) return requireEnrollment();

    // Create New Order Record
    const grandTotalText = document.getElementById('checkoutGrandTotal').textContent;
    const newOrder = {
        orderId: 'ORD' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: [...cart],
        total: grandTotalText.replace('₹', ''),
        status: 'Delivered' // Delivered status enables post-delivery rating option!
    };

    // Save order history under logged-in user email
    const userOrders = JSON.parse(localStorage.getItem(`orders_${user.email}`)) || [];
    userOrders.unshift(newOrder);
    localStorage.setItem(`orders_${user.email}`, JSON.stringify(userOrders));

    // Close Checkout Modal
    const checkoutModalEl = document.getElementById('checkoutModal');
    const checkoutModal = bootstrap.Modal.getInstance(checkoutModalEl);
    if (checkoutModal) checkoutModal.hide();

    // Reset Cart
    cart = [];
    updateCartUI();

    // Open Success Modal
    const successModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
    successModal.show();
}

// Toast Notifications
function showToast(message) {
    const toastMessage = document.getElementById('toast-message');
    const toastEl = document.getElementById('actionToast');
    if (toastMessage && toastEl) {
        toastMessage.textContent = message;
        const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
        toast.show();
    }
}
/* ============================================================
   FUNCTION: Review System & Post-Delivery Rating Logic
   ============================================================ */

let currentRating = 5;

// Check delivered status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkDeliveredOrdersForReview();
});

// Auto Check Delivered Items for Prompt Banner
function checkDeliveredOrdersForReview() {
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    if (!user) return;

    const userOrders = JSON.parse(localStorage.getItem(`orders_${user.email}`)) || [];
    const dismissed = sessionStorage.getItem('review_banner_dismissed');

    const pendingReviewOrder = userOrders.find(order => order.status === 'Delivered' && !order.hasReviewed);

    if (pendingReviewOrder && !dismissed) {
        const banner = document.getElementById('reviewPromptBanner');
        const bannerText = document.getElementById('bannerOrderText');
        if (banner && bannerText) {
            bannerText.innerText = `You received items from Order #${pendingReviewOrder.orderId}. Mind giving us a quick star rating?`;
            banner.classList.remove('d-none');
        }
    }
}

function closeReviewBanner() {
    sessionStorage.setItem('review_banner_dismissed', 'true');
    const banner = document.getElementById('reviewPromptBanner');
    if (banner) banner.classList.add('d-none');
}

function openDynamicReviewFromBanner() {
    closeReviewBanner();
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    if (!user) return requireEnrollment();

    const userOrders = JSON.parse(localStorage.getItem(`orders_${user.email}`)) || [];
    const pendingReviewOrder = userOrders.find(order => order.status === 'Delivered' && !order.hasReviewed);

    if (pendingReviewOrder) {
        triggerReviewModal(pendingReviewOrder.orderId);
    }
}

// Star Rating Visual Handler
function setRating(rating) {
    currentRating = rating;
    const selectedRatingInput = document.getElementById('selectedRating');
    if (selectedRatingInput) selectedRatingInput.value = rating;

    const stars = document.querySelectorAll('.star-icon');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('fa-regular');
            star.classList.add('fa-solid');
        } else {
            star.classList.remove('fa-solid');
            star.classList.add('fa-regular');
        }
    });
}

function triggerReviewModal(orderId) {
    const reviewOrderIdInput = document.getElementById('reviewOrderId');
    if (reviewOrderIdInput) reviewOrderIdInput.value = orderId;

    setRating(5);
    const reviewModalEl = document.getElementById('reviewModal');
    if (reviewModalEl) {
        const reviewModal = new bootstrap.Modal(reviewModalEl);
        reviewModal.show();
    }
}

// Submit Review -> Save Status & Direct Email Support
function submitReview(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    if (!user) return;

    const orderId = document.getElementById('reviewOrderId').value;
    const rating = document.getElementById('selectedRating').value;
    const feedback = document.getElementById('reviewText').value;

    let userOrders = JSON.parse(localStorage.getItem(`orders_${user.email}`)) || [];
    userOrders = userOrders.map(order => {
        if (order.orderId === orderId) {
            order.hasReviewed = true;
        }
        return order;
    });
    localStorage.setItem(`orders_${user.email}`, JSON.stringify(userOrders));

    const modalElement = document.getElementById('reviewModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    const subject = encodeURIComponent(`New Review for Order #${orderId}`);
    const body = encodeURIComponent(`Hi Scrunchie Magic Team,\n\nA customer submitted a review!\n\nUser: ${user.email}\nOrder ID: #${orderId}\nRating: ${rating} / 5 Stars\nFeedback: ${feedback}`);

    showToast(`🎉 Thank you for your ${rating}-Star Rating!`);
    window.location.href = `mailto:scrunchiemagic.help@gmail.com?subject=${subject}&body=${body}`;
}

// --- HAIRSTYLE TUTORIAL MODAL LOGIC ---
function openTutorialModal(type) {
    const titleEl = document.getElementById('tutorialTitle');
    const stepsEl = document.getElementById('tutorialSteps');
    const shopBtn = document.getElementById('tutorialShopBtn');

    if (type === 'bun') {
        titleEl.textContent = "🎀 Messy High Bun Tutorial";
        stepsEl.innerHTML = `
            <ol class="lh-lg ps-3 small">
                <li>Gather your hair into a high ponytail on top of your head.</li>
                <li>Twist the hair loosely around the base to create a bun.</li>
                <li>Wrap your <b>Mulberry Silk Scrunchie</b> twice to hold it gently without denting.</li>
                <li>Pull out a few baby hair strands in front for that effortless messy look!</li>
            </ol>
        `;
        shopBtn.onclick = () => {
            const modalEl = bootstrap.Modal.getInstance(document.getElementById('tutorialModal'));
            if (modalEl) modalEl.hide();
            openProductModal(1); // Mulberry Silk Product ID
        };
    } else if (type === 'bow') {
        titleEl.textContent = "🎀 Half-Up Ribbon Style Tutorial";
        stepsEl.innerHTML = `
            <ol class="lh-lg ps-3 small">
                <li>Take top 1/3 section of your hair from ear-to-ear.</li>
                <li>Secure it into a half ponytail using a <b>Bow Scrunchie</b>.</li>
                <li>Let the bow ribbons fall naturally over your remaining hair.</li>
                <li>Curling the lower hair ends gives an extra aesthetic touch!</li>
            </ol>
        `;
        shopBtn.onclick = () => {
            const modalEl = bootstrap.Modal.getInstance(document.getElementById('tutorialModal'));
            if (modalEl) modalEl.hide();
            openProductModal(3); // Bow Scrunchie Product ID
        };
    } else if (type === 'ponytail') {
        titleEl.textContent = "🎀 Sleek Low Ponytail Tutorial";
        stepsEl.innerHTML = `
            <ol class="lh-lg ps-3 small">
                <li>Comb your hair back neatly with a middle or side part.</li>
                <li>Gather all hair at the nape of your neck.</li>
                <li>Secure tightly with a <b>Satin Scrunchie</b> for zero frizz.</li>
                <li>Use light hair serum on top for a glossy finish!</li>
            </ol>
        `;
        shopBtn.onclick = () => {
            const modalEl = bootstrap.Modal.getInstance(document.getElementById('tutorialModal'));
            if (modalEl) modalEl.hide();
            openProductModal(4); // Satin Scrunchie Product ID
        };
    }

    const tutorialModal = new bootstrap.Modal(document.getElementById('tutorialModal'));
    tutorialModal.show();
}

// Newsletter Subscription Logic with Discount Code
function subscribeMagicClub() {
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();

    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address!');
        return;
    }

    // Save Email locally
    let subscribers = JSON.parse(localStorage.getItem('magic_club_emails')) || [];
    subscribers.push(email);
    localStorage.setItem('magic_club_emails', JSON.stringify(subscribers));

    alert('🎉 Welcome to the Magic Club!\n\nUse Coupon Code: MAGIC10 to get 10% OFF on your order!');
    emailInput.value = '';
}

// Simple Interactive Policy Modal/Alert
function openPolicyModal(title, content) {
    alert(`📌 ${title}\n\n${content}`);
}
/* ============================================================
   FUNCTION: Product Specific Reviews & Collection Sync Logic
   ============================================================ */

let selectedProductNameForReview = "";

function triggerSpecificProductReview(orderId, productName) {
    selectedProductNameForReview = productName;
    const reviewOrderIdInput = document.getElementById('reviewOrderId');
    if (reviewOrderIdInput) reviewOrderIdInput.value = orderId;

    setRating(5);
    const reviewModalEl = document.getElementById('reviewModal');
    if (reviewModalEl) {
        const reviewModal = new bootstrap.Modal(reviewModalEl);
        reviewModal.show();
    }
}

// Updated Submit Function to save reviews per Product Name
function submitReview(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("scrunchie_user"));
    if (!user) return;

    const orderId = document.getElementById('reviewOrderId').value;
    const rating = document.getElementById('selectedRating').value;
    const feedback = document.getElementById('reviewText').value;

    const newReview = {
        userEmail: user.email,
        userName: user.name || user.email.split('@')[0],
        orderId: orderId,
        productName: selectedProductNameForReview || "General Order",
        rating: rating,
        feedback: feedback,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    // Save to Global Store Product Reviews
    let globalReviews = JSON.parse(localStorage.getItem('all_product_reviews')) || [];
    globalReviews.push(newReview);
    localStorage.setItem('all_product_reviews', JSON.stringify(globalReviews));

    // Hide Modal
    const modalElement = document.getElementById('reviewModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    showToast(`🎉 Review added for ${selectedProductNameForReview || 'product'}!`);
    displayReviewsOnProducts();
}

// FUNCTION: Display submitted reviews dynamically on product collection cards
function displayReviewsOnProducts() {
    const globalReviews = JSON.parse(localStorage.getItem('all_product_reviews')) || [];

    document.querySelectorAll('.product-card').forEach(card => {
        const titleEl = card.querySelector('.product-title') || card.querySelector('h5');
        if (!titleEl) return;

        const pName = titleEl.innerText.trim();
        const matchingReviews = globalReviews.filter(r => r.productName === pName);

        let reviewBox = card.querySelector('.product-reviews-container');
        if (!reviewBox) {
            reviewBox = document.createElement('div');
            reviewBox.className = 'product-reviews-container mt-2 pt-2 border-top fs-12 text-muted';
            card.appendChild(reviewBox);
        }

        if (matchingReviews.length > 0) {
            const latest = matchingReviews[matchingReviews.length - 1];
            reviewBox.innerHTML = `
                <div class="fw-semibold text-dark mb-1">💬 Recent Review (${matchingReviews.length}):</div>
                <div class="bg-light p-2 rounded">
                    <div>${'⭐'.repeat(latest.rating)} <strong class="text-dark">${latest.userName}</strong></div>
                    <div class="text-truncate">"${latest.feedback}"</div>
                </div>
            `;
        }
    });
}

// Run display reviews on load
document.addEventListener('DOMContentLoaded', () => {
    displayReviewsOnProducts();
});