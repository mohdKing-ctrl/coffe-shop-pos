/* products.js — menu management: photos, bilingual names, prices. */
(function () {
  'use strict';

  var el = {};
  var editingId = null;
  var query = '';
  var pendingPhoto = null;      // data: URL chosen in the editor, or '' to clear
  function $(id) { return document.getElementById(id); }
  function t(k) { return I18N.t(k); }
  function escHtml(s) { return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }

  function render() {
    var q = query.trim().toLowerCase();
    var list = Store.getProducts().filter(function (p) {
      return !q || (p.name + ' ' + (p.ar || '') + ' ' + p.cat + ' ' + p.sub).toLowerCase().indexOf(q) >= 0;
    });

    var tb = el.mgmtTable.querySelector('tbody');
    if (!list.length) {
      tb.innerHTML = '<tr class="empty"><td colspan="9">' + escHtml(t('no_products')) + '</td></tr>';
      return;
    }

    tb.innerHTML = list.map(function (p) {
      var margin = p.price > 0 ? ((p.price - (p.cost || 0)) / p.price) * 100 : 0;
      var meta = (window.CATEGORY_META || []).filter(function (c) { return c.name === p.cat; })[0];
      var thumb = p.img
        ? '<img class="row-img" src="' + escAttr(p.img) + '" alt="" onerror="this.style.display=\'none\'">'
        : '<div class="row-img placeholder">' + (meta ? meta.icon : '•') + '</div>';
      var nameCell = escHtml(p.name) +
        (p.ar ? '<div class="row-ar" dir="rtl">' + escHtml(p.ar) + '</div>' : '');
      return '<tr>' +
        '<td>' + thumb + '</td>' +
        '<td class="strong">' + nameCell + '</td>' +
        '<td>' + escHtml(I18N.catName(p.cat)) + '</td>' +
        '<td>' + escHtml(I18N.subName(p.sub)) + '</td>' +
        '<td class="num">' + Money.fmt(p.price) + '</td>' +
        '<td class="num">' + Money.fmt(p.cost || 0) + '</td>' +
        '<td class="num">' + margin.toFixed(0) + '%</td>' +
        '<td>' + (p.active === false
          ? '<span class="tag">' + escHtml(t('hidden_')) + '</span>'
          : '<span class="tag ok">' + escHtml(t('on_menu')) + '</span>') + '</td>' +
        '<td style="text-align:end;white-space:nowrap">' +
          '<button class="btn ghost small" data-edit="' + p.id + '">' + escHtml(t('edit')) + '</button> ' +
          '<button class="btn ghost small" data-toggle="' + p.id + '">' +
            escHtml(p.active === false ? t('show') : t('hide')) + '</button> ' +
          '<button class="btn ghost small danger" data-del="' + p.id + '">' + escHtml(t('delete_')) + '</button>' +
        '</td></tr>';
    }).join('');

    var cats = [], subs = [];
    Store.getProducts().forEach(function (p) {
      if (cats.indexOf(p.cat) < 0) cats.push(p.cat);
      if (subs.indexOf(p.sub) < 0) subs.push(p.sub);
    });
    $('catList').innerHTML = cats.map(function (c) { return '<option value="' + escAttr(c) + '">'; }).join('');
    $('subList').innerHTML = subs.map(function (c) { return '<option value="' + escAttr(c) + '">'; }).join('');
  }

  function showPreview(src) {
    el.pfPreview.innerHTML = src
      ? '<img src="' + escAttr(src) + '" alt="">'
      : '<span>🍽️</span>';
  }

  function openEditor(id) {
    editingId = id;
    pendingPhoto = null;
    var p = id ? Store.getProducts().filter(function (x) { return x.id === id; })[0] : null;
    $('prodModalTitle').textContent = p ? t('edit_product') : t('new_product');
    el.pfName.value = p ? p.name : '';
    el.pfNameAr.value = p ? (p.ar || '') : '';
    el.pfCat.value = p ? p.cat : '';
    el.pfSub.value = p ? p.sub : '';
    el.pfPrice.value = p ? p.price : '';
    el.pfCost.value = p ? (p.cost || 0) : '';
    el.pfActive.checked = p ? p.active !== false : true;
    showPreview(p ? p.img : '');
    App.openModal('prodModal');
    setTimeout(function () { el.pfName.focus(); }, 60);
  }

  /* Shrink an uploaded photo to 400px square before storing it, so
     localStorage does not fill up with multi-megabyte camera images. */
  function readPhoto(file, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var size = 400;
        var c = document.createElement('canvas');
        c.width = c.height = size;
        var ctx = c.getContext('2d');
        var s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        done(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { App.toast('That file is not an image.', 'bad'); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function save() {
    var name = el.pfName.value.trim();
    var cat = el.pfCat.value.trim();
    var price = Number(el.pfPrice.value);

    if (!name) { App.toast(t('need_name'), 'bad'); return; }
    if (!cat) { App.toast(t('need_cat'), 'bad'); return; }
    if (!(price >= 0)) { App.toast(t('need_price'), 'bad'); return; }

    var products = Store.getProducts();
    var patch = {
      name: name,
      ar: el.pfNameAr.value.trim(),
      cat: cat,
      sub: el.pfSub.value.trim() || 'General',
      price: Money.round(price),
      cost: Money.round(Number(el.pfCost.value) || 0),
      active: el.pfActive.checked
    };
    if (pendingPhoto !== null) patch.img = pendingPhoto;

    if (editingId) {
      for (var i = 0; i < products.length; i++) {
        if (products[i].id === editingId) {
          for (var k in patch) products[i][k] = patch[k];
          break;
        }
      }
    } else {
      var maxId = products.reduce(function (m, p) { return Math.max(m, Number(p.id) || 0); }, 0);
      patch.id = maxId + 1;
      if (patch.img === undefined) patch.img = '';
      products.push(patch);
    }

    if (!Store.saveProducts(products)) return;   // storage full — message already shown
    App.closeModal('prodModal');
    App.toast(editingId ? t('product_updated') : t('product_added'), 'good');
    App.refreshAll();
  }

  function init() {
    ['mgmtTable', 'prodSearch', 'prodNew', 'prodReset',
     'pfName', 'pfNameAr', 'pfCat', 'pfSub', 'pfPrice', 'pfCost', 'pfActive', 'pfSave',
     'pfPreview', 'pfPickPhoto', 'pfDropPhoto', 'pfPhotoFile']
      .forEach(function (k) { el[k] = $(k); });

    el.prodSearch.addEventListener('input', function () { query = el.prodSearch.value; render(); });
    el.prodNew.addEventListener('click', function () { openEditor(null); });
    el.pfSave.addEventListener('click', save);

    el.pfPickPhoto.addEventListener('click', function () { el.pfPhotoFile.click(); });
    el.pfPhotoFile.addEventListener('change', function () {
      var f = el.pfPhotoFile.files[0];
      if (!f) return;
      readPhoto(f, function (dataUrl) { pendingPhoto = dataUrl; showPreview(dataUrl); });
      el.pfPhotoFile.value = '';
    });
    el.pfDropPhoto.addEventListener('click', function () { pendingPhoto = ''; showPreview(''); });

    el.prodReset.addEventListener('click', function () {
      if (!confirm(t('reset_menu') + '?')) return;
      Store.resetProducts();
      App.toast(t('menu_restored'), 'good');
      App.refreshAll();
    });

    el.mgmtTable.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]'),
          tg = e.target.closest('[data-toggle]'),
          dl = e.target.closest('[data-del]');

      if (ed) { openEditor(Number(ed.dataset.edit)); return; }

      var products = Store.getProducts();

      if (tg) {
        var id = Number(tg.dataset.toggle);
        products.forEach(function (p) { if (p.id === id) p.active = (p.active === false); });
        Store.saveProducts(products);
        App.refreshAll();
      } else if (dl) {
        var did = Number(dl.dataset.del);
        var prod = products.filter(function (p) { return p.id === did; })[0];
        if (!prod) return;
        if (!confirm(t('delete_') + ' “' + prod.name + '”?')) return;
        Store.saveProducts(products.filter(function (p) { return p.id !== did; }));
        App.toast(t('product_deleted'), 'good');
        App.refreshAll();
      }
    });

    render();
  }

  window.Products = { init: init, refresh: render };
})();
