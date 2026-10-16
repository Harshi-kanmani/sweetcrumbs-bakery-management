const $ = (s) => document.querySelector(s);
const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
let user = null,
  products = [],
  categories = ["All"],
  activeCategory = "All",
  cart = JSON.parse(localStorage.getItem("sweetcrumbs-cart") || "[]"),
  appliedCoupon = null,
  toastTimer;
const statuses = [
  "Order Placed",
  "Confirmed",
  "Preparing",
  "Ready for Dispatch",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];
async function api(url, options = {}) {
  const res = await fetch("/api" + url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function esc(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function saveCart() {
  localStorage.setItem("sweetcrumbs-cart", JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const n = cart.reduce((a, x) => a + x.quantity, 0);
  $("#cart-count").textContent = n;
  $("#drawer-count").textContent = n ? `(${n})` : "";
}
async function loadProducts() {
  try {
    const p = await api(
      "/products?" +
        new URLSearchParams({
          q: $("#search").value,
          category: activeCategory,
          sort: $("#sort").value,
        }),
    );
    products = p.products;
    categories = p.categories;
    renderCategories();
    renderProducts();
  } catch (e) {
    $("#product-grid").innerHTML =
      `<div class="error-text">${esc(e.message)}</div>`;
  }
}
function renderCategories() {
  $("#categories").innerHTML = categories
    .map(
      (c) =>
        `<button class="pill ${activeCategory === c ? "active" : ""}" onclick="chooseCategory('${esc(c)}')">${esc(c)}</button>`,
    )
    .join("");
}
function chooseCategory(c) {
  activeCategory = c;
  renderCategories();
  loadProducts();
}
function resetFilters() {
  activeCategory = "All";
  $("#search").value = "";
  $("#sort").value = "featured";
  loadProducts();
}

function productPhoto(p) {
    const images = {
        "Chocolate Truffle Cake":
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&q=85",

        "Strawberry Dream Cake":
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900&q=85",

        "Butter Croissant":
            "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900&q=85",

        "Blueberry Muffin":
            "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=900&q=85",

        "Classic Sourdough":
            "https://tse3.mm.bing.net/th/id/OIP.wMVfXs1oZZaHvtaEWJGknAHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "Choco Chip Cookies":
            "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=900&q=85",

        "Glazed Donut":
            "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=85",

        "Veg Puff":
            "https://tse2.mm.bing.net/th/id/OIP.R1Yonl1euQiedfJT7qOYawHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",

        "Fudge Brownie":
            "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&q=85",

        "Garlic Breadsticks":
            "https://tse2.mm.bing.net/th/id/OIP.7UGWEbPgqsB121HfsfEfFgHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        "Red Velvet Cupcake":
            "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=900&q=85",

        "Almond Biscotti":
            "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=900&q=85"
    };

    return images[p.name] ||
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=85";
}
function renderProducts() {
  if (!products.length) {
    $("#product-grid").innerHTML = "";
    $("#empty-state").classList.remove("hidden");
    return;
  }
  $("#empty-state").classList.add("hidden");
  $("#product-grid").innerHTML = products
    .map(
      (p) =>
        `<article class="product-card"><div class="product-image" onclick="showProduct(${p.id})"><img class="product-photo" src="${productPhoto(p)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">${p.featured ? '<span class="badge">HOUSE FAVOURITE</span>' : ""}<button class="quick-add" aria-label="Add ${esc(p.name)} to bag" onclick="event.stopPropagation();addToCart(${p.id})">+</button></div><div class="product-meta"><div class="product-category">${esc(p.category)} <span class="stock-note">/ ${p.stock > 0 ? "BAKED FRESH" : "SOLD OUT"}</span></div><div class="product-title-row"><div class="product-title" onclick="showProduct(${p.id})">${esc(p.name)}</div><div class="product-price">${money(p.price)}</div></div><div class="product-description">${esc(p.description)}</div><div class="rating">${p.rating ? `★ ${p.rating} <span>(${p.review_count} reviews)</span>` : "<span>No reviews yet</span>"}</div></div></article>`,
    )
    .join("");
}
function addToCart(id) {
  const p = products.find((x) => x.id === id) || null;
  if (!p) {
    loadProducts().then(() => {
      const pp = products.find((x) => x.id === id);
      if (pp) addProduct(pp);
    });
    return;
  }
  addProduct(p);
}
function addProduct(p) {
  if (p.stock <= 0) return toast("This bake is sold out today.");
  const item = cart.find((x) => x.id === p.id);
  if (item) {
    if (item.quantity >= p.stock)
      return toast("That is all the available stock.");
    item.quantity++;
  } else
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      emoji: p.emoji,
      stock: p.stock,
      quantity: 1,
    });
  appliedCoupon = null;
  saveCart();
  toast(`${p.name} added to your bag ♡`);
  if ($("#cart-overlay").classList.contains("open")) renderCart();
}
function changeQty(id, delta) {
  const x = cart.find((i) => i.id === id);
  if (!x) return;
  if (delta > 0 && x.quantity >= x.stock)
    return toast("That is all the available stock.");
  x.quantity += delta;
  if (x.quantity <= 0) cart = cart.filter((i) => i.id !== id);
  appliedCoupon = null;
  saveCart();
  renderCart();
}
function removeCartItem(id) {
  cart = cart.filter((x) => x.id !== id);
  appliedCoupon = null;
  saveCart();
  renderCart();
}
function cartTotals() {
  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const delivery = subtotal - discount >= 500 || subtotal === 0 ? 0 : 40;
  return {
    subtotal,
    discount,
    delivery,
    total: Math.max(0, subtotal - discount + delivery),
  };
}
function toggleCart(open) {
  $("#cart-overlay").classList.toggle("open", open);
  if (open) renderCart();
}
function renderCart() {
  const items = $("#cart-items");
  if (!cart.length) {
    items.innerHTML =
      '<div class="empty-state">Your bag is waiting for something lovely. 🥐<br><br><button class="small-btn" onclick="toggleCart(false);document.querySelector(\'#shop\').scrollIntoView()">Explore the bakery</button></div>';
    $("#cart-bottom").innerHTML = "";
    return;
  }
  items.innerHTML = cart
    .map(
      (x) =>
        `<div class="cart-row"><div class="cart-thumb">${esc(x.emoji)}</div><div><h4>${esc(x.name)}</h4><small>${money(x.price)} each</small><div class="qty-controls"><button onclick="changeQty(${x.id},-1)">−</button><span>${x.quantity}</span><button onclick="changeQty(${x.id},1)">+</button></div><button class="remove-btn" onclick="removeCartItem(${x.id})">Remove</button></div><strong>${money(x.price * x.quantity)}</strong></div>`,
    )
    .join("");
  const t = cartTotals();
  $("#cart-bottom").innerHTML =
    `<div class="coupon-row"><input id="coupon-input" placeholder="Coupon code" value="${appliedCoupon ? esc(appliedCoupon.code) : ""}"><button onclick="applyCoupon()">Apply</button></div>${appliedCoupon ? `<div class="success-text">${esc(appliedCoupon.code)} applied — saving ${money(appliedCoupon.discount)}.</div>` : ""}<div class="cart-total"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>${t.discount ? `<div class="cart-total"><span>Discount</span><span>−${money(t.discount)}</span></div>` : ""}<div class="cart-total"><span>Delivery ${t.subtotal - t.discount >= 500 ? "(free over ₹500)" : ""}</span><span>${t.delivery ? money(t.delivery) : "FREE"}</span></div><div class="cart-total grand"><span>Total</span><span>${money(t.total)}</span></div><button class="btn btn-dark" onclick="checkout()">Continue to checkout ↗</button><p class="muted" style="text-align:center;font-size:9px">Taxes included · Secure checkout</p>`;
}
async function applyCoupon() {
  if (!user) {
    openAccount();
    return toast("Please log in to apply a coupon.");
  }
  const code = $("#coupon-input").value.trim();
  try {
    const t = cartTotals(),
      r = await api("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal: t.subtotal }),
      });
    appliedCoupon = { code: r.coupon, discount: r.discount };
    renderCart();
    toast(r.message);
  } catch (e) {
    appliedCoupon = null;
    renderCart();
    toast(e.message);
  }
}
function openModal(html) {
  $("#modal-content").innerHTML = html;
  $("#modal-overlay").classList.add("open");
}
function closeModal() {
  $("#modal-overlay").classList.remove("open");
}
function openAccount() {
  if (user) {
    if (user.role === "admin") return openAdmin();
    if (user.role === "delivery") return openDelivery();
    return openProfile();
  }
  openLogin();
}
function openLogin(error = "") {
  openModal(
    `<div class="eyebrow">WELCOME TO OUR TABLE</div><h2>Come on in.</h2><p>Log in to place orders and keep your favourite bakes close.</p><div id="auth-error">${error ? `<div class="error-text">${esc(error)}</div>` : ""}</div><form id="login-form"><div class="field"><label>Email address</label><input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></div><div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password" placeholder="At least 6 characters"></div><button class="btn btn-dark" type="submit">Log in ↗</button></form><p class="form-switch">New around here? <button onclick="openRegister()">Create an account</button></p><p class="muted" style="font-size:10px">Demo admin: admin@sweetcrumbs.local · Password: Admin@123</p>`,
  );
  $("#login-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const r = await api("/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(f)),
      });
      user = r.user;
      closeModal();
      refreshAccountUI();
      toast(`Welcome back, ${user.name.split(" ")[0]}!`);
    } catch (err) {
      $("#auth-error").innerHTML =
        `<div class="error-text">${esc(err.message)}</div>`;
    }
  };
}
function openRegister(error = "") {
  openModal(
    `<div class="eyebrow">A LITTLE MORE SWEETNESS</div><h2>Pull up a chair.</h2><p>Create your account for a smoother, sweeter checkout.</p><div id="auth-error">${error ? `<div class="error-text">${esc(error)}</div>` : ""}</div><form id="register-form"><div class="form-grid"><div class="field full"><label>Your name</label><input name="name" required autocomplete="name"></div><div class="field full"><label>Email address</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Password</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div><div class="field"><label>Phone number</label><input name="phone" type="tel" placeholder="Optional"></div><div class="field full"><label>Delivery address</label><textarea name="address" rows="2" placeholder="House / street / area (optional for now)"></textarea></div></div><button class="btn btn-dark" type="submit">Create my account ↗</button></form><p class="form-switch">Already have an account? <button onclick="openLogin()">Log in</button></p>`,
  );
  $("#register-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const r = await api("/register", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(f)),
      });
      user = r.user;
      closeModal();
      refreshAccountUI();
      toast("Your account is ready. Welcome! ♡");
    } catch (err) {
      $("#auth-error").innerHTML =
        `<div class="error-text">${esc(err.message)}</div>`;
    }
  };
}
function refreshAccountUI() {}
function openProfile() {
  openModal(
    `<div class="eyebrow">YOUR SWEET LITTLE CORNER</div><h2>Hello, ${esc(user.name.split(" ")[0])} ♡</h2><p>${esc(user.email)}</p><div class="order-card"><p><strong>Account details</strong></p><p>${esc(user.phone || "No phone saved")}</p><p>${esc(user.address || "No delivery address saved")}</p></div><button class="btn btn-dark" onclick="closeModal();openOrders()">View my orders</button><button class="small-btn" style="width:100%;margin-top:10px" onclick="logout()">Log out</button>`,
  );
}
async function logout() {
  try {
    await api("/logout", { method: "POST" });
  } catch {}
  user = null;
  closeModal();
  toast("You have been logged out.");
}
async function showProduct(id) {
  try {
    const [d, r] = await Promise.all([
      api("/products/" + id),
      api("/products/" + id + "/reviews"),
    ]);
    const p = d.product;
    openModal(
      `<div class="detail-hero"><div class="detail-emoji">${esc(p.emoji)}</div><div><div class="eyebrow">${esc(p.category.toUpperCase())}</div><h2>${esc(p.name)}</h2><div class="detail-price">${money(p.price)}</div><p>${esc(p.description)}</p><div class="rating">${p.rating ? `★ ${p.rating} (${p.review_count} reviews)` : "♡ Be the first to review"}</div><p>${p.stock > 0 ? `${p.stock} available today` : "Currently sold out"}</p><button class="btn btn-dark" onclick="addToCart(${p.id});closeModal()" ${p.stock <= 0 ? "disabled" : ""}>Add to bag +</button></div></div><h3 style="font:22px 'Playfair Display';margin-top:25px">A few kind words</h3>${r.reviews.length ? r.reviews.map((x) => `<div class="review-line"><strong>${"★".repeat(x.rating)}${"☆".repeat(5 - x.rating)} · ${esc(x.name)}</strong>${esc(x.comment || "Loved it!")}</div>`).join("") : "<p>No reviews yet. Reviews are available to customers after delivery.</p>"}`,
    );
  } catch (e) {
    toast(e.message);
  }
}
async function checkout() {
  if (!cart.length) return toast("Your bag is empty.");
  if (!user) {
    openAccount();
    return toast("Please log in before checking out.");
  }
  toggleCart(false);
  const savedAddress = user.address || "";
  openModal(
    `<div class="eyebrow">THE SWEET PART IS ALMOST HERE</div><h2>Checkout.</h2><p>Tell us where to bring your bakes.</p><div id="checkout-error"></div><form id="checkout-form"><div class="form-grid"><div class="field full"><label>Full name</label><input name="customerName" required value="${esc(user.name)}"></div><div class="field full"><label>Phone number</label><input name="phone" required type="tel" value="${esc(user.phone || "")}" placeholder="For delivery updates"></div><div class="field full"><label>Delivery address</label><textarea name="address" rows="3" required>${esc(savedAddress)}</textarea></div><div class="field full"><label>Payment method</label><select name="paymentMethod"><option value="COD">Cash on Delivery</option><option value="UPI_DEMO">UPI (demo simulation)</option><option value="CARD_DEMO">Credit / Debit Card (demo simulation)</option></select><small class="muted">Online payment options are simulated for this project; no real payment is collected.</small></div></div><div id="checkout-summary"></div><button class="btn btn-dark" type="submit">Place my order ↗</button></form>`,
  );
  const t = cartTotals();
  $("#checkout-summary").innerHTML =
    `<div class="order-card"><div class="cart-total"><span>Items (${cart.reduce((a, x) => a + x.quantity, 0)})</span><span>${money(t.subtotal)}</span></div>${t.discount ? `<div class="cart-total"><span>Discount</span><span>−${money(t.discount)}</span></div>` : ""}<div class="cart-total"><span>Delivery</span><span>${t.delivery ? money(t.delivery) : "FREE"}</span></div><div class="cart-total grand"><span>Total to pay</span><span>${money(t.total)}</span></div></div>`;
  $("#checkout-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    const payload = {
      ...form,
      items: cart.map((x) => ({ id: x.id, quantity: x.quantity })),
      coupon: appliedCoupon?.code || "",
    };
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Placing your order...";
    try {
      const r = await api("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      cart = [];
      appliedCoupon = null;
      saveCart();
      user = { ...user, phone: form.phone, address: form.address };
      openOrderSuccess(r.order);
    } catch (err) {
      $("#checkout-error").innerHTML =
        `<div class="error-text">${esc(err.message)}</div>`;
      btn.disabled = false;
      btn.textContent = "Place my order ↗";
    }
  };
}
function openOrderSuccess(o) {
  openModal(
    `<div style="text-align:center;padding:15px 0"><div style="font-size:56px">🧁</div><div class="eyebrow">ORDER CONFIRMED</div><h2>Something lovely is on its way.</h2><p>Your order number is <strong>${esc(o.order_code)}</strong>.</p><div class="order-card"><div class="cart-total"><span>Order total</span><strong>${money(o.total)}</strong></div><div class="cart-total"><span>Payment</span><span>${o.payment_method === "COD" ? "Cash on Delivery" : "Demo payment completed"}</span></div><div class="cart-total"><span>Status</span><span class="status">${esc(o.status)}</span></div></div><button class="btn btn-dark" onclick="closeModal();openOrders()">Track my order ↗</button><button class="small-btn" style="width:100%;margin-top:10px" onclick="closeModal()">Back to bakery</button></div>`,
  );
}
async function openOrders() {
  if (!user) {
    openAccount();
    return;
  }
  try {
    const r = await api("/orders");
    openModal(
      `<div class="eyebrow">FRESH FROM OUR KITCHEN</div><h2>Your orders.</h2><p>Every little treat, all in one place.</p><div id="orders-list">${r.orders.length ? r.orders.map(orderCard).join("") : '<div class="empty-state">No orders just yet. Your first treat is waiting. 🍰</div>'}</div>`,
    );
  } catch (e) {
    toast(e.message);
  }
}
function orderCard(o) {
  return `<article class="order-card"><div class="order-top"><div><div class="order-code">${esc(o.order_code)}</div><p>${new Date(o.created_at.replace(" ", "T") + "Z").toLocaleString()}</p></div><span class="status">${esc(o.status)}</span></div><div class="order-items">${o.items.map((i) => `${esc(i.product_name)} × ${i.quantity}`).join(" · ")}</div><div class="order-total">${money(o.total)}</div><div class="status-steps">${statuses
    .slice(0, 6)
    .map(
      (s) =>
        `<span class="${s === o.status ? "current" : ""}">${esc(s)}</span>`,
    )
    .join(
      "",
    )}</div>${["Order Placed", "Confirmed"].includes(o.status) ? `<button class="small-btn" style="margin-top:10px" onclick="cancelOrder(${o.id})">Cancel order</button>` : ""}</article>`;
}
async function cancelOrder(id) {
  if (!confirm("Cancel this order?")) return;
  try {
    await api(`/orders/${id}/cancel`, { method: "POST" });
    toast("Order cancelled.");
    openOrders();
  } catch (e) {
    toast(e.message);
  }
}
async function openAdmin() {
  if (!user) {
    openLogin();
    return;
  }
  if (user.role !== "admin") return toast("Administrator access required.");
  openModal(
    '<div class="eyebrow">BAKERY OPERATIONS</div><h2>Admin dashboard.</h2><div id="admin-root"><p>Loading bakery overview...</p></div>',
  );
  await adminTab("overview");
}
async function adminTab(tab) {
  const root = $("#admin-root");
  if (!root) return;
  root.innerHTML = '<p class="muted">Loading...</p>';
  document
    .querySelectorAll(".admin-tabs button")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  try {
    if (tab === "overview") {
      const d = await api("/admin/summary");
      root.innerHTML = `<div class="admin-stats">${[
        ["Products", d.products],
        ["All orders", d.orders],
        ["Customers", d.customers],
        ["Order value", money(d.revenue)],
        ["Open orders", d.pending],
      ]
        .map(
          ([a, b]) =>
            `<div class="stat"><small>${a}</small><strong>${b}</strong></div>`,
        )
        .join(
          "",
        )}</div><p class="muted">Use the tabs to update products, manage customer orders, and view sales reports.</p>`;
    } else if (tab === "products") {
      const d = await api("/admin/products");
      root.innerHTML = `<button class="btn btn-dark" onclick="productEditor()">+ Add a product</button><div class="admin-table-wrap"><table class="admin-table"><tr><th>Product</th><th>Price</th><th>Stock</th><th>Actions</th></tr>${d.products.map((p) => `<tr><td>${esc(p.emoji)} ${esc(p.name)}<br><small>${esc(p.category)} ${p.active ? "" : "(hidden)"}</small></td><td>${money(p.price)}</td><td>${p.stock}</td><td><button class="small-btn" onclick="productEditor(${p.id})">Edit</button> <button class="small-btn" onclick="deleteProduct(${p.id})">Hide</button></td></tr>`).join("")}</table></div>`;
    } else if (tab === "orders") {
      const d = await api("/admin/orders");
      root.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><tr><th>Order / Customer</th><th>Total</th><th>Status</th></tr>${d.orders.map((o) => `<tr><td><strong>${esc(o.order_code)}</strong><br>${esc(o.customer_name)}<br><small>${esc(o.phone)}</small><br><small>${esc(o.address)}</small><br><small>${o.items.map((i) => `${esc(i.product_name)} ×${i.quantity}`).join(", ")}</small></td><td>${money(o.total)}<br><small>${esc(o.payment_method)}</small></td><td><select onchange="updateOrderStatus(${o.id},this.value)" ${["Cancelled", "Delivered"].includes(o.status) ? "disabled" : ""}>${statuses.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`).join("")}</table></div>`;
    } else if (tab === "customers") {
      const d = await api("/admin/customers");
      root.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><tr><th>Customer</th><th>Contact</th><th>Joined</th></tr>${d.customers.map((c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.email)}<br>${esc(c.phone || "—")}</td><td>${esc(c.created_at)}</td></tr>`).join("")}</table></div>`;
    } else if (tab === "reports") {
      const d = await api("/admin/reports");
      root.innerHTML = `<h3 style="font:22px 'Playfair Display'">Daily sales</h3><div class="admin-table-wrap"><table class="admin-table"><tr><th>Date</th><th>Orders</th><th>Sales</th></tr>${d.sales.map((x) => `<tr><td>${esc(x.day)}</td><td>${x.orders}</td><td>${money(x.revenue)}</td></tr>`).join("") || '<tr><td colspan="3">No sales yet</td></tr>'}</table></div><h3 style="font:22px 'Playfair Display'">Best-selling bakes</h3><div class="admin-table-wrap"><table class="admin-table"><tr><th>Product</th><th>Quantity</th><th>Sales value</th></tr>${d.topProducts.map((x) => `<tr><td>${esc(x.product_name)}</td><td>${x.quantity}</td><td>${money(x.sales)}</td></tr>`).join("")}</table></div>`;
    }
  } catch (e) {
    root.innerHTML = `<div class="error-text">${esc(e.message)}</div>`;
  }
}
function productEditor(id) {
  const p = products.find((x) => x.id === id) || null;
  api("/admin/products").then((d) => {
    const x = d.products.find((a) => a.id === id);
    openModal(
      `<div class="eyebrow">BAKERY CATALOGUE</div><h2>${x ? "Edit bake" : "Add a new bake"}</h2><div id="product-error"></div><form id="product-form"><div class="form-grid"><div class="field full"><label>Product name</label><input name="name" required value="${esc(x?.name || "")}"></div><div class="field"><label>Category</label><input name="category" required list="category-list" value="${esc(x?.category || "Cakes")}"><datalist id="category-list">${categories.map((c) => `<option>${esc(c)}</option>`).join("")}</datalist></div><div class="field"><label>Price (₹)</label><input name="price" type="number" min="0" step="0.01" required value="${x?.price ?? ""}"></div><div class="field"><label>Stock</label><input name="stock" type="number" min="0" step="1" required value="${x?.stock ?? 0}"></div><div class="field"><label>Emoji</label><input name="emoji" value="${esc(x?.emoji || "🥐")}"></div><div class="field full"><label>Description</label><textarea name="description" rows="3">${esc(x?.description || "")}</textarea></div><div class="field"><label><input style="width:auto" type="checkbox" name="featured" ${x?.featured ? "checked" : ""}> Featured</label></div>${x ? `<div class="field"><label><input style="width:auto" type="checkbox" name="active" ${x.active ? "checked" : ""}> Visible in shop</label></div>` : ""}</div><button class="btn btn-dark">Save product ↗</button></form>`,
    );
    $("#product-form").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target),
        body = Object.fromEntries(fd);
      body.featured = fd.has("featured");
      body.active = fd.has("active");
      try {
        await api(x ? `/admin/products/${x.id}` : "/admin/products", {
          method: x ? "PUT" : "POST",
          body: JSON.stringify(body),
        });
        closeModal();
        toast("Product saved.");
        await loadProducts();
        openAdmin();
        setTimeout(() => adminTab("products"), 100);
      } catch (err) {
        $("#product-error").innerHTML =
          `<div class="error-text">${esc(err.message)}</div>`;
      }
    };
  });
}
async function deleteProduct(id) {
  if (!confirm("Hide this product from the shop? Existing orders will remain."))
    return;
  try {
    await api("/admin/products/" + id, { method: "DELETE" });
    toast("Product hidden from the shop.");
    await loadProducts();
    adminTab("products");
  } catch (e) {
    toast(e.message);
  }
}
async function updateOrderStatus(id, status) {
  try {
    await api("/admin/orders/" + id + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    toast("Order status updated.");
  } catch (e) {
    toast(e.message);
    adminTab("orders");
  }
}
async function openDelivery() {
  if (!user || !["delivery", "admin"].includes(user.role))
    return toast("Delivery partner access required.");
  openModal(
    '<div class="eyebrow">LAST MILE, LOTS OF LOVE</div><h2>Delivery dashboard.</h2><div id="delivery-root">Loading assigned orders...</div>',
  );
  await loadDelivery();
}
async function loadDelivery() {
  try {
    const d = await api("/delivery/orders");
    $("#delivery-root").innerHTML = d.orders.length
      ? d.orders
          .map(
            (o) =>
              `<div class="order-card"><div class="order-code">${esc(o.order_code)} · ${esc(o.customer_name)}</div><p>${esc(o.phone)}<br>${esc(o.address)}</p><div class="order-items">${o.items.map((i) => `${esc(i.product_name)} × ${i.quantity}`).join(" · ")}</div><p><span class="status">${esc(o.status)}</span></p>${o.status === "Ready for Dispatch" ? `<button class="btn btn-dark" onclick="deliveryStatus(${o.id},'Out for Delivery')">Start delivery ↗</button>` : `<button class="btn btn-dark" onclick="deliveryStatus(${o.id},'Delivered')">Confirm delivered ✓</button>`}</div>`,
          )
          .join("")
      : '<div class="empty-state">No orders are waiting for delivery right now.</div>';
  } catch (e) {
    $("#delivery-root").innerHTML =
      `<div class="error-text">${esc(e.message)}</div>`;
  }
}
async function deliveryStatus(id, status) {
  try {
    await api("/delivery/orders/" + id + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    toast("Delivery status updated.");
    loadDelivery();
  } catch (e) {
    toast(e.message);
  }
}
function mountAdminTabs() {
  const h = $("#modal-content");
  if (h && !h.querySelector(".admin-tabs"))
    h.insertAdjacentHTML(
      "beforeend",
      `<div class="admin-tabs">${[
        ["overview", "Overview"],
        ["products", "Products"],
        ["orders", "Orders"],
        ["customers", "Customers"],
        ["reports", "Reports"],
      ]
        .map(
          ([k, v]) =>
            `<button data-tab="${k}" onclick="adminTab('${k}')">${v}</button>`,
        )
        .join("")}<button onclick="logout()">Log out</button></div>`,
    );
}
const _openAdmin = openAdmin;
openAdmin = async function () {
  if (!user) {
    openLogin();
    return;
  }
  if (user.role !== "admin") return toast("Administrator access required.");
  openModal(
    '<div class="eyebrow">BAKERY OPERATIONS</div><h2>Admin dashboard.</h2><div class="admin-tabs">' +
      [
        ["overview", "Overview"],
        ["products", "Products"],
        ["orders", "Orders"],
        ["customers", "Customers"],
        ["reports", "Reports"],
      ]
        .map(
          ([k, v]) =>
            `<button data-tab="${k}" onclick="adminTab('${k}')">${v}</button>`,
        )
        .join("") +
      '<button onclick="logout()">Log out</button></div><div id="admin-root"><p>Loading bakery overview...</p></div>',
  );
  await adminTab("overview");
};
async function init() {
  $("#year").textContent = new Date().getFullYear();
  updateCartCount();
  $("#search").addEventListener("input", debounce(loadProducts, 250));
  $("#sort").addEventListener("change", loadProducts);
  try {
    user = (await api("/me")).user;
  } catch {}
  await loadProducts();
}
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
init();
