/* app.js — shell: navigation, modals, toasts, clock, keyboard shortcuts. */
(function () {
  'use strict';

  var current = 'pos';

  function $(id) { return document.getElementById(id); }

  function show(view) {
    current = view;
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.toggle('active', v.id === 'view-' + view);
    });
    document.querySelectorAll('.nav-item').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === view);
    });

    if (view === 'orders') Orders.refresh();
    if (view === 'reports') Reports.refresh();
    if (view === 'products') Products.refresh();
    if (view === 'settings') Settings.refresh();
  }

  function openModal(id) { $(id).hidden = false; }
  function closeModal(id) { $(id).hidden = true; }

  var toastTimer = null;
  function toast(msg, kind) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast ' + (kind || '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3000);
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function applyBranding() {
    var s = Store.getSettings();
    $('brandName').textContent = s.shopName || 'POS';
    $('brandBranch').textContent = s.branch || '';
    document.title = (s.shopName || 'POS') + ' — Point of Sale';
  }

  function refreshAll() {
    POS.refresh();
    Orders.refresh();
    Products.refresh();
    if (current === 'reports') Reports.refresh();
  }

  function tickClock() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    $('clock').textContent = p(d.getHours()) + ':' + p(d.getMinutes());
    $('today').textContent = d.toLocaleDateString(
      I18N.isRTL() ? 'ar' : 'en-GB',
      { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
    );
  }

  /* Switch language: re-label the static markup, then redraw every screen
     so product names, tabs and tables come back in the new language. */
  function setLanguage(lang, persist) {
    I18N.setLang(lang);
    document.querySelectorAll('#langSwitch button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === I18N.lang);
    });
    if (persist !== false) {
      var s = Store.getSettings();
      s.lang = I18N.lang;
      Store.saveSettings(s);
    }
    POS.refresh();
    Orders.refresh();
    Products.refresh();
    Reports.refresh();
    Settings.refresh();
    tickClock();
  }

  document.addEventListener('DOMContentLoaded', function () {
    I18N.setLang(Store.getSettings().lang || 'en');
    applyBranding();

    POS.init();
    Orders.init();
    Reports.init();
    Products.init();
    Settings.init();

    $('nav').addEventListener('click', function (e) {
      var b = e.target.closest('.nav-item');
      if (b) show(b.dataset.view);
    });

    $('langSwitch').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) setLanguage(b.dataset.lang);
    });

    // Reflect the stored language in the switch and the already-built screens.
    setLanguage(Store.getSettings().lang || 'en', false);

    // Any [data-close] or a click on the backdrop closes a modal.
    document.querySelectorAll('.modal-back').forEach(function (back) {
      back.addEventListener('click', function (e) {
        if (e.target === back || e.target.closest('[data-close]')) back.hidden = true;
      });
    });

    document.addEventListener('keydown', function (e) {
      var typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);

      if (e.key === 'Escape') {
        var open = Array.prototype.filter.call(document.querySelectorAll('.modal-back'), function (m) { return !m.hidden; });
        if (open.length) { open.forEach(function (m) { m.hidden = true; }); return; }
      }

      if (typing) return;

      if (e.key === '/') { e.preventDefault(); show('pos'); POS.focusSearch(); }
      if (e.key === 'F2' && current === 'pos' && POS.hasItems()) { e.preventDefault(); POS.openPay(); }
      if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.altKey) {
        show(['pos', 'orders', 'reports', 'products', 'settings'][Number(e.key) - 1]);
      }
    });

    tickClock();
    setInterval(tickClock, 15000);
  });

  window.App = {
    show: show,
    setLanguage: setLanguage,
    openModal: openModal,
    closeModal: closeModal,
    toast: toast,
    download: download,
    applyBranding: applyBranding,
    refreshAll: refreshAll
  };
})();
