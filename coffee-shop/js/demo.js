/* demo.js — DEMO MODE for the Candiz coffee shop POS.
   This copy is for showing customers only. The full version has none of these limits.
   Loaded last, so it wraps the real functions after they exist. */
(function () {
  'use strict';

  var WA    = '96892088530';
  var WAMSG = encodeURIComponent('السلام عليكم، شفت النسخة التجريبية وأبغى النظام الكامل لمحلي');
  var LIMIT = 5;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------- 1. the bar that carries your number with the link ---------- */
  ready(function () {
    var bar = document.createElement('div');
    bar.id = 'demoBar';
    bar.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:5000;background:#0f172a;color:#fff;' +
      'padding:11px 16px;display:flex;align-items:center;justify-content:center;gap:14px;' +
      'flex-wrap:wrap;font-family:inherit;font-size:13.5px;font-weight:700;' +
      'box-shadow:0 -6px 24px rgba(0,0,0,.35)';
    bar.innerHTML =
      '<span style="background:#f59e0b;color:#000;padding:3px 10px;border-radius:7px;' +
        'font-weight:800;font-size:12px">DEMO</span>' +
      '<span>This is a demo &mdash; limited to ' + LIMIT + ' orders. &nbsp;|&nbsp; هذه نسخة تجريبية</span>' +
      '<a href="https://wa.me/' + WA + '?text=' + WAMSG + '" target="_blank" rel="noopener" ' +
        'style="background:#25D366;color:#fff;text-decoration:none;padding:8px 16px;' +
        'border-radius:9px;font-weight:800">' +
        '&#128241; Get the full version &mdash; اطلب النسخة الكاملة</a>';
    document.body.appendChild(bar);
    document.body.style.paddingBottom = '62px';
    document.title = 'DEMO - ' + document.title;
  });

  /* ---------- 2. stamp every receipt so a saved copy is useless for real billing ---------- */
  if (window.Receipt && typeof Receipt.build === 'function') {
    var _build = Receipt.build;
    Receipt.build = function (order, opts) {
      var html = _build(order, opts);
      var stamp =
        '<div style="text-align:center;border:2px solid #000;padding:5px 0;margin:6px 0;' +
        'font-weight:bold;font-size:13px">DEMO COPY - NOT VALID<br>نسخة تجريبية - غير صالحة</div>';
      var foot =
        '<div style="text-align:center;font-size:10px;margin-top:6px">' +
        'Demo by Mohammed Al Riyami &bull; +968 9208 8530</div>';
      return stamp + html + foot;
    };
  }

  /* ---------- 3. stop at 5 orders ---------- */
  if (window.Store && typeof Store.addOrder === 'function') {
    var _add = Store.addOrder;
    Store.addOrder = function (order) {
      if (Store.getOrders().length >= LIMIT) {
        if (window.App && App.toast) {
          App.toast('Demo limit reached (' + LIMIT + ' orders). Message me for the full version.', 'bad');
        }
        return order;
      }
      return _add(order);
    };
  }

  /* ---------- 4. backup is a full-version feature ---------- */
  ready(function () {
    var b = document.getElementById('backupBtn');
    if (b) {
      var clone = b.cloneNode(true);            // drops the original click handler
      b.parentNode.replaceChild(clone, b);
      clone.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (window.App && App.toast) App.toast('Backup works in the full version.', 'bad');
      });
    }
  });
})();
