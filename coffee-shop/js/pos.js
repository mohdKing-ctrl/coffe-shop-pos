/* pos.js — the register: product grid with photos, cart, payment. */
(function () {
  'use strict';

  var state = {
    cat: null,          // active category, null = all
    sub: null,          // active sub-category, null = all
    query: '',
    cart: [],           // {id,name,ar,price,cost,qty,img}
    type: 'Dine-in',
    discount: { type: 'none', value: 0 },
    payMethod: 'Cash'
  };

  var el = {};
  function $(id) { return document.getElementById(id); }
  function t(k) { return I18N.t(k); }

  function accentFor(cat) {
    var m = (window.CATEGORY_META || []).filter(function (c) { return c.name === cat; })[0];
    return m ? m.accent : '#7d6f65';
  }
  function iconFor(cat) {
    var m = (window.CATEGORY_META || []).filter(function (c) { return c.name === cat; })[0];
    return m ? m.icon : '•';
  }

  function categories() {
    var products = Store.getProducts();
    var seen = [], order = (window.CATEGORY_META || []).map(function (c) { return c.name; });
    products.forEach(function (p) { if (seen.indexOf(p.cat) < 0) seen.push(p.cat); });
    seen.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia < 0) ia = 99; if (ib < 0) ib = 99;
      return ia - ib || a.localeCompare(b);
    });
    return seen;
  }

  /* ---------------- rendering ---------------- */

  function renderCatTabs() {
    var cats = categories();
    var html = '<button class="cat-tab' + (state.cat === null ? ' active' : '') + '" data-cat="">' +
               escHtml(t('all_items')) + '</button>';
    cats.forEach(function (c) {
      html += '<button class="cat-tab' + (state.cat === c ? ' active' : '') + '" data-cat="' + escAttr(c) + '">' +
              '<span>' + iconFor(c) + '</span>' + escHtml(I18N.catName(c)) + '</button>';
    });
    el.catTabs.innerHTML = html;
  }

  function renderSubTabs() {
    if (!state.cat) { el.subTabs.innerHTML = ''; return; }
    var subs = [];
    Store.getProducts().forEach(function (p) {
      if (p.cat === state.cat && subs.indexOf(p.sub) < 0) subs.push(p.sub);
    });
    var html = '<button class="sub-tab' + (state.sub === null ? ' active' : '') + '" data-sub="">' +
               escHtml(t('all')) + '</button>';
    subs.forEach(function (s) {
      html += '<button class="sub-tab' + (state.sub === s ? ' active' : '') + '" data-sub="' + escAttr(s) + '">' +
              escHtml(I18N.subName(s)) + '</button>';
    });
    el.subTabs.innerHTML = html;
  }

  function visibleProducts() {
    var q = state.query.trim().toLowerCase();
    return Store.getProducts().filter(function (p) {
      if (p.active === false) return false;
      if (q) return (p.name + ' ' + (p.ar || '') + ' ' + p.cat + ' ' + p.sub).toLowerCase().indexOf(q) >= 0;
      if (state.cat && p.cat !== state.cat) return false;
      if (state.sub && p.sub !== state.sub) return false;
      return true;
    });
  }

  /* No photo yet — show the category icon on a tint of its accent colour,
     so the tile still looks deliberate. */
  function photoHtml(p) {
    if (p.img) {
      return '<img class="t-img" src="' + escAttr(p.img) + '" alt="" ' +
             'onerror="this.classList.add(\'broken\')">';
    }
    return '<div class="t-placeholder">' + iconFor(p.cat) + '</div>';
  }

  function renderGrid() {
    var list = visibleProducts();
    if (!list.length) {
      el.grid.innerHTML = '<div class="grid-empty">' + escHtml(t('no_match')) +
                          ' “' + escHtml(state.query) + '”.</div>';
      return;
    }
    var inCart = {};
    state.cart.forEach(function (l) { inCart[l.id] = l.qty; });

    el.grid.innerHTML = list.map(function (p) {
      var badge = inCart[p.id] ? '<span class="t-badge">' + inCart[p.id] + '</span>' : '';
      return '<button class="tile" data-id="' + p.id + '">' +
        '<div class="t-photo" style="--accent-cat:' + accentFor(p.cat) + '">' + photoHtml(p) + badge + '</div>' +
        '<div class="t-body">' +
          '<div class="t-name">' + escHtml(I18N.pname(p)) + '</div>' +
          '<div class="t-foot"><span class="t-sub">' + escHtml(I18N.subName(p.sub)) + '</span>' +
          '<span class="t-price">' + Money.fmt(p.price) + '</span></div>' +
        '</div></button>';
    }).join('');
  }

  function renderCart() {
    if (!state.cart.length) {
      el.cartItems.innerHTML =
        '<div class="empty-cart"><div class="empty-ico">🧾</div><p>' + escHtml(t('no_items_yet')) + '</p>' +
        '<span>' + escHtml(t('tap_to_start')) + '</span></div>';
    } else {
      el.cartItems.innerHTML = state.cart.map(function (l, i) {
        var thumb = l.img
          ? '<img class="line-img" src="' + escAttr(l.img) + '" alt="" onerror="this.style.visibility=\'hidden\'">'
          : '<div class="line-img"></div>';
        return '<div class="line">' +
          thumb +
          '<div class="line-name">' + escHtml(I18N.pname(l)) + '</div>' +
          '<div class="line-total">' + Money.fmt(l.price * l.qty) + '</div>' +
          '<div class="line-meta">' + Money.fmt(l.price) + ' ' + escHtml(t('each')) + '</div>' +
          '<div class="line-qty">' +
            '<button class="qbtn ' + (l.qty === 1 ? 'del' : '') + '" data-act="dec" data-i="' + i + '">' +
              (l.qty === 1 ? '×' : '−') + '</button>' +
            '<span class="qty">' + l.qty + '</span>' +
            '<button class="qbtn" data-act="inc" data-i="' + i + '">+</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    renderTotals();
    renderGrid();
  }

  function totals() { return calcTotals(state.cart, state.discount); }

  function renderTotals() {
    var tt = totals(), s = Store.getSettings();
    var unitWord = tt.units === 1 ? t('item') : t('items');
    var rows = '<div class="trow"><span>' + escHtml(t('subtotal')) + ' (' + tt.units + ' ' + escHtml(unitWord) +
               ')</span><span>' + Money.fmt(tt.gross) + '</span></div>';
    if (tt.discountAmount > 0) {
      rows += '<div class="trow discount"><span>' + escHtml(t('discount')) + '</span><span>−' +
              Money.fmt(tt.discountAmount) + '</span></div>';
    }
    if (tt.service > 0) {
      rows += '<div class="trow"><span>' + escHtml(t('service')) + ' ' + s.serviceCharge +
              '%</span><span>' + Money.fmt(tt.service) + '</span></div>';
    }
    rows += '<div class="trow"><span>' + escHtml(t('vat')) + ' ' + s.vatRate + '%' +
            (s.vatInclusive ? ' (' + escHtml(t('included')) + ')' : '') + '</span><span>' +
            Money.fmt(tt.vat) + '</span></div>';
    rows += '<div class="trow grand"><span>' + escHtml(t('total')) + '</span><span>' +
            Money.fmt(tt.total) + '</span></div>';
    el.totals.innerHTML = rows;

    el.payAmount.textContent = Money.fmt(tt.total);
    el.payBtn.disabled = state.cart.length === 0;
    el.orderNoLabel.textContent = '#' + String(Store.getSettings().nextOrderNo).padStart(4, '0');
    el.heldCount.textContent = Store.getHeld().length;
  }

  /* ---------------- cart operations ---------------- */

  function add(id) {
    var p = Store.getProducts().filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var line = state.cart.filter(function (l) { return l.id === id; })[0];
    if (line) line.qty++;
    else state.cart.push({ id: p.id, name: p.name, ar: p.ar, price: p.price, cost: p.cost || 0,
                           qty: 1, cat: p.cat, sub: p.sub, img: p.img });
    renderCart();
  }

  function bump(i, delta) {
    var l = state.cart[i];
    if (!l) return;
    l.qty += delta;
    if (l.qty <= 0) state.cart.splice(i, 1);
    renderCart();
  }

  function clearCart() {
    state.cart = [];
    state.discount = { type: 'none', value: 0 };
    el.discType.value = 'none';
    el.discValue.value = 0;
    el.discValue.disabled = true;
    renderCart();
  }

  /* ---------------- payment ---------------- */

  function openPay() {
    if (!state.cart.length) return;
    var tt = totals();
    el.payDue.textContent = Money.fmt(tt.total);
    el.cashIn.value = '';
    el.custNote.value = '';
    el.changeOut.textContent = Money.fmt(0);
    setMethod('Cash');
    renderQuickCash(tt.total);
    App.openModal('payModal');
    setTimeout(function () { el.cashIn.focus(); }, 60);
  }

  function renderQuickCash(due) {
    var exact = Money.round(due);
    var steps = [exact];
    [1, 2, 5, 10, 20, 50].forEach(function (n) { if (n > exact) steps.push(n); });
    steps = steps.slice(0, 6);
    el.quickCash.innerHTML = steps.map(function (v, i) {
      return '<button data-v="' + v + '">' + (i === 0 ? escHtml(t('exact')) + ' ' : '') + Money.fmt(v) + '</button>';
    }).join('');
  }

  function setMethod(m) {
    state.payMethod = m;
    Array.prototype.forEach.call(el.payMethod.children, function (b) {
      b.classList.toggle('active', b.dataset.method === m);
    });
    el.cashPane.style.display = (m === 'Cash') ? '' : 'none';
  }

  function updateChange() {
    var due = totals().total;
    var got = Number(el.cashIn.value) || 0;
    var ch = Money.round(got - due);
    el.changeOut.textContent = Money.fmt(ch > 0 ? ch : 0);
    el.changeOut.style.color = (got > 0 && got < due) ? 'var(--red)' : '';
  }

  function completeSale() {
    var tt = totals();
    var s = Store.getSettings();
    var received = state.payMethod === 'Cash' ? (Number(el.cashIn.value) || tt.total) : tt.total;

    if (state.payMethod === 'Cash' && received < tt.total - 1e-9) {
      App.toast(t('short_cash'), 'bad');
      return;
    }

    var order = {
      id: 'o_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      no: String(s.nextOrderNo).padStart(4, '0'),
      ts: Date.now(),
      type: state.type,
      items: state.cart.map(function (l) {
        return { id: l.id, name: l.name, ar: l.ar, price: l.price, cost: l.cost,
                 qty: l.qty, cat: l.cat, sub: l.sub };
      }),
      discount: { type: state.discount.type, value: Number(state.discount.value) || 0 },
      totals: tt,
      payment: {
        method: state.payMethod,
        received: Money.round(received),
        change: Money.round(Math.max(received - tt.total, 0))
      },
      customer: el.custNote.value.trim(),
      status: 'completed'
    };

    Store.addOrder(order);
    s.nextOrderNo = Number(s.nextOrderNo) + 1;
    Store.saveSettings(s);

    App.closeModal('payModal');
    clearCart();
    App.toast(t('order_done') + ' #' + order.no + ' — ' + Money.withCurrency(order.totals.total), 'good');
    Receipt.print(order);
    App.refreshAll();
  }

  /* ---------------- held tickets ---------------- */

  function holdTicket() {
    if (!state.cart.length) return;
    var held = Store.getHeld();
    held.push({
      id: 'h_' + Date.now(),
      ts: Date.now(),
      type: state.type,
      discount: state.discount,
      items: state.cart.slice()
    });
    Store.saveHeld(held);
    clearCart();
    App.toast(t('ticket_held'), 'good');
    renderTotals();
  }

  function renderHeld() {
    var held = Store.getHeld();
    if (!held.length) { el.heldList.innerHTML = '<p class="muted">' + escHtml(t('no_held')) + '</p>'; return; }
    el.heldList.innerHTML = held.map(function (h) {
      var tt = calcTotals(h.items, h.discount);
      var d = new Date(h.ts);
      return '<div class="held-card">' +
        '<div><div class="strong">' + tt.units + ' ' + escHtml(t('items')) + ' · ' + Money.fmt(tt.total) + '</div>' +
        '<div class="h-meta">' + escHtml(I18N.typeName(h.type)) + ' · ' + escHtml(t('held_at')) + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</div></div>' +
        '<div style="display:flex;gap:7px">' +
          '<button class="btn ghost small" data-drop="' + h.id + '">' + escHtml(t('delete_')) + '</button>' +
          '<button class="btn primary small" data-resume="' + h.id + '">' + escHtml(t('resume')) + '</button>' +
        '</div></div>';
    }).join('');
  }

  /* ---------------- helpers ---------------- */
  function escHtml(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }

  /* ---------------- wiring ---------------- */

  function init() {
    ['catTabs', 'subTabs', 'grid', 'cartItems', 'totals', 'payAmount', 'payBtn', 'orderNoLabel',
     'search', 'discType', 'discValue', 'orderType', 'clearCart', 'holdBtn', 'heldBtn', 'heldCount',
     'heldList', 'payDue', 'cashIn', 'changeOut', 'quickCash', 'payMethod', 'cashPane',
     'custNote', 'confirmPay'].forEach(function (k) { el[k] = $(k); });

    el.catTabs.addEventListener('click', function (e) {
      var b = e.target.closest('.cat-tab'); if (!b) return;
      state.cat = b.dataset.cat || null;
      state.sub = null;
      state.query = ''; el.search.value = '';
      renderCatTabs(); renderSubTabs(); renderGrid();
    });

    el.subTabs.addEventListener('click', function (e) {
      var b = e.target.closest('.sub-tab'); if (!b) return;
      state.sub = b.dataset.sub || null;
      renderSubTabs(); renderGrid();
    });

    el.grid.addEventListener('click', function (e) {
      var b = e.target.closest('.tile'); if (!b) return;
      add(Number(b.dataset.id));
    });

    el.cartItems.addEventListener('click', function (e) {
      var b = e.target.closest('.qbtn'); if (!b) return;
      bump(Number(b.dataset.i), b.dataset.act === 'inc' ? 1 : -1);
    });

    el.search.addEventListener('input', function () {
      state.query = el.search.value;
      renderGrid();
    });

    el.orderType.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.type = b.dataset.type;
      Array.prototype.forEach.call(el.orderType.children, function (x) { x.classList.toggle('active', x === b); });
    });

    el.discType.addEventListener('change', function () {
      state.discount.type = el.discType.value;
      el.discValue.disabled = (el.discType.value === 'none');
      if (el.discType.value === 'none') { el.discValue.value = 0; state.discount.value = 0; }
      renderTotals();
    });
    el.discValue.addEventListener('input', function () {
      state.discount.value = Number(el.discValue.value) || 0;
      renderTotals();
    });

    el.clearCart.addEventListener('click', function () {
      if (!state.cart.length) return;
      if (confirm(t('confirm_clear'))) clearCart();
    });

    el.holdBtn.addEventListener('click', holdTicket);
    el.payBtn.addEventListener('click', openPay);

    el.heldBtn.addEventListener('click', function () { renderHeld(); App.openModal('heldModal'); });
    el.heldList.addEventListener('click', function (e) {
      var r = e.target.closest('[data-resume]'), d = e.target.closest('[data-drop]');
      var held = Store.getHeld();
      if (r) {
        var h = held.filter(function (x) { return x.id === r.dataset.resume; })[0];
        if (h) {
          state.cart = h.items;
          state.type = h.type;
          state.discount = h.discount || { type: 'none', value: 0 };
          el.discType.value = state.discount.type;
          el.discValue.value = state.discount.value;
          el.discValue.disabled = state.discount.type === 'none';
          Array.prototype.forEach.call(el.orderType.children, function (x) {
            x.classList.toggle('active', x.dataset.type === h.type);
          });
          Store.saveHeld(held.filter(function (x) { return x.id !== h.id; }));
          App.closeModal('heldModal');
          renderCart();
        }
      } else if (d) {
        Store.saveHeld(held.filter(function (x) { return x.id !== d.dataset.drop; }));
        renderHeld(); renderTotals();
      }
    });

    el.payMethod.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      setMethod(b.dataset.method);
    });
    el.cashIn.addEventListener('input', updateChange);
    el.quickCash.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      el.cashIn.value = b.dataset.v;
      updateChange();
    });
    el.confirmPay.addEventListener('click', completeSale);

    $('payModal').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); completeSale(); }
    });

    renderCatTabs(); renderSubTabs(); renderCart();
  }

  window.POS = {
    init: init,
    refresh: function () { renderCatTabs(); renderSubTabs(); renderCart(); },
    focusSearch: function () { el.search.focus(); el.search.select(); },
    openPay: openPay,
    hasItems: function () { return state.cart.length > 0; }
  };
})();
