/* settings.js — shop details, tax, receipt options, backup/restore, demo data. */
(function () {
  'use strict';

  var el = {};
  function $(id) { return document.getElementById(id); }

  var FIELDS = [
    ['setName', 'shopName', 'text'],
    ['setTagline', 'tagline', 'text'],
    ['setBranch', 'branch', 'text'],
    ['setPhone', 'phone', 'text'],
    ['setAddress', 'address', 'text'],
    ['setVatNo', 'vatNumber', 'text'],
    ['setCurrency', 'currency', 'text'],
    ['setDecimals', 'decimals', 'number'],
    ['setVat', 'vatRate', 'number'],
    ['setVatIncl', 'vatInclusive', 'bool'],
    ['setService', 'serviceCharge', 'number'],
    ['setWidth', 'receiptWidth', 'text'],
    ['setFooter', 'footer', 'text'],
    ['setNextNo', 'nextOrderNo', 'number'],
    ['setBilingual', 'bilingualReceipt', 'bool']
  ];

  function load() {
    var s = Store.getSettings();
    FIELDS.forEach(function (f) {
      var node = $(f[0]);
      if (!node) return;
      if (f[2] === 'bool') node.checked = !!s[f[1]];
      else node.value = s[f[1]];
    });
  }

  function save() {
    var s = Store.getSettings();
    FIELDS.forEach(function (f) {
      var node = $(f[0]);
      if (!node) return;
      if (f[2] === 'bool') s[f[1]] = node.checked;
      else if (f[2] === 'number') s[f[1]] = Number(node.value) || 0;
      else s[f[1]] = node.value.trim();
    });

    s.decimals = Math.min(3, Math.max(0, Math.round(s.decimals)));
    if (s.nextOrderNo < 1) s.nextOrderNo = 1;
    if (!s.currency) s.currency = 'OMR';

    Store.saveSettings(s);
    App.applyBranding();
    App.refreshAll();

    $('saveMsg').textContent = I18N.t('saved');
    setTimeout(function () { $('saveMsg').textContent = ''; }, 2200);
  }

  /* A believable month of trading so the reports have something to show. */
  function generateDemo() {
    if (!confirm('Add 30 days of sample sales so you can see the reports working?\n\nThis creates fake orders — delete them later with "Delete all orders".')) return;

    var products = Store.getProducts().filter(function (p) { return p.active !== false; });
    if (!products.length) { App.toast('Add some products first.', 'bad'); return; }

    var s = Store.getSettings();
    var orders = Store.getOrders();
    var no = Number(s.nextOrderNo);
    var methods = ['Cash', 'Cash', 'Cash', 'Card', 'Card', 'Transfer'];
    var types = ['Dine-in', 'Takeaway', 'Takeaway', 'Delivery'];

    for (var back = 29; back >= 0; back--) {
      var day = new Date();
      day.setDate(day.getDate() - back);
      var weekend = (day.getDay() === 5 || day.getDay() === 6);   // Fri/Sat busier
      var count = Math.round((weekend ? 34 : 22) + Math.random() * 14);

      for (var i = 0; i < count; i++) {
        // Trading roughly 08:00–23:00, busiest late afternoon/evening.
        var hour = 8 + Math.floor(Math.pow(Math.random(), 0.65) * 15);
        var ts = new Date(day);
        ts.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
        if (ts.getTime() > Date.now()) continue;

        var items = [];
        var lines = 1 + Math.floor(Math.random() * 3);
        for (var j = 0; j < lines; j++) {
          var p = products[Math.floor(Math.random() * products.length)];
          if (items.some(function (x) { return x.id === p.id; })) continue;
          items.push({
            id: p.id, name: p.name, ar: p.ar, price: p.price, cost: p.cost || 0,
            qty: 1 + Math.floor(Math.random() * 2), cat: p.cat, sub: p.sub
          });
        }
        if (!items.length) continue;

        var disc = Math.random() < 0.08 ? { type: 'percent', value: 10 } : { type: 'none', value: 0 };
        var t = calcTotals(items, disc, s);
        var method = methods[Math.floor(Math.random() * methods.length)];

        orders.push({
          id: 'demo_' + ts.getTime() + '_' + i,
          no: String(no++).padStart(4, '0'),
          ts: ts.getTime(),
          type: types[Math.floor(Math.random() * types.length)],
          items: items,
          discount: disc,
          totals: t,
          payment: {
            method: method,
            received: method === 'Cash' ? Money.round(Math.ceil(t.total)) : t.total,
            change: method === 'Cash' ? Money.round(Math.ceil(t.total) - t.total) : 0
          },
          customer: '',
          status: 'completed',
          demo: true
        });
      }
    }

    orders.sort(function (a, b) { return b.ts - a.ts; });
    Store.saveOrders(orders);
    s.nextOrderNo = no;
    Store.saveSettings(s);
    load();
    App.toast('Sample sales created — open Reports.', 'good');
    App.refreshAll();
  }

  function init() {
    ['saveSettings', 'testPrint', 'backupBtn', 'restoreBtn', 'restoreFile',
     'demoBtn', 'clearOrdersBtn', 'resetAllBtn'].forEach(function (k) { el[k] = $(k); });

    el.saveSettings.addEventListener('click', save);

    el.testPrint.addEventListener('click', function () {
      var products = Store.getProducts();
      var sample = products.slice(0, 3).map(function (p) {
        return { id: p.id, name: p.name, ar: p.ar, price: p.price, cost: p.cost || 0,
                 qty: 1, cat: p.cat, sub: p.sub };
      });
      if (!sample.length) { App.toast('Add products first.', 'bad'); return; }
      var t = calcTotals(sample, { type: 'none', value: 0 });
      Receipt.print({
        no: 'TEST', ts: Date.now(), type: 'Dine-in', items: sample,
        totals: t, payment: { method: 'Cash', received: t.total, change: 0 },
        customer: '', status: 'completed'
      });
    });

    el.backupBtn.addEventListener('click', function () {
      var data = Store.exportAll();
      App.download('candiz-pos-backup-' + Orders.ymd(Date.now()) + '.json',
                   JSON.stringify(data, null, 2), 'application/json');
    });

    el.restoreBtn.addEventListener('click', function () { el.restoreFile.click(); });
    el.restoreFile.addEventListener('change', function () {
      var file = el.restoreFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!confirm('Restore this backup? It replaces the current products, orders and settings.')) return;
          Store.importAll(data);
          load();
          App.applyBranding();
          App.refreshAll();
          App.toast('Backup restored.', 'good');
        } catch (e) {
          App.toast('That file is not a valid backup.', 'bad');
        }
      };
      reader.readAsText(file);
      el.restoreFile.value = '';
    });

    el.demoBtn.addEventListener('click', generateDemo);

    el.clearOrdersBtn.addEventListener('click', function () {
      if (!confirm('Delete every order in the history?\n\nProducts and settings are kept. This cannot be undone.')) return;
      Store.clearOrders();
      App.toast('All orders deleted.', 'good');
      App.refreshAll();
    });

    el.resetAllBtn.addEventListener('click', function () {
      if (!confirm('Factory reset — orders, products and settings all go back to defaults.\n\nContinue?')) return;
      if (!confirm('Really sure? This cannot be undone.')) return;
      Store.factoryReset();
      location.reload();
    });

    load();
  }

  window.Settings = { init: init, refresh: load };
})();
