/**
 * cart.js
 * 
 * Handles the Cart page:
 *   1. Fetches GET /api/cart and renders cart items
 *   2. Handles item removal → DELETE /api/cart/:id
 *   3. Calculates subtotal, tax, and total
 * 
 * Integration points captured by Playwright:
 *   - GET /api/cart
 *   - DELETE /api/cart/:id
 */

requireAuth();

const loadingState   = document.getElementById('loading-state');
const cartLayout     = document.getElementById('cart-layout');
const cartItemsList  = document.getElementById('cart-items-list');
const emptyCart      = document.getElementById('empty-cart');
const itemCountLabel = document.getElementById('item-count-label');

const CATEGORY_ICONS = {
  electronics: '💻', audio: '🎧', mobile: '📱',
  accessories: '⌨️', display: '🖥️', wearable: '⌚',
};

/**
 * Renders a single cart item row.
 * @param {Object} item
 */
function renderCartItem(item) {
  const icon = CATEGORY_ICONS[item.category] || '📦';
  const div  = document.createElement('div');

  div.className = 'cart-item';
  div.setAttribute('role', 'listitem');
  div.setAttribute('data-cart-item-id', item.id);
  div.setAttribute('data-testid', `cart-item-${item.id}`);

  div.innerHTML = `
    <div class="cart-item-icon" aria-hidden="true">${icon}</div>
    <div class="cart-item-info">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-meta">Qty: ${item.quantity} · $${item.price.toFixed(2)} each</div>
    </div>
    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
    <button
      class="btn btn-danger btn-sm remove-btn"
      data-cart-id="${item.id}"
      data-testid="remove-item-${item.id}"
      aria-label="Remove ${item.name} from cart"
    >
      ✕
    </button>
  `;

  div.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
  return div;
}

/**
 * Updates the order summary totals.
 * @param {Array} items
 */
function updateSummary(items) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax      = subtotal * 0.08;
  const total    = subtotal + tax;

  document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summary-tax').textContent      = `$${tax.toFixed(2)}`;
  document.getElementById('summary-total').textContent    = `$${total.toFixed(2)}`;

  const label = items.length === 1 ? '1 item' : `${items.length} items`;
  itemCountLabel.textContent = label;
}

/**
 * Loads cart from GET /api/cart and renders.
 * Integration point: GET /api/cart
 */
async function loadCart() {
  loadingState.style.display = 'block';
  cartLayout.classList.add('hidden');

  try {
    // ── API call: GET /api/cart ───────────────────────────────────
    const data  = await api.get('/api/cart');
    const items = data.items || [];

    loadingState.style.display = 'none';
    cartLayout.classList.remove('hidden');
    cartItemsList.innerHTML    = '';

    if (items.length === 0) {
      emptyCart.classList.remove('hidden');
      document.getElementById('checkout-btn').setAttribute('href', '#');
      document.getElementById('checkout-btn').style.opacity = '0.4';
      document.getElementById('checkout-btn').style.pointerEvents = 'none';
    } else {
      emptyCart.classList.add('hidden');
      items.forEach(item => cartItemsList.appendChild(renderCartItem(item)));
    }

    updateSummary(items);
    updateCartBadge();

  } catch (err) {
    loadingState.style.display = 'none';
    cartLayout.classList.remove('hidden');
    cartItemsList.innerHTML = `
      <div class="alert alert-danger" role="alert" style="margin:1rem">
        Failed to load cart: ${err.message}
      </div>`;
  }
}

/**
 * Handles Remove button click.
 * Integration point: DELETE /api/cart/:id
 * @param {Event} event
 */
async function handleRemoveItem(event) {
  const btn    = event.currentTarget;
  const cartId = btn.dataset.cartId;
  const row    = btn.closest('.cart-item');

  btn.disabled  = true;
  btn.textContent = '…';

  try {
    // ── API call: DELETE /api/cart/:id ────────────────────────────
    await api.delete(`/api/cart/${cartId}`);

    // Animate out
    row.style.opacity    = '0';
    row.style.transform  = 'translateX(20px)';
    row.style.transition = 'all 0.3s ease';
    setTimeout(() => row.remove(), 300);

    showToast('Item removed from cart', 'info');

    // Refresh totals
    setTimeout(loadCart, 350);

  } catch (err) {
    showToast(`Failed to remove: ${err.message}`, 'error');
    btn.disabled    = false;
    btn.textContent = '✕';
  }
}

// ── Initialize ────────────────────────────────────────────────────
loadCart();
