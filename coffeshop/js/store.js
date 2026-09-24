/* store.js — persistence layer (localStorage) + money helpers.
   Everything the app knows lives under these three keys. */
(function () {
  'use strict';

  var KEYS = {
    settings: 'cs.settings.v1',
    products: 'cs.products.v1',
    orders:   'cs.orders.v1',
    held:     'cs.held.v1'
  };

  var DEFAULT_SETTINGS = {
    lang: 'en',
    bilingualReceipt: true,
    shopName: 'Candiz',
    tagline: 'Coffee & Desserts',
    branch: 'Main Branch',
    phone: '+968 9517 0769',
    address: '',
    vatNumber: '',
    currency: 'OMR',
    decimals: 3,
    vatRate: 5,
    vatInclusive: true,
    serviceCharge: 0,
    footer: 'Thank you for your visit — see you soon!',
    receiptWidth: 80,
    nextOrderNo: 1,
    openingCash: 0
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var val = JSON.parse(raw);
      return val === null || val === undefined ? fallback : val;
    } catch (e) {
      console.warn('Could not read ' + key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      alert('Could not save data — browser storage is full or blocked.');
      console.error(e);
      return false;
    }
  }

  var Store = {
    /* ---------- settings ---------- */
    getSettings: function () {
      var s = read(KEYS.settings, {});
      var out = {};
      for (var k in DEFAULT_SETTINGS) out[k] = (s[k] === undefined ? DEFAULT_SETTINGS[k] : s[k]);
      return out;
    },
    saveSettings: function (s) { return write(KEYS.settings, s); },

    /* ---------- products ---------- */
    getProducts: function () {
      var p = read(KEYS.products, null);
      if (!p || !p.length) {
        p = (window.DEFAULT_MENU || []).map(function (x) {
          return { id: x.id, name: x.name, ar: x.ar, cat: x.cat, sub: x.sub,
                   price: x.price, cost: x.cost, img: x.img, active: true };
        });
        write(KEYS.products, p);
        return p;
      }
      /* Products saved by an older version get Arabic names and photos
         backfilled from the seed menu, matched on id. Bundled photo paths are
         re-synced too, so images removed from the app stop being referenced —
         but a photo the shop uploaded itself (a data: URL) is never touched. */
      var seed = {};
      (window.DEFAULT_MENU || []).forEach(function (x) { seed[x.id] = x; });
      var changed = false;
      p.forEach(function (x) {
        var s = seed[x.id];
        if (!s) return;
        if (x.ar === undefined) { x.ar = s.ar; changed = true; }
        var ownPhoto = typeof x.img === 'string' && x.img.indexOf('data:') === 0;
        if (!ownPhoto && x.img !== s.img) { x.img = s.img; changed = true; }
      });
      if (changed) write(KEYS.products, p);
      return p;
    },
    saveProducts: function (p) { return write(KEYS.products, p); },
    resetProducts: function () {
      localStorage.removeItem(KEYS.products);
      return Store.getProducts();
    },

    /* ---------- orders ---------- */
    getOrders: function () { return read(KEYS.orders, []); },
    saveOrders: function (o) { return write(KEYS.orders, o); },
    addOrder: function (order) {
      var all = Store.getOrders();
      all.unshift(order);
      Store.saveOrders(all);
      return order;
    },
    updateOrder: function (id, patch) {
      var all = Store.getOrders();
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) {
          for (var k in patch) all[i][k] = patch[k];
          Store.saveOrders(all);
          return all[i];
        }
      }
      return null;
    },

    /* ---------- held (parked) tickets ---------- */
    getHeld: function () { return read(KEYS.held, []); },
    saveHeld: function (h) { return write(KEYS.held, h); },

    /* ---------- danger zone ---------- */
    clearOrders: function () { localStorage.removeItem(KEYS.orders); },
    factoryReset: function () {
      Object.keys(KEYS).forEach(function (k) { localStorage.removeItem(KEYS[k]); });
    },

    exportAll: function () {
      return {
        exportedAt: new Date().toISOString(),
        settings: Store.getSettings(),
        products: Store.getProducts(),
        orders: Store.getOrders()
      };
    },
    importAll: function (data) {
      if (!data || typeof data !== 'object') throw new Error('Invalid backup file.');
      if (data.settings) write(KEYS.settings, data.settings);
      if (data.products) write(KEYS.products, data.products);
      if (data.orders) write(KEYS.orders, data.orders);
    },

    KEYS: KEYS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };

  /* ---------- money ---------- */
  var Money = {
    decimals: function () { return Store.getSettings().decimals; },

    /* Round to the currency's smallest unit — avoids 0.1+0.2 style drift. */
    round: function (n, dp) {
      dp = (dp === undefined) ? Money.decimals() : dp;
      var f = Math.pow(10, dp);
      return Math.round((Number(n) + Number.EPSILON) * f) / f;
    },

    fmt: function (n) {
      var dp = Money.decimals();
      var v = Money.round(n, dp);
      return (v < 0 ? '-' : '') + Math.abs(v).toFixed(dp);
    },

    withCurrency: function (n) {
      return Store.getSettings().currency + ' ' + Money.fmt(n);
    }
  };

  /* ---------- order maths ----------
     Menu prices are gross (what the customer pays). Discount comes off the
     gross total; VAT is then either extracted from it (inclusive) or added
     on top (exclusive), per Settings. */
  function calcTotals(items, discount, settings) {
    settings = settings || Store.getSettings();
    discount = discount || { type: 'none', value: 0 };

    var gross = 0, costTotal = 0, units = 0;
    items.forEach(function (it) {
      gross += it.price * it.qty;
      costTotal += (it.cost || 0) * it.qty;
      units += it.qty;
    });
    gross = Money.round(gross);

    var discountAmount = 0;
    if (discount.type === 'percent') discountAmount = gross * (Number(discount.value) || 0) / 100;
    else if (discount.type === 'amount') discountAmount = Number(discount.value) || 0;
    discountAmount = Money.round(Math.min(Math.max(discountAmount, 0), gross));

    var afterDiscount = Money.round(gross - discountAmount);

    var service = Money.round(afterDiscount * (Number(settings.serviceCharge) || 0) / 100);
    var taxable = Money.round(afterDiscount + service);

    var rate = (Number(settings.vatRate) || 0) / 100;
    var vat, total, net;
    if (settings.vatInclusive) {
      net = Money.round(taxable / (1 + rate));
      vat = Money.round(taxable - net);
      total = taxable;
    } else {
      net = taxable;
      vat = Money.round(taxable * rate);
      total = Money.round(taxable + vat);
    }

    return {
      units: units,
      gross: gross,
      discountAmount: discountAmount,
      service: service,
      net: net,                                  // revenue excluding VAT
      vat: vat,
      total: total,                              // what the customer pays
      cost: Money.round(costTotal),
      profit: Money.round(net - costTotal)       // margin on the net figure
    };
  }

  window.Store = Store;
  window.Money = Money;
  window.calcTotals = calcTotals;
})();
