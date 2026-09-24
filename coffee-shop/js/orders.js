/* orders.js — order history: browse, reprint, void, export to Excel. */
(function () {
  'use strict';

  var filter = { date: null, q: '' };   // date === null means "all dates"
  var el = {};
  function $(id) { return document.getElementById(id); }
  function t(k) { return I18N.t(k); }

  function ymd(ts) {
    var d = new Date(ts), p = function (n) { return n < 10 ? '0' + n : n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function hhmm(ts) {
    var d = new Date(ts), p = function (n) { return n < 10 ? '0' + n : n; };
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function escHtml(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function matching() {
    var q = filter.q.trim().toLowerCase();
    return Store.getOrders().filter(function (o) {
      if (filter.date && ymd(o.ts) !== filter.date) return false;
      if (!q) return true;
      if (('#' + o.no).indexOf(q) >= 0 || o.no.indexOf(q) >= 0) return true;
      if ((o.customer || '').toLowerCase().indexOf(q) >= 0) return true;
      return o.items.some(function (i) {
        return i.name.toLowerCase().indexOf(q) >= 0 || (i.ar || '').toLowerCase().indexOf(q) >= 0;
      });
    });
  }

  function render() {
    var list = matching();
    var live = list.filter(function (o) { return o.status !== 'voided'; });

    var revenue = live.reduce(function (a, o) { return a + o.totals.total; }, 0);
    var units = live.reduce(function (a, o) { return a + o.totals.units; }, 0);
    var avg = live.length ? revenue / live.length : 0;

    el.ordSummary.innerHTML =
      mini(t('th_no'), live.length) +
      mini(t('units_sold'), units) +
      mini(t('revenue'), Money.withCurrency(revenue)) +
      mini(t('avg_ticket'), Money.withCurrency(avg)) +
      mini(t('voided'), list.length - live.length);

    var tb = el.ordTable.querySelector('tbody');
    if (!list.length) {
      tb.innerHTML = '<tr class="empty"><td colspan="8">' + escHtml(t('no_orders')) + '</td></tr>';
      return;
    }

    tb.innerHTML = list.map(function (o) {
      var voided = o.status === 'voided';
      var summary = o.items.map(function (i) { return i.qty + '× ' + I18N.pname(i); }).join(', ');
      return '<tr class="' + (voided ? 'row-void' : '') + '">' +
        '<td class="strong">#' + escHtml(o.no) + '</td>' +
        '<td>' + ymd(o.ts) + ' ' + hhmm(o.ts) + '</td>' +
        '<td>' + escHtml(I18N.typeName(o.type)) + '</td>' +
        '<td class="num" title="' + escHtml(summary) + '">' + o.totals.units + '</td>' +
        '<td class="num strong">' + Money.fmt(o.totals.total) + '</td>' +
        '<td>' + escHtml(I18N.methodName(o.payment.method)) + '</td>' +
        '<td>' + (voided
          ? '<span class="tag void">' + escHtml(t('voided')) + '</span>'
          : '<span class="tag ok">' + escHtml(t('paid')) + '</span>') + '</td>' +
        '<td style="text-align:end;white-space:nowrap">' +
          '<button class="btn ghost small" data-reprint="' + o.id + '">' + escHtml(t('reprint')) + '</button> ' +
          (voided ? '' : '<button class="btn ghost small danger" data-void="' + o.id + '">' + escHtml(t('void_')) + '</button>') +
        '</td></tr>';
    }).join('');
  }

  function mini(label, value) {
    return '<div class="mini"><span>' + escHtml(label) + '</span><strong>' + escHtml(value) + '</strong></div>';
  }

  /* ---------------- Excel ---------------- */

  function exportExcel() {
    var list = matching();
    if (!list.length) { App.toast(t('nothing_export'), 'bad'); return; }

    var s = Store.getSettings();
    var S = XLSX.S;
    var rtl = I18N.isRTL();
    var cur = s.currency;
    var sorted = list.slice().sort(function (a, b) { return a.ts - b.ts; });

    /* --- Sheet 1: one row per order --- */
    var head1 = [
      t('th_no'), t('th_date'), t('th_time'), t('th_type'), t('th_payment'),
      t('th_items'), t('subtotal'), t('discount'), t('k_net'), t('vat'),
      t('th_total') + ' (' + cur + ')', t('cash_received'), t('change'),
      t('k_cost'), t('k_profit'), t('r_customer'), t('th_status')
    ].map(function (h) { return { v: h, s: S.HEAD }; });

    var rows1 = [head1];
    sorted.forEach(function (o) {
      var voided = o.status === 'voided';
      rows1.push([
        '#' + o.no,
        ymd(o.ts),
        hhmm(o.ts),
        I18N.typeName(o.type),
        I18N.methodName(o.payment.method),
        o.totals.units,
        { v: o.totals.gross, s: S.MONEY },
        { v: o.totals.discountAmount, s: S.MONEY },
        { v: o.totals.net, s: S.MONEY },
        { v: o.totals.vat, s: S.MONEY },
        { v: o.totals.total, s: S.MONEY_B },
        { v: o.payment.received || 0, s: S.MONEY },
        { v: o.payment.change || 0, s: S.MONEY },
        { v: o.totals.cost, s: S.MONEY },
        { v: o.totals.profit, s: S.MONEY },
        o.customer || '',
        voided ? t('voided') : t('paid')
      ]);
    });

    /* Totals row — live orders only, so voided sales never inflate it. */
    var live = sorted.filter(function (o) { return o.status !== 'voided'; });
    var sum = function (f) { return Money.round(live.reduce(function (a, o) { return a + f(o); }, 0)); };
    rows1.push([]);
    rows1.push([
      { v: t('total'), s: S.HEAD }, '', '', '', '',
      { v: live.reduce(function (a, o) { return a + o.totals.units; }, 0), s: S.HEAD },
      { v: sum(function (o) { return o.totals.gross; }), s: S.MONEY_B },
      { v: sum(function (o) { return o.totals.discountAmount; }), s: S.MONEY_B },
      { v: sum(function (o) { return o.totals.net; }), s: S.MONEY_B },
      { v: sum(function (o) { return o.totals.vat; }), s: S.MONEY_B },
      { v: sum(function (o) { return o.totals.total; }), s: S.MONEY_B },
      '', '',
      { v: sum(function (o) { return o.totals.cost; }), s: S.MONEY_B },
      { v: sum(function (o) { return o.totals.profit; }), s: S.MONEY_B },
      '', ''
    ]);

    /* --- Sheet 2: one row per item sold --- */
    var head2 = [
      t('th_no'), t('th_date'), t('th_time'), t('th_product'), t('name_ar'),
      t('th_category'), t('th_sub'), t('th_units'), t('th_price'),
      t('th_total'), t('th_cost'), t('th_profit')
    ].map(function (h) { return { v: h, s: S.HEAD }; });

    var rows2 = [head2];
    sorted.forEach(function (o) {
      if (o.status === 'voided') return;
      o.items.forEach(function (it) {
        var lineTotal = Money.round(it.price * it.qty);
        var lineCost = Money.round((it.cost || 0) * it.qty);
        rows2.push([
          '#' + o.no, ymd(o.ts), hhmm(o.ts),
          it.name, it.ar || '',
          I18N.catName(it.cat || '', 'en'), it.sub || '',
          it.qty,
          { v: it.price, s: S.MONEY },
          { v: lineTotal, s: S.MONEY },
          { v: lineCost, s: S.MONEY },
          { v: Money.round(lineTotal - lineCost), s: S.MONEY }
        ]);
      });
    });

    /* --- Sheet 3: totals per product --- */
    var byProduct = {};
    sorted.forEach(function (o) {
      if (o.status === 'voided') return;
      var factor = o.totals.gross > 0 ? (o.totals.gross - o.totals.discountAmount) / o.totals.gross : 1;
      o.items.forEach(function (it) {
        var k = it.id + '|' + it.name;
        if (!byProduct[k]) byProduct[k] = { name: it.name, ar: it.ar || '', cat: it.cat || '', sub: it.sub || '', units: 0, revenue: 0, cost: 0 };
        byProduct[k].units += it.qty;
        byProduct[k].revenue += it.price * it.qty * factor;
        byProduct[k].cost += (it.cost || 0) * it.qty;
      });
    });
    var head3 = [t('th_product'), t('name_ar'), t('th_category'), t('th_sub'),
                 t('th_units'), t('th_revenue'), t('th_cost'), t('th_profit')]
                .map(function (h) { return { v: h, s: S.HEAD }; });
    var rows3 = [head3];
    Object.keys(byProduct).map(function (k) { return byProduct[k]; })
      .sort(function (a, b) { return b.units - a.units; })
      .forEach(function (p) {
        rows3.push([p.name, p.ar, p.cat, p.sub, p.units,
          { v: Money.round(p.revenue), s: S.MONEY },
          { v: Money.round(p.cost), s: S.MONEY },
          { v: Money.round(p.revenue - p.cost), s: S.MONEY }]);
      });

    /* --- Sheet 4: totals per day --- */
    var byDay = {};
    sorted.forEach(function (o) {
      if (o.status === 'voided') return;
      var d = ymd(o.ts);
      if (!byDay[d]) byDay[d] = { orders: 0, units: 0, revenue: 0, net: 0, vat: 0, cost: 0, profit: 0 };
      var b = byDay[d];
      b.orders++; b.units += o.totals.units; b.revenue += o.totals.total;
      b.net += o.totals.net; b.vat += o.totals.vat; b.cost += o.totals.cost; b.profit += o.totals.profit;
    });
    var head4 = [t('th_date'), t('th_no'), t('th_units'), t('th_revenue'),
                 t('k_net'), t('vat'), t('k_cost'), t('k_profit')]
                .map(function (h) { return { v: h, s: S.HEAD }; });
    var rows4 = [head4];
    Object.keys(byDay).sort().forEach(function (d) {
      var b = byDay[d];
      rows4.push([d, b.orders, b.units,
        { v: Money.round(b.revenue), s: S.MONEY },
        { v: Money.round(b.net), s: S.MONEY },
        { v: Money.round(b.vat), s: S.MONEY },
        { v: Money.round(b.cost), s: S.MONEY },
        { v: Money.round(b.profit), s: S.MONEY }]);
    });

    var scope = filter.date ? filter.date : 'all';
    XLSX.save(
      (s.shopName || 'POS').replace(/[^\w؀-ۿ -]/g, '') + '-orders-' + scope + '.xlsx',
      [
        { name: t('orders_title'), rows: rows1, headerRows: 1, rtl: rtl,
          cols: [9, 12, 8, 12, 11, 8, 11, 10, 11, 10, 14, 13, 10, 11, 11, 16, 10] },
        { name: t('th_items'), rows: rows2, headerRows: 1, rtl: rtl,
          cols: [9, 12, 8, 28, 24, 14, 18, 8, 10, 11, 10, 10] },
        { name: t('th_product'), rows: rows3, headerRows: 1, rtl: rtl,
          cols: [28, 24, 14, 18, 9, 12, 11, 11] },
        { name: t('daily_revenue'), rows: rows4, headerRows: 1, rtl: rtl,
          cols: [12, 9, 9, 12, 12, 11, 11, 11] }
      ],
      { decimals: s.decimals }
    );

    App.toast(t('excel_saved'), 'good');
  }

  function init() {
    ['ordDate', 'ordSearch', 'ordAll', 'ordSummary', 'ordTable', 'ordExcel']
      .forEach(function (k) { el[k] = $(k); });

    el.ordDate.value = ymd(Date.now());
    filter.date = el.ordDate.value;

    el.ordDate.addEventListener('change', function () { filter.date = el.ordDate.value || null; render(); });
    el.ordAll.addEventListener('click', function () { el.ordDate.value = ''; filter.date = null; render(); });
    el.ordSearch.addEventListener('input', function () { filter.q = el.ordSearch.value; render(); });
    el.ordExcel.addEventListener('click', exportExcel);

    el.ordTable.addEventListener('click', function (e) {
      var rp = e.target.closest('[data-reprint]'), vd = e.target.closest('[data-void]');
      if (rp) {
        var o = Store.getOrders().filter(function (x) { return x.id === rp.dataset.reprint; })[0];
        if (o) Receipt.print(o, { reprint: true });
      } else if (vd) {
        if (!confirm(t('confirm_void'))) return;
        Store.updateOrder(vd.dataset.void, { status: 'voided', voidedAt: Date.now() });
        App.toast(t('order_voided'), 'good');
        App.refreshAll();
      }
    });

    render();
  }

  window.Orders = { init: init, refresh: render, ymd: ymd, exportExcel: exportExcel };
})();
