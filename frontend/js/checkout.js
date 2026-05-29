/**
 * checkout.js
 * 
 * Handles the Checkout page:
 *   1. Loads current cart for order review
 *   2. Validates customer details form
 *   3. POSTs to POST /api/checkout with customer + cart data
 *   4. Redirects to order-confirmation page on success
 * 
 * Integration point captured by Playwright:
 *   - POST /api/checkout
 */

requireAuth();

const form        = document.getElementById('checkout-form');
const placeBtn    = document.getElementById('place-order-btn');
const orderReview = document.getElementById('order-review');

/**
 * Loads cart items for the order review sidebar.
 */
async function loadOrderReview() {
  try {
    const data  = await api.get('/api/cart');
    const items = data.items || [];

    if (items.length === 0) {
      orderReview.innerHTML = `
        <div class="text-center">
          <p class="text-muted">Your cart is empty.</p>
          <a href="/products.html" class="btn btn-secondary btn-sm mt-md">Browse Products</a>
        </div>`;
      placeBtn.disabled = true;
      return;
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax      = subtotal * 0.08;
    const total    = subtotal + tax;

    const itemsHtml = items.map(i => `
      <div class="order-item-row">
        <span class="order-item-name">${i.name} × ${i.quantity}</span>
        <span class="order-item-price">$${(i.price * i.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    orderReview.innerHTML = `
      <div class="order-items-list">
        ${itemsHtml}
        <div class="divider"></div>
        <div class="summary-row">
          <span>Subtotal</span><span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Tax (8%)</span><span>$${tax.toFixed(2)}</span>
        </div>
        <div class="summary-total">
          <span>Total</span><strong>$${total.toFixed(2)}</strong>
        </div>
      </div>
    `;

  } catch (err) {
    orderReview.innerHTML = `<p class="text-danger">Failed to load cart: ${err.message}</p>`;
  }
}

/**
 * Validates required checkout form fields.
 * @returns {{ valid: boolean, data: Object }}
 */
function validateAndCollect() {
  const fields = ['first-name', 'last-name', 'address', 'city', 'phone'];
  let valid = true;
  const data = {};

  fields.forEach(id => {
    const el  = document.getElementById(id);
    const val = el.value.trim();
    if (!val) {
      el.style.borderColor = 'var(--color-danger)';
      valid = false;
    } else {
      el.style.borderColor = '';
      const key = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); // camelCase
      data[key] = val;
    }
  });

  return { valid, data };
}

/**
 * Handles form submit — places the order via POST /api/checkout.
 * Integration point: POST /api/checkout
 */
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { valid, data: customerData } = validateAndCollect();
  if (!valid) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  placeBtn.classList.add('loading');
  placeBtn.textContent = 'Placing order…';
  placeBtn.disabled    = true;

  try {
    // ── API call: POST /api/checkout ──────────────────────────────
    const order = await api.post('/api/checkout', {
      customer: customerData,
    });

    // Store order ID for confirmation page
    localStorage.setItem('lastOrderId', order.orderId);

    showToast('Order placed successfully! 🎉', 'success');
    setTimeout(() => {
      window.location.href = '/order-confirmation.html';
    }, 800);

  } catch (err) {
    showToast(`Order failed: ${err.message}`, 'error');
    placeBtn.classList.remove('loading');
    placeBtn.textContent = '🛍 Place Order';
    placeBtn.disabled    = false;
  }
});

// Clear validation highlight on input
['first-name', 'last-name', 'address', 'city', 'phone'].forEach(id => {
  document.getElementById(id).addEventListener('input', function() {
    this.style.borderColor = '';
  });
});

// ── Initialize ────────────────────────────────────────────────────
loadOrderReview();
