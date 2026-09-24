/* reports.js — revenue, units sold, profit, over any date range. */
(function () {
  'use strict';

  var el = {};
  var range = { from: null, to: null, preset: 'today' };
  function $(id) { return document.getElementById(id); }
  function t(k) { return I18N.t(k); }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function endOfDay(d) { var x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
  function escHtml(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function presetRange(name) {
    var now = new Date(), from = new Date(), to = new Date();
    if (name === 'yesterday') { from.setDate(now.getDate() - 1); to.setDate(now.getDate() - 1); }
    else if (name === 'week') { from.setDate(now.getDate() - ((now.getDay() + 6) % 7)); }
    else if (name === 'month') { from.setDate(1); }
    else if (name === 'all') { from = new Date(2000, 0, 1); }
    return { from: ymd(from), to: ymd(to) };
  }

  function ordersInRange() {
    var a = startOfDay(new Date(range.from + 'T00:00:00')).getTime();
    var b = endOfDay(new Date(range.to + 'T00:00:00')).getTime();
    return Store.getOrders().filter(function (o) {
      return o.status !== 'voided' && o.ts >= a && o.ts <= b;
    });
  }

  function aggregate(orders) {
    var agg = {
      orders: orders.length, units: 0, revenue: 0, net: 0, vat: 0, cost: 0,
      profit: 0, discounts: 0,
      byProduct: {}, byCategory: {}, byPayment: {}, byHour: new Array(24).fill(0), byDay: {}
    };

    orders.forEach(function (o) {
      agg.units += o.totals.units;
      agg.revenue += o.totals.total;
      agg.net += o.totals.net;
      agg.vat += o.totals.vat;
      agg.cost += o.totals.cost;
      agg.profit += o.totals.profit;
      agg.discounts += o.totals.discountAmount;

      agg.byHour[new Date(o.ts).getHours()] += o.totals.total;

      var day = ymd(new Date(o.ts));
      if (!agg.byDay[day]) agg.byDay[day] = { orders: 0, units: 0, revenue: 0, profit: 0 };
      agg.byDay[day].orders++;
      agg.byDay[day].units += o.totals.units;
      agg.byDay[day].revenue += o.totals.total;
      agg.byDay[day].profit += o.totals.profit;

      var m = o.payment.method;
      agg.byPayment[m] = (agg.byPayment[m] || 0) + o.totals.total;

      /* Spread the order-level discount proportionally so per-item revenue
         still adds up to the order total. */
      var factor = o.totals.gross > 0 ? (o.totals.gross - o.totals.discountAmount) / o.totals.gross : 1;

      o.items.forEach(function (it) {
        var rev = it.price * it.qty * factor;
        var cost = (it.cost || 0) * it.qty;
        var key = it.id + '|' + it.name;
        if (!agg.byProduct[key]) {
          agg.byProduct[key] = { name: it.name, ar: it.ar || '', cat: it.cat || '—',
                                 sub: it.sub || '', units: 0, revenue: 0, cost: 0, profit: 0 };
        }
        var P = agg.byProduct[key];
        P.units += it.qty; P.revenue += rev; P.cost += cost; P.profit += rev - cost;

        var c = it.cat || '—';
        if (!agg.byCategory[c]) agg.byCategory[c] = { units: 0, revenue: 0 };
        agg.byCategory[c].units += it.qty;
        agg.byCategory[c].revenue += rev;
      });
    });

    return agg;
  }

  function kpi(label, value, foot, cls) {
    return '<div class="kpi ' + (cls || '') + '"><div class="k-label">' + escHtml(label) + '</div>' +
      '<div class="k-value">' + escHtml(value) + '</div>' +
      (foot ? '<div class="k-foot">' + escHtml(foot) + '</div>' : '') + '</div>';
  }

  function render() {
    var a = aggregate(ordersInRange());
    var cur = Store.getSettings().currency;
    var avg = a.orders ? a.revenue / a.orders : 0;
    var margin = a.net > 0 ? (a.profit / a.net) * 100 : 0;

    el.kpis.innerHTML =
      kpi(t('k_revenue'), cur + ' ' + Money.fmt(a.revenue), t('incl_vat'), 'accent') +
      kpi(t('k_orders'), String(a.orders), Money.fmt(avg) + ' ' + t('per_ticket')) +
      kpi(t('k_units'), String(a.units), t('items_all_orders')) +
      kpi(t('k_net'), cur + ' ' + Money.fmt(a.net), t('vat') + ' ' + Money.fmt(a.vat)) +
      kpi(t('k_cost'), cur + ' ' + Money.fmt(a.cost), t('from_costs')) +
      kpi(t('k_profit'), cur + ' ' + Money.fmt(a.profit), margin.toFixed(1) + '% ' + t('margin'), 'green') +
      kpi(t('k_discounts'), cur + ' ' + Money.fmt(a.discounts), '');

    /* ---- hourly bars, trimmed to trading hours ---- */
    var firstH = 24, lastH = 0;
    a.byHour.forEach(function (v, h) { if (v > 0) { if (h < firstH) firstH = h; if (h > lastH) lastH = h; } });
    if (firstH > lastH) { firstH = 8; lastH = 23; }
    firstH = Math.max(0, firstH - 1); lastH = Math.min(23, lastH + 1);

    var max = Math.max.apply(null, a.byHour.slice(firstH, lastH + 1).concat([0.001]));
    var bars = '';
    for (var h = firstH; h <= lastH; h++) {
      bars += '<div class="bar-col">' +
        '<div class="bar" style="height:' + ((a.byHour[h] / max) * 100).toFixed(1) + '%" ' +
        'data-v="' + pad(h) + ':00 · ' + Money.fmt(a.byHour[h]) + '"></div>' +
        '<div class="bar-lab">' + pad(h) + '</div></div>';
    }
    el.hourChart.innerHTML = bars;

    /* ---- payment split ---- */
    var payKeys = Object.keys(a.byPayment);
    el.payChart.innerHTML = payKeys.length
      ? payKeys.map(function (k) {
          var pct = a.revenue > 0 ? (a.byPayment[k] / a.revenue) * 100 : 0;
          return hbar(I18N.methodName(k) + ' — ' + pct.toFixed(0) + '%', Money.fmt(a.byPayment[k]), pct);
        }).join('')
      : '<p class="muted">' + escHtml(t('no_sales')) + '</p>';

    /* ---- units by product ---- */
    var prods = Object.keys(a.byProduct).map(function (k) { return a.byProduct[k]; })
      .sort(function (x, y) { return y.units - x.units || y.revenue - x.revenue; });
    var tb = el.prodTable.querySelector('tbody');
    tb.innerHTML = prods.length
      ? prods.map(function (p) {
          return '<tr><td>' + escHtml(I18N.pname(p)) + '</td><td>' + escHtml(I18N.catName(p.cat)) + '</td>' +
            '<td class="num strong">' + p.units + '</td>' +
            '<td class="num">' + Money.fmt(p.revenue) + '</td>' +
            '<td class="num">' + Money.fmt(p.profit) + '</td></tr>';
        }).join('')
      : '<tr class="empty"><td colspan="5">' + escHtml(t('nothing_sold')) + '</td></tr>';

    /* ---- category breakdown ---- */
    var cats = Object.keys(a.byCategory).sort(function (x, y) { return a.byCategory[y].revenue - a.byCategory[x].revenue; });
    var maxCat = cats.length ? a.byCategory[cats[0]].revenue : 1;
    el.catBreak.innerHTML = cats.length
      ? cats.map(function (c) {
          var v = a.byCategory[c];
          return hbar(I18N.catName(c) + ' · ' + v.units + ' ' + t('th_units'),
                      Money.fmt(v.revenue), (v.revenue / maxCat) * 100);
        }).join('')
      : '<p class="muted">' + escHtml(t('no_sales')) + '</p>';

    /* ---- daily table ---- */
    var days = Object.keys(a.byDay).sort().reverse();
    var dtb = el.dayTable.querySelector('tbody');
    dtb.innerHTML = days.length
      ? days.map(function (d) {
          var v = a.byDay[d];
          return '<tr><td>' + d + '</td><td class="num">' + v.orders + '</td><td class="num">' + v.units +
            '</td><td class="num strong">' + Money.fmt(v.revenue) + '</td></tr>';
        }).join('')
      : '<tr class="empty"><td colspan="4">' + escHtml(t('no_data')) + '</td></tr>';
  }

  function hbar(label, value, pct) {
    return '<div class="hbar-row"><div class="hbar-head"><span>' + escHtml(label) + '</span><span>' + value + '</span></div>' +
      '<div class="hbar-track"><div class="hbar-fill" style="width:' + Math.max(pct, 1).toFixed(1) + '%"></div></div></div>';
  }

  /* ---------------- exports ---------------- */

  function exportExcel() {
    var orders = ordersInRange();
    if (!orders.length) { App.toast(t('nothing_export'), 'bad'); return; }

    var a = aggregate(orders);
    var s = Store.getSettings();
    var S = XLSX.S;
    var rtl = I18N.isRTL();
    var cur = s.currency;
    var margin = a.net > 0 ? (a.profit / a.net) * 100 : 0;

    /* --- Sheet 1: the headline numbers --- */
    var sum = [
      [{ v: (s.shopName || '') + ' — ' + t('reports_title'), s: S.TITLE }],
      [{ v: t('th_date'), s: S.HEAD }, range.from + '  →  ' + range.to],
      [{ v: t('currency_code'), s: S.HEAD }, cur],
      [],
      [{ v: t('k_revenue'), s: S.HEAD }, { v: Money.round(a.revenue), s: S.MONEY_B }],
      [{ v: t('k_orders'), s: S.HEAD }, a.orders],
      [{ v: t('k_units'), s: S.HEAD }, a.units],
      [{ v: t('avg_ticket'), s: S.HEAD }, { v: Money.round(a.orders ? a.revenue / a.orders : 0), s: S.MONEY }],
      [{ v: t('k_net'), s: S.HEAD }, { v: Money.round(a.net), s: S.MONEY }],
      [{ v: t('vat'), s: S.HEAD }, { v: Money.round(a.vat), s: S.MONEY }],
      [{ v: t('k_cost'), s: S.HEAD }, { v: Money.round(a.cost), s: S.MONEY }],
      [{ v: t('k_profit'), s: S.HEAD }, { v: Money.round(a.profit), s: S.MONEY_B }],
      [{ v: t('margin') + ' %', s: S.HEAD }, Number(margin.toFixed(1))],
      [{ v: t('k_discounts'), s: S.HEAD }, { v: Money.round(a.discounts), s: S.MONEY }],
      [],
      [{ v: t('payment_methods'), s: S.HEAD }]
    ];
    Object.keys(a.byPayment).forEach(function (k) {
      sum.push([I18N.methodName(k), { v: Money.round(a.byPayment[k]), s: S.MONEY }]);
    });
    sum.push([]);
    sum.push([{ v: t('sales_by_hour'), s: S.HEAD }]);
    a.byHour.forEach(function (v, h) {
      if (v > 0) sum.push([pad(h) + ':00', { v: Money.round(v), s: S.MONEY }]);
    });

    /* --- Sheet 2: per product --- */
    var head2 = [t('th_product'), t('name_ar'), t('th_category'), t('th_sub'),
                 t('th_units'), t('th_revenue'), t('th_cost'), t('th_profit')]
                .map(function (h) { return { v: h, s: S.HEAD }; });
    var rows2 = [head2];
    Object.keys(a.byProduct).map(function (k) { return a.byProduct[k]; })
      .sort(function (x, y) { return y.units - x.units; })
      .forEach(function (p) {
        rows2.push([p.name, p.ar, p.cat, p.sub, p.units,
          { v: Money.round(p.revenue), s: S.MONEY },
          { v: Money.round(p.cost), s: S.MONEY },
          { v: Money.round(p.profit), s: S.MONEY }]);
      });

    /* --- Sheet 3: per day --- */
    var head3 = [t('th_date'), t('th_no'), t('th_units'), t('th_revenue'), t('th_profit')]
                .map(function (h) { return { v: h, s: S.HEAD }; });
    var rows3 = [head3];
    Object.keys(a.byDay).sort().forEach(function (d) {
      var v = a.byDay[d];
      rows3.push([d, v.orders, v.units,
        { v: Money.round(v.revenue), s: S.MONEY },
        { v: Money.round(v.profit), s: S.MONEY }]);
    });

    /* --- Sheet 4: per category --- */
    var head4 = [t('th_category'), t('th_units'), t('th_revenue')]
                .map(function (h) { return { v: h, s: S.HEAD }; });
    var rows4 = [head4];
    Object.keys(a.byCategory).forEach(function (c) {
      rows4.push([c, a.byCategory[c].units, { v: Money.round(a.byCategory[c].revenue), s: S.MONEY }]);
    });

    XLSX.save(
      (s.shopName || 'POS').replace(/[^\w؀-ۿ -]/g, '') + '-report-' + range.from + '_' + range.to + '.xlsx',
      [
        { name: t('reports_title'), rows: sum, rtl: rtl, cols: [26, 18] },
        { name: t('th_product'), rows: rows2, headerRows: 1, rtl: rtl, cols: [28, 24, 14, 18, 9, 12, 11, 11] },
        { name: t('daily_revenue'), rows: rows3, headerRows: 1, rtl: rtl, cols: [12, 9, 9, 12, 12] },
        { name: t('by_category'), rows: rows4, headerRows: 1, rtl: rtl, cols: [18, 9, 12] }
      ],
      { decimals: s.decimals }
    );

    App.toast(t('excel_saved'), 'good');
  }

  function exportCsv() {
    var orders = ordersInRange();
    var a = aggregate(orders);
    var rows = [];

    rows.push([(Store.getSettings().shopName || 'POS') + ' — ' + t('reports_title')]);
    rows.push([t('th_date'), range.from, range.to]);
    rows.push([]);
    rows.push([t('k_revenue'), Money.fmt(a.revenue)]);
    rows.push([t('k_orders'), a.orders]);
    rows.push([t('k_units'), a.units]);
    rows.push([t('k_net'), Money.fmt(a.net)]);
    rows.push([t('vat'), Money.fmt(a.vat)]);
    rows.push([t('k_cost'), Money.fmt(a.cost)]);
    rows.push([t('k_profit'), Money.fmt(a.profit)]);
    rows.push([]);
    rows.push([t('units_by_product')]);
    rows.push([t('th_product'), t('th_category'), t('th_units'), t('th_revenue'), t('th_profit')]);
    Object.keys(a.byProduct).map(function (k) { return a.byProduct[k]; })
      .sort(function (x, y) { return y.units - x.units; })
      .forEach(function (p) { rows.push([p.name, p.cat, p.units, Money.fmt(p.revenue), Money.fmt(p.profit)]); });
    rows.push([]);
    rows.push([t('daily_revenue')]);
    rows.push([t('th_date'), t('th_no'), t('th_units'), t('th_revenue')]);
    Object.keys(a.byDay).sort().forEach(function (d) {
      var v = a.byDay[d];
      rows.push([d, v.orders, v.units, Money.fmt(v.revenue)]);
    });

    var csv = rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c === undefined ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');

    App.download('sales-' + range.from + '_to_' + range.to + '.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  }

  function applyPreset(name) {
    var r = presetRange(name);
    range.from = r.from; range.to = r.to; range.preset = name;
    el.repFrom.value = r.from; el.repTo.value = r.to;
    Array.prototype.forEach.call(el.rangePresets.children, function (b) {
      b.classList.toggle('active', b.dataset.range === name);
    });
    render();
  }

  function init() {
    ['kpis', 'hourChart', 'payChart', 'prodTable', 'catBreak', 'dayTable',
     'repFrom', 'repTo', 'rangePresets', 'repExport', 'repExcel'].forEach(function (k) { el[k] = $(k); });

    el.rangePresets.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      applyPreset(b.dataset.range);
    });

    function custom() {
      if (!el.repFrom.value || !el.repTo.value) return;
      range.from = el.repFrom.value; range.to = el.repTo.value; range.preset = 'custom';
      Array.prototype.forEach.call(el.rangePresets.children, function (b) { b.classList.remove('active'); });
      render();
    }
    el.repFrom.addEventListener('change', custom);
    el.repTo.addEventListener('change', custom);
    el.repExport.addEventListener('click', exportCsv);
    el.repExcel.addEventListener('click', exportExcel);

    applyPreset('today');
  }

  window.Reports = { init: init, refresh: render };
})();
