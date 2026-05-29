/**
 * products.js
 * 
 * Handles the Products page:
 *   1. Requires authentication (redirect to login if no token)
 *   2. Fetches GET /api/products and renders product cards
 *   3. Handles "Add to Cart" → POST /api/cart for each product
 *   4. Updates cart count badge in real time
 * 
 * Integration points captured by Playwright:
 *   - GET /api/products
 *   - POST /api/cart
 */

// Guard: must be authenticated
requireAuth();

// Display current user
const user = getStoredUser();
if (user) {
  const el = document.getElementById('user-display');
  if (el) el.textContent = `👤 ${user.name || user.email}`;
}

const grid     = document.getElementById('products-grid');
const countEl  = document.getElementById('product-count');
const indicator = document.getElementById('loading-indicator');
const cartInd  = document.getElementById('cart-indicator');

/** Product emoji map by category */
const CATEGORY_ICONS = {
  electronics: '💻',
  audio:       '🎧',
  mobile:      '📱',
  accessories: '⌨️',
  display:     '🖥️',
  wearable:    '⌚',
};

/**
 * Renders a single product card DOM element.
 * @param {Object} product
 * @param {number} index   Zero-based position (used for data attributes)
 */
function renderProductCard(product, index) {
  const icon = CATEGORY_ICONS[product.category] || '📦';
  const stockClass = product.stock === 0 ? 'out' : product.stock < 5 ? 'low' : '';
  const stockLabel = product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`;

  const card = document.createElement('div');
  card.className = 'glass-card product-card fade-in-up';
  card.setAttribute('role', 'listitem');
  card.setAttribute('data-product-id', product.id);
  card.setAttribute('data-product-index', index);
  card.style.animationDelay = `${index * 60}ms`;

  card.innerHTML = `
    <div class="product-image-wrap" aria-hidden="true">
      <span>${icon}</span>
    </div>
    <div class="card-body">
      <div class="product-category">${product.category}</div>
      <div class="product-name">${product.name}</div>
      <div class="product-price">$${product.price.toFixed(2)}</div>
      <div class="product-stock ${stockClass}" aria-label="${stockLabel}">
        <span>${stockClass === 'out' ? '✕' : '✓'}</span>
        ${stockLabel}
      </div>
    </div>
    <div class="product-footer">
      <button
        class="btn btn-primary add-to-cart-btn"
        id="add-to-cart-${product.id}"
        data-product-id="${product.id}"
        data-product-name="${product.name}"
        data-product-price="${product.price}"
        data-testid="add-to-cart-${index}"
        aria-label="Add ${product.name} to cart"
        ${product.stock === 0 ? 'disabled' : ''}
      >
        ${product.stock === 0 ? '✕ Out of Stock' : '🛒 Add to Cart'}
      </button>
    </div>
  `;

  return card;
}

/**
 * Fetches product list from GET /api/products and renders the grid.
 * Integration point: GET /api/products
 */
async function loadProducts() {
  indicator.classList.remove('hidden');

  try {
    // ── API call: GET /api/products ───────────────────────────────
    const data = await api.get('/api/products');
    const products = data.products || [];

    // Clear skeleton loaders
    grid.innerHTML = '';

    if (products.length === 0) {
      grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1">No products available.</p>';
      return;
    }

    // Render each product card
    products.forEach((product, index) => {
      grid.appendChild(renderProductCard(product, index));
    });

    countEl.textContent = `${data.total || products.length} products`;

    // Attach Add-to-Cart listeners
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });

  } catch (err) {
    grid.innerHTML = `
      <div class="alert alert-danger" style="grid-column:1/-1" role="alert">
        Failed to load products: ${err.message}
      </div>`;
  } finally {
    indicator.classList.add('hidden');
  }
}

/**
 * Handles "Add to Cart" button click.
 * Integration point: POST /api/cart
 * @param {Event} event
 */
async function handleAddToCart(event) {
  const btn       = event.currentTarget;
  const productId = btn.dataset.productId;
  const name      = btn.dataset.productName;
  const price     = parseFloat(btn.dataset.productPrice);

  // Loading state
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Adding…';
  btn.disabled  = true;

  try {
    // ── API call: POST /api/cart ──────────────────────────────────
    await api.post('/api/cart', {
      productId,
      name,
      price,
      quantity: 1,
    });

    showToast(`${name} added to cart!`, 'success');

    // Update cart badge
    await updateCartBadge();

    // Show floating cart button
    if (cartInd) cartInd.style.display = 'block';

    btn.innerHTML = '✓ Added!';
    btn.classList.replace('btn-primary', 'btn-success');

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.replace('btn-success', 'btn-primary');
      btn.disabled = false;
    }, 2000);

  } catch (err) {
    showToast(`Failed to add: ${err.message}`, 'error');
    btn.innerHTML = originalText;
    btn.disabled  = false;
  }
}

// ── Initialize ────────────────────────────────────────────────────
loadProducts();
updateCartBadge().then(count => {
  if (count > 0 && cartInd) cartInd.style.display = 'block';
});
