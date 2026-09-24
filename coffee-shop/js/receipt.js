/* receipt.js — builds the thermal receipt and sends it to the printer.
   With "bilingual" on, every label prints English + Arabic and each item
   shows both names, so any customer can read their bill. */
(function () {
  'use strict';

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function stamp(ts) {
    var d = new Date(ts);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return {
      date: pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(),
      time: pad(d.getHours()) + ':' + pad(d.getMinutes())
    };
  }

  function build(order, opts) {
    opts = opts || {};
    var s = Store.getSettings();
    var d = stamp(order.ts);
    var cur = s.currency;
    var bi = !!s.bilingualReceipt;
    var primary = I18N.lang;                          // whichever the UI is in
    var secondary = primary === 'ar' ? 'en' : 'ar';

    /* A label in one language, or both stacked. */
    function L(key) {
      var a = I18N.t(key, primary);
      if (!bi) return esc(a);
      var b = I18N.t(key, secondary);
      if (b === a) return esc(a);
      return esc(a) + ' / ' + esc(b);
    }

    function row(label, value, cls) {
      return '<div class="r-tot ' + (cls || '') + '"><span>' + label + '</span><span>' + value + '</span></div>';
    }
    function meta(label, value) {
      return '<div class="r-meta"><span>' + label + '</span><span>' + esc(value) + '</span></div>';
    }

    var rows = order.items.map(function (it) {
      var main = I18N.pname(it, primary);
      var alt = bi ? I18N.pname(it, secondary) : '';
      return '<tr>' +
        '<td>' + esc(main) +
          (alt && alt !== main ? '<div class="r-alt">' + esc(alt) + '</div>' : '') +
        '</td>' +
        '<td class="r-num">' + it.qty + '</td>' +
        '<td class="r-num">' + Money.fmt(it.price) + '</td>' +
        '<td class="r-num">' + Money.fmt(it.price * it.qty) + '</td>' +
        '</tr>';
    }).join('');

    var lines = [];
    lines.push(row(L('subtotal'), Money.fmt(order.totals.gross)));
    if (order.totals.discountAmount > 0) lines.push(row(L('discount'), '-' + Money.fmt(order.totals.discountAmount)));
    if (order.totals.service > 0) lines.push(row(L('service') + ' ' + s.serviceCharge + '%', Money.fmt(order.totals.service)));
    if (s.vatInclusive) {
      lines.push(row(L('r_net'), Money.fmt(order.totals.net)));
      lines.push(row(L('vat') + ' ' + s.vatRate + '%', Money.fmt(order.totals.vat)));
    } else {
      lines.push(row(L('vat') + ' ' + s.vatRate + '%', Money.fmt(order.totals.vat)));
    }

    var pay = [row(L('r_paid_by'), esc(I18N.methodName(order.payment.method, primary)))];
    if (order.payment.method === 'Cash' && order.payment.received) {
      pay.push(row(L('cash_received'), Money.fmt(order.payment.received)));
      pay.push(row(L('change'), Money.fmt(order.payment.change)));
    }

    var banner = '';
    if (opts.reprint) banner += '<div class="r-center r-stamp">*** ' + L('r_reprint') + ' ***</div>';
    if (order.status === 'voided') banner += '<div class="r-center r-stamp">*** ' + L('r_voided') + ' ***</div>';

    return '' +
      '<div class="r-wrap">' +
        '<div class="r-center">' +
          '<div class="r-shop">' + esc(s.shopName) + '</div>' +
          (s.tagline ? '<div class="r-tag">' + esc(s.tagline) + '</div>' : '') +
          (s.branch  ? '<div class="r-tag">' + esc(s.branch) + '</div>' : '') +
          (s.address ? '<div class="r-tag">' + esc(s.address) + '</div>' : '') +
          (s.phone   ? '<div class="r-tag">' + esc(s.phone) + '</div>' : '') +
          (s.vatNumber ? '<div class="r-tag">' + L('vat_number') + ': ' + esc(s.vatNumber) + '</div>' : '') +
        '</div>' +
        '<div class="r-sep"></div>' +
        meta(L('r_order'), '#' + order.no) +
        meta(L('r_date'), d.date + ' ' + d.time) +
        meta(L('r_type'), I18N.typeName(order.type, primary)) +
        (order.customer ? meta(L('r_customer'), order.customer) : '') +
        banner +
        '<div class="r-sep"></div>' +
        '<table>' +
          '<thead><tr>' +
            '<th>' + L('r_item') + '</th>' +
            '<th class="r-num">' + L('r_qty') + '</th>' +
            '<th class="r-num">' + L('r_price') + '</th>' +
            '<th class="r-num">' + L('r_total') + '</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<div class="r-sep"></div>' +
        lines.join('') +
        row(L('total') + ' ' + esc(cur), Money.fmt(order.totals.total), 'grand') +
        '<div class="r-sep"></div>' +
        pay.join('') +
        '<div class="r-foot">' +
          esc(s.footer) +
          '<br>' + order.totals.units + ' ' + L('r_items_count') +
          '<br>' + esc(s.shopName) + ' POS' +
        '</div>' +
      '</div>';
  }

  function print(order, opts) {
    var host = document.getElementById('receipt');
    var s = Store.getSettings();
    host.className = 'receipt' + (String(s.receiptWidth) === '58' ? ' w58' : '');
    host.dir = 'ltr';   // keep the money columns aligned regardless of UI language
    host.innerHTML = build(order, opts);
    setTimeout(function () { window.print(); }, 60);
  }

  window.Receipt = { build: build, print: print };
})();
