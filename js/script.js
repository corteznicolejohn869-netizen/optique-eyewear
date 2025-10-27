// =======================================================
// GLOBAL CONSTANTS & UI TOGGLING
// =======================================================

let searchForm = document.querySelector('.header .search-form');
let navbar = document.querySelector('.header .navbar');

// Constants for Local/Session Storage Keys
const CART_STORAGE_KEY = 'cartItems';
const AUTH_STORAGE_KEY = 'registeredUsers'; 
const USER_STATUS_KEY = 'userStatus'; // UNIFIED Key for tracking login state & user data
const WISHLIST_STORAGE_KEY = 'wishlistItems'; 

// --- MOCK LOGIN SETTINGS ---
// Set this to TRUE to allow ANY email/password combination to log in successfully
const isMockLoginEnabled = true; 

// Mock user details (used for setting user's name/initial counts after mock login)
const MOCK_USER_DETAILS = {
    name: "Mock User", 
    wishlistCount: 0,
    cartCount: 0 
};

document.querySelector('#search-btn').onclick = () => {
    searchForm.classList.toggle('active');
    navbar.classList.remove('active');
    if (searchForm.classList.contains('active')) {
        document.getElementById('search-box').focus();
    }
}

document.querySelector('#menu-btn').onclick = () => {
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
}

window.onscroll = () => {
    searchForm.classList.remove('active');
    navbar.classList.remove('active');
}

// HOME SLIDES (Assuming this logic is correct for home.html)
let slides = document.querySelectorAll('.home .slide');
let index = 0;

function next(){
    if (!slides.length) return; 
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
}

function prev(){
    if (!slides.length) return; 
    slides[index].classList.remove('active');
    index = (index - 1 + slides.length) % slides.length;
    slides[index].classList.add('active');
}

if (document.getElementById('next-slide')) {
    document.getElementById('next-slide').onclick = next;
    document.getElementById('prev-slide').onclick = prev;
}

// =======================================================
// E-COMMERCE CART, WISHLIST & AUTH HELPERS (FIXED/UNIFIED)
// =======================================================

// --- Cart Helpers ---
const getCart = () => {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
};

const saveCart = (cart) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Updated to use the unified update function
    updateGlobalUI(); 
    
    // Auto-update Cart Page
    if (document.querySelector('.shopping-cart')) {
        renderCart();
    }
    // Auto-update Order Summary on Checkout Page
    if (document.querySelector('.checkout')) { 
        renderOrderSummary();
    }
};

const updateCartIconCount = () => {
    // This is now handled by updateGlobalUI, retaining for compatibility
    updateGlobalUI();
};

// --- Wishlist Helpers ---
const getWishlist = () => {
    const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
};

const saveWishlist = (wishlist) => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    // Updated to use the unified update function
    updateGlobalUI(); 
};

// --- Auth Helpers (FIXED AND UNIFIED) ---

const getRegisteredUsers = () => {
    try {
        const usersJson = localStorage.getItem(AUTH_STORAGE_KEY);
        // Only return saved users. The MOCK_LOGIN logic will handle the login itself.
        return usersJson ? JSON.parse(usersJson) : []; 
    } catch (e) {
        return [];
    }
};

/**
 * Retrieves the current user's login status and data from localStorage.
 */
const getUserStatus = () => {
    try {
        const statusJson = localStorage.getItem(USER_STATUS_KEY);
        // Ensure that default values are set if not found
        return statusJson ? JSON.parse(statusJson) : { isLoggedIn: false, name: 'Guest', email: '' };
    } catch (e) {
        return { isLoggedIn: false, name: 'Guest', email: '' };
    }
};

/**
 * Handles site-wide logout: clears status and redirects.
 */
const handleLogout = (e) => {
    e.preventDefault();
    localStorage.setItem(USER_STATUS_KEY, JSON.stringify({ isLoggedIn: false, name: 'Guest', email: '' }));
    alert('You have been logged out.');
    updateGlobalUI();
    window.location.href = 'home.html'; 
}

// =======================================================
// LOGIN & REGISTER FUNCTIONALITY
// =======================================================

const handleLogin = (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value;
    const password = passwordInput.value;

    let user;

    if (isMockLoginEnabled) {
        // HILING MO: Payagan ang anumang email/password
        if (email.trim() === '' || password.trim() === '') {
             alert('Please enter both email and password.');
             return;
        }
        // Lumikha ng temporary user object gamit ang email input
        const namePart = email.split('@')[0];
        user = {
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            email: email,
            password: password
        };

    } else {
        // Original logic: Verify against registered users
        const users = getRegisteredUsers();
        user = users.find(u => u.email === email && u.password === password);
    }
    
    // --- FINAL LOGIN CHECK ---
    if (user) {
        // Set the successful login status and data in the unified key
        localStorage.setItem(USER_STATUS_KEY, JSON.stringify({ 
            isLoggedIn: true,
            name: user.name,
            email: user.email,
            // Use actual current counts from the e-commerce helpers
            wishlistCount: getWishlist().length, 
            cartCount: getCart().reduce((acc, item) => acc + item.quantity, 0)
        }));
        
        alert(`Login successful! Welcome back, ${user.name}.`);
        updateGlobalUI();
        // ✅ UPDATED FILENAME HERE
        window.location.href = 'myaccount.html#dashboard'; 
    } else {
        alert('Login failed. Invalid email or password.');
        passwordInput.value = ''; 
    }
}

const handleRegister = (e) => {
    e.preventDefault();

    const form = document.getElementById('register-form'); 
    if (!form) return; 

    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;
    const confirmPassword = form.querySelector('input[name="cpass"]').value;
    
    if (password !== confirmPassword) {
        alert('Password and Confirm Password do not match!');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    let users = getRegisteredUsers();
    
    if (users.find(u => u.email === email)) {
        alert('Registration failed. This email is already registered.');
        return;
    }

    // Add new user with a generic name and 0 counts
    const namePart = email.split('@')[0];
    users.push({ 
        email, 
        password, 
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
    });
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));

    alert('Registration successful! You can now log in.');
    window.location.href = 'login.html';
}

// =======================================================
// E-COMMERCE CART LOGIC (Including Rendering)
// =======================================================

const searchProducts = () => {
    const searchInput = document.querySelector('.header .search-form #search-box');
    if (!searchInput || !document.querySelector('.products')) return; 

    const searchTerm = searchInput.value.toLowerCase();
    const productBoxes = document.querySelectorAll('.products .box-container .box');

    productBoxes.forEach(box => {
        const productName = box.getAttribute('data-name')?.toLowerCase() || '';
        
        if (productName.includes(searchTerm)) {
            box.style.display = 'block'; 
        } else {
            box.style.display = 'none';
        }
    });
};

const addToCart = (e) => {
    if (!e.target.classList.contains('add-to-cart-btn')) return;

    e.preventDefault(); 
    
    const productBox = e.target.closest('.box');
    const name = productBox.getAttribute('data-name');
    const price = parseFloat(productBox.getAttribute('data-price'));
    const img = productBox.getAttribute('data-img');

    if (!name || isNaN(price) || !img) {
        console.error("Missing product data attributes.");
        return; 
    }

    let cart = getCart();
    const existingItem = cart.find(item => item.name === name); 

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, img, quantity: 1 });
    }

    saveCart(cart);
    alert(`${name} added to cart!`);
};

// **CART RENDERING FUNCTIONS**

const updateCartTotal = () => {
    const cart = getCart();
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingFee = 0; 
    const grandTotal = subtotal + shippingFee;
    
    // Update total on the CART page
    const cartTotalElement = document.getElementById('cart-subtotal');
    if (cartTotalElement) {
        cartTotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }

    // Update totals on the CHECKOUT page (Order Summary)
    const checkoutSubtotalElement = document.getElementById('checkout-subtotal');
    if (checkoutSubtotalElement) {
        checkoutSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
    
    const checkoutTotalElement = document.getElementById('checkout-total');
    if (checkoutTotalElement) {
        checkoutTotalElement.textContent = `$${grandTotal.toFixed(2)}`;
    }
}

const renderCart = () => {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const cart = getCart();
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-message" style="text-align:center; font-size: 2rem;">Your cart is empty.</p>';
        updateCartTotal();
        return;
    }

    cart.forEach(item => {
        const box = document.createElement('div');
        box.classList.add('box');
        box.setAttribute('data-name', item.name);

        box.innerHTML = `
            <i class="fas fa-times remove-cart-item" data-name="${item.name}"></i>
            <img src="${item.img}" alt="${item.name}">
            <div class="content">
                <h3>${item.name}</h3>
                <span class="price">$${item.price.toFixed(2)}</span>
                <span class="quantity">qty: <input type="number" min="1" value="${item.quantity}" class="qty-input" data-name="${item.name}"></span>
            </div>
        `;
        container.appendChild(box);
    });

    updateCartTotal();
};

const handleCartInteractions = (e) => {
    const target = e.target;
    const productName = target.getAttribute('data-name');
    let cart = getCart();

    // 1. Handle Remove Item
    if (target.classList.contains('remove-cart-item')) {
        e.preventDefault();
        cart = cart.filter(item => item.name !== productName);
        saveCart(cart);
    }
    
    // 2. Handle Quantity Change
    if (target.classList.contains('qty-input')) {
        // Use 'change' event to handle this
        if (e.type !== 'change') return; 
        
        const newQuantity = parseInt(target.value);
        if (newQuantity < 1 || isNaN(newQuantity)) {
             // Revert the input value to the current cart quantity if invalid
             const item = cart.find(item => item.name === productName);
             target.value = item ? item.quantity : 1; 
             return;
        }

        const item = cart.find(item => item.name === productName);
        if (item) {
            item.quantity = newQuantity;
            saveCart(cart);
        }
    }
};

// =======================================================
// ORDER SUMMARY LOGIC (FIXED)
// =======================================================

/**
 * Renders the list of cart items in the order summary section on checkout.html.
 */
const renderOrderSummary = () => {
    const container = document.getElementById('checkout-order-items'); 
    if (!container) return;

    const cart = getCart();
    container.innerHTML = ''; 

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 1rem; color: var(--main-color);">Your cart is empty. Please return to the products page.</p>';
        updateCartTotal(); 
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;

        const summaryItem = document.createElement('div');
        summaryItem.classList.add('summary-item-line'); 
        
        summaryItem.innerHTML = `
            <span class="summary-name">${item.name} <span class="summary-qty">x ${item.quantity}</span></span>
            <span class="summary-price">$${itemTotal.toFixed(2)}</span>
        `;
        container.appendChild(summaryItem);
    });

    updateCartTotal(); 
};


// =======================================================
// WISHLIST LOGIC 
// =======================================================

const checkWishlistState = () => {
    const wishlist = getWishlist();
    const productButtons = document.querySelectorAll('.products .add-to-wishlist-btn');

    productButtons.forEach(btn => {
        const productBox = btn.closest('.box');
        const name = productBox.getAttribute('data-name');
        
        const isInWishlist = wishlist.some(item => item.name === name);

        if (isInWishlist) {
            btn.classList.remove('far'); 
            btn.classList.add('fas'); 
        } else {
            btn.classList.remove('fas'); 
            btn.classList.add('far');  
        }
        btn.style.color = ''; 
    });
};


const addToWishlist = (e) => {
    if (!e.target.classList.contains('add-to-wishlist-btn')) return;

    e.preventDefault(); 
    
    const btn = e.target;
    const productBox = btn.closest('.box');
    const name = productBox.getAttribute('data-name');
    const price = parseFloat(productBox.getAttribute('data-price'));
    const img = productBox.getAttribute('data-img');

    if (!name || isNaN(price) || !img) {
        console.error("Missing product data attributes for wishlist.");
        return; 
    }

    let wishlist = getWishlist();
    const itemData = { name, price, img };

    const existingItemIndex = wishlist.findIndex(item => item.name === name);

    if (existingItemIndex !== -1) {
        wishlist.splice(existingItemIndex, 1);
        alert(`${name} removed from wishlist.`);
        
        btn.classList.remove('fas');
        btn.classList.add('far');
    } else {
        wishlist.push(itemData);
        alert(`${name} added to wishlist!`);

        btn.classList.remove('far');
        btn.classList.add('fas');
    }

    saveWishlist(wishlist);
    btn.style.color = ''; 
};


const renderWishlist = () => {
    const container = document.getElementById('wishlist-container');
    const message = document.getElementById('wishlist-message');
    if (!container) return; 

    const wishlist = getWishlist();
    container.innerHTML = ''; 

    if (wishlist.length === 0) {
        container.innerHTML = '<p class="empty-message" style="text-align:center; padding: 2rem;">Your wishlist is empty. Start adding some favorites!</p>';
        return;
    }

    if (message) message.style.display = 'none';

    wishlist.forEach(item => {
        const box = document.createElement('div');
        box.classList.add('box');
        
        box.setAttribute('data-name', item.name); 
        box.setAttribute('data-price', item.price);
        box.setAttribute('data-img', item.img);

        box.innerHTML = `
            <i class="fas fa-times remove-wishlist-item" data-name="${item.name}"></i>
            <img src="${item.img}" alt="${item.name}">
            <div class="content">
                <h3>${item.name}</h3>
                <div class="price">$${parseFloat(item.price).toFixed(2)}</div>
                <a href="#" class="btn move-to-cart-btn" data-name="${item.name}">add to cart</a>
            </div>
        `;
        container.appendChild(box);
    });
};

const removeWishlistItem = (productName) => {
    let wishlist = getWishlist();
    wishlist = wishlist.filter(item => item.name !== productName);
    saveWishlist(wishlist);
    renderWishlist(); 
    alert(`${productName} removed from wishlist.`);
    
    if (document.querySelector('.products')) {
        checkWishlistState();
    }
};

const moveToCart = (productName) => {
    let wishlist = getWishlist();
    const itemToMove = wishlist.find(item => item.name === productName);

    if (itemToMove) {
        let cart = getCart();
        const existingCartItem = cart.find(item => item.name === productName);

        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            cart.push({ name: itemToMove.name, price: itemToMove.price, img: itemToMove.img, quantity: 1 });
        }
        saveCart(cart);

        removeWishlistItem(productName); 
        
        alert(`${productName} moved to cart!`);
    }
};


// =======================================================
// GLOBAL UI UPDATE LOGIC (FOR ACCOUNT AND HEADER) - UPDATED FOR myaccount.html
// =======================================================

/**
 * Handles the site-wide UI changes based on login status.
 * Updates header icons, counts, and redirects if necessary.
 */
const updateGlobalUI = () => {
    const userStatus = getUserStatus();
    const userIconLink = document.getElementById('user-icon-link');
    const wishlistCountSpan = document.getElementById('wishlist-count');
    const cartCountSpan = document.getElementById('cart-count');
    
    // Calculate current dynamic counts
    const cartCount = getCart().reduce((acc, item) => acc + item.quantity, 0);
    const wishlistCount = getWishlist().length;
    
    const accountFilename = 'myaccount.html'; // ✅ UPDATED FILENAME HERE

    // --- 1. Update Header Icons and Counts (Red Notif) ---
    if (userIconLink) userIconLink.href = userStatus.isLoggedIn ? accountFilename : 'login.html';

    // Wishlist Count (Uses current content)
    if (wishlistCountSpan) {
        wishlistCountSpan.textContent = wishlistCount > 99 ? '99+' : wishlistCount;
        wishlistCountSpan.style.display = wishlistCount > 0 ? 'inline-block' : 'none';
    }

    // Cart Count (Uses current content)
    if (cartCountSpan) {
        cartCountSpan.textContent = cartCount > 99 ? '99+' : cartCount;
        cartCountSpan.style.display = cartCount > 0 ? 'inline-block' : 'none';
    }
    
    // --- 2. Redirect Restricted Pages ---
    const path = window.location.pathname;
    if (!userStatus.isLoggedIn) {
        // ✅ UPDATED FILENAME HERE
        if ((path.endsWith(accountFilename) || path.endsWith('wishlist.html')) && 
            !path.endsWith('login.html') && !path.endsWith('register.html')) {
             window.location.href = 'login.html';
        }
    }

    // --- 3. Update Account Dashboard (if on myaccount.html) ---
    if (path.endsWith(accountFilename)) {
        const profileUsername = document.getElementById('profile-username');
        const profileEmail = document.getElementById('profile-email');
        const logoutBtn = document.getElementById('logout-btn');

        if (userStatus.isLoggedIn) {
            // A. PROFILE INFO (Name and Email)
            if (profileUsername) profileUsername.textContent = `Welcome, ${userStatus.name}!`;
            if (profileEmail) profileEmail.textContent = userStatus.email;
            
            // B. DASHBOARD STATUS CARDS (Using static/mock data for non-dynamic counters)
            if (document.getElementById('total-orders')) document.getElementById('total-orders').textContent = '12'; 
            if (document.getElementById('orders-processing')) document.getElementById('orders-processing').textContent = '2'; 
            if (document.getElementById('products-reviewed')) document.getElementById('products-reviewed').textContent = '3'; 
            if (document.getElementById('saved-addresses')) document.getElementById('saved-addresses').textContent = '2'; 
            
            // C. DYNAMIC COUNTS (FROM LOCAL STORAGE)
            if (document.getElementById('items-in-wishlist')) document.getElementById('items-in-wishlist').textContent = wishlistCount;
            
            // D. LOGOUT BUTTON
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
                // I-ensure na isang listener lang ang na-attach
                logoutBtn.removeEventListener('click', handleLogout); 
                logoutBtn.addEventListener('click', handleLogout);
            }
        } else {
            // Logged Out State (Should be redirected by step 2, but for safety)
            if (profileUsername) profileUsername.textContent = `Welcome, Guest!`;
            if (profileEmail) profileEmail.textContent = `Please log in to view your details.`;
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
};

// =======================================================
// PAGE INITIALIZATION (On DOMContentLoaded)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Set initial status if it doesn't exist
    if (localStorage.getItem(USER_STATUS_KEY) === null) {
        localStorage.setItem(USER_STATUS_KEY, JSON.stringify({ isLoggedIn: false, name: 'Guest', email: '' }));
    }

    // --- AUTH Initialization ---
    updateGlobalUI(); 

    // Event listeners for login and register forms
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    
    // --- PRODUCT INTERACTIONS Initialization ---
    const productsSection = document.querySelector('.products');
    if (productsSection) {
        productsSection.addEventListener('click', addToCart);
        productsSection.addEventListener('click', addToWishlist);
        checkWishlistState();
    }
    
    // --- WISHLIST PAGE Initialization ---
    const wishlistSection = document.querySelector('.wishlist');
    if (wishlistSection) {
        renderWishlist();
        wishlistSection.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (e.target.classList.contains('remove-wishlist-item')) {
                const productName = e.target.getAttribute('data-name');
                if (confirm(`Are you sure you want to remove ${productName} from your wishlist?`)) {
                    removeWishlistItem(productName);
                }
            }
            
            if (e.target.classList.contains('move-to-cart-btn')) {
                const productName = e.target.getAttribute('data-name');
                moveToCart(productName);
            }
        });
    }

    // --- CART PAGE Initialization ---
    const cartSection = document.querySelector('.shopping-cart');
    if (cartSection) {
        renderCart();
        cartSection.addEventListener('click', handleCartInteractions);
        cartSection.addEventListener('change', handleCartInteractions); 
    }
    
    // CHECKOUT/ORDER SUMMARY Initialization
    const checkoutSection = document.querySelector('.checkout'); 
    if (checkoutSection) {
        renderOrderSummary();
    }
    
    document.querySelector('.header .search-form #search-box')?.addEventListener('keyup', searchProducts);
    
    // Optional: Add a listener for the Place Order button (form submission)
    const orderForm = document.querySelector('.order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cart = getCart();
            if (cart.length === 0) {
                alert('Your cart is empty. Please add items before placing an order.');
                return;
            }
            
            alert('Order Placed Successfully! Thank you for shopping with OPTIQUE.');
            localStorage.removeItem(CART_STORAGE_KEY);
            updateGlobalUI(); 
            window.location.href = 'home.html'; 
        });
    }
});