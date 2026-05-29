/**
 * order-confirmation.js
 * 
 * Handles the Order Confirmation / History page:
 *   1. Fetches GET /api/orders and displays all orders
 *   2. If arriving from checkout, shows a success banner
 *   3. Displays each order with items, total, and status
 * 
 * Integration point captured by Playwright:
 *   - GET /api/orders
 */

requireAuth();

const loadingState   = document.getElementById('loading-state');
const ordersContainer = document.getElementById('orders-container');
const emptyOrders    = document.getElementById('empty-orders');
const newOrderBanner = document.getElementById('new-order-banner');
const latestOrderId  = document.getElementById('latest-order-id');
const orderCountEl   = document.getElementById('order-count-label');

/** Status badge color mapping */
const STATUS_BADGE = {
  confirmed:  'badge-success',
  pending:    'badge-warning',
  shipped:    'badge-primary',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
};

/**
 * Renders a single order card.
 * @param {Object} order
 * @param {boolean} isLatest  Highlight as the most recent order
 */
function renderOrderCard(order, isLatest) {
  const date   = new Date(order.createdAt).toLocaleString();
  const badge  = STATUS_BADGE[order.status] || 'badge-primary';
  const items  = (order.items || []);

  const itemsHtml = items.map(item => `
    <div class="order-item-row">
      <span class="order-item-name">${item.name} × ${item.quantity}</span>
      <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const card = document.createElement('div');
  card.className = `glass-card fade-in-up ${isLatest ? 'latest-order' : ''}`;
  card.style.marginBottom = 'var(--space-lg)';
  card.setAttribute('data-testid', `order-card-${order.orderId}`);
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Order ${order.orderId}`);

  if (isLatest) {
    card.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    card.style.boxShadow   = '0 0 20px rgba(16, 185, 129, 0.1)';
  }

  card.innerHTML = `
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);margin-bottom:0.25rem;">Order ID</div>
        <div id="order-id" class="font-mono" style="font-size:0.875rem;color:var(--color-accent-light)" data-testid="order-id">${order.orderId}</div>
      </div>
      <div style="text-align:right">
        <span class="badge ${badge}" id="order-status" data-testid="order-status">${order.status}</span>
        <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.25rem;">${date}</div>
      </div>
    </div>
    <div class="card-body">
      <h3 style="font-size:0.875rem;font-weight:600;color:var(--color-text-secondary);margin-bottom:0.75rem;">
        Items (${items.length})
      </h3>
      <div class="order-items-list">
        ${itemsHtml}
      </div>
      <div class="divider"></div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:0.75rem;color:var(--color-text-muted)">Deliver to</div>
          <div style="font-size:0.875rem;color:var(--color-text-secondary)">
            ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}, ${order.customer?.city || ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.75rem;color:var(--color-text-muted)">Order Total</div>
          <div style="font-size:1.25rem;font-weight:700;color:var(--color-text-primary)">
            $${order.total?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
    </div>
  `;

  return card;
}

/**
 * Loads and renders all orders from GET /api/orders.
 * Integration point: GET /api/orders
 */
async function loadOrders() {
  loadingState.style.display = 'block';

  try {
    // ── API call: GET /api/orders ─────────────────────────────────
    const data   = await api.get('/api/orders');
    const orders = data.orders || [];

    loadingState.style.display = 'none';

    // Show success banner if arriving from checkout
    const lastOrderId = localStorage.getItem('lastOrderId');
    if (lastOrderId) {
      newOrderBanner.classList.remove('hidden');
      latestOrderId.textContent = `Order #${lastOrderId}`;
      latestOrderId.setAttribute('data-testid', 'new-order-id');
      localStorage.removeItem('lastOrderId');
    }

    if (orders.length === 0) {
      emptyOrders.classList.remove('hidden');
      return;
    }

    orderCountEl.textContent = `${data.count || orders.length} order(s)`;
    ordersContainer.classList.remove('hidden');
    ordersContainer.innerHTML = '';

    // Render orders newest-first
    [...orders].reverse().forEach((order, index) => {
      ordersContainer.appendChild(renderOrderCard(order, index === 0 && !!localStorage.getItem('lastOrderId')));
    });

  } catch (err) {
    loadingState.style.display = 'none';
    ordersContainer.classList.remove('hidden');
    ordersContainer.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Failed to load orders: ${err.message}
      </div>`;
  }
}

// ── Initialize ────────────────────────────────────────────────────
loadOrders();
