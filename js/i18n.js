/* i18n.js — English / Arabic interface strings and RTL switching.
   Elements carry data-i18n (text) or data-i18n-ph (placeholder);
   applyI18n() rewrites them whenever the language changes. */
(function () {
  'use strict';

  var STRINGS = {
    en: {
      /* navigation */
      nav_pos: 'Register', nav_orders: 'Orders', nav_reports: 'Reports',
      nav_products: 'Products', nav_settings: 'Settings',

      /* register */
      search_ph: 'Search the menu…  (press / to focus)',
      all_items: 'All items', all: 'All',
      held_tickets: 'Held tickets', current_order: 'Current order',
      clear: 'Clear', hold: 'Hold', charge: 'Charge',
      dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery',
      no_items_yet: 'No items yet', tap_to_start: 'Tap a product to start the ticket',
      discount: 'Discount', none: 'None', amount: 'Amount',
      subtotal: 'Subtotal', service: 'Service', vat: 'VAT', included: 'included',
      total: 'Total', each: 'each', item: 'item', items: 'items',
      no_match: 'No products match',
      confirm_clear: 'Clear the current ticket?',
      ticket_held: 'Ticket held.', no_held: 'No held tickets.',
      resume: 'Resume', delete_: 'Delete', held_at: 'held',

      /* payment */
      payment: 'Payment', amount_due: 'Amount due',
      cash: 'Cash', card: 'Card', transfer: 'Transfer',
      cash_received: 'Cash received', change: 'Change', exact: 'Exact',
      customer_opt: 'Customer / car no. (optional)',
      cancel: 'Cancel', complete_print: 'Complete & print',
      short_cash: 'Cash received is less than the amount due.',
      order_done: 'Order # completed',

      /* orders */
      orders_title: 'Orders', all_dates: 'All dates',
      ord_search_ph: 'Order # or item…',
      export_excel: 'Export to Excel', export_csv: 'Export CSV',
      th_no: '#', th_time: 'Time', th_type: 'Type', th_items: 'Items',
      th_total: 'Total', th_payment: 'Payment', th_status: 'Status',
      reprint: 'Reprint', void_: 'Void', paid: 'Paid', voided: 'Voided',
      no_orders: 'No orders for this filter.',
      units_sold: 'Units sold', revenue: 'Revenue', avg_ticket: 'Average ticket',
      confirm_void: 'Void this order? It stays in the history but stops counting towards revenue.',
      order_voided: 'Order voided.',
      nothing_export: 'There are no orders to export.',
      excel_saved: 'Excel file saved to your Downloads folder.',

      /* reports */
      reports_title: 'Reports',
      today: 'Today', yesterday: 'Yesterday', this_week: 'This week',
      this_month: 'This month', all_time: 'All time',
      sales_by_hour: 'Sales by hour', payment_methods: 'Payment methods',
      units_by_product: 'Units sold by product', by_category: 'By category',
      daily_revenue: 'Daily revenue',
      k_revenue: 'Revenue', k_orders: 'Orders', k_units: 'Units sold',
      k_net: 'Net of VAT', k_cost: 'Cost of goods', k_profit: 'Gross profit',
      k_discounts: 'Discounts given',
      incl_vat: 'incl. VAT', per_ticket: 'per ticket',
      items_all_orders: 'items across all orders', from_costs: 'from product costs',
      margin: 'margin', no_sales: 'No sales in this period.',
      nothing_sold: 'Nothing sold in this period.', no_data: 'No data.',
      th_product: 'Product', th_category: 'Category', th_units: 'Units',
      th_revenue: 'Revenue', th_profit: 'Profit', th_date: 'Date',

      /* products */
      products_title: 'Products', prod_search_ph: 'Search products…',
      reset_menu: 'Reset to Candiz menu', new_product: '+ New product',
      th_name: 'Name', th_sub: 'Sub-category', th_price: 'Price',
      th_cost: 'Cost', th_margin: 'Margin',
      edit: 'Edit', hide: 'Hide', show: 'Show',
      on_menu: 'On menu', hidden_: 'Hidden',
      no_products: 'No products found.',
      product_photo: 'Photo', choose_photo: 'Choose photo…', remove_photo: 'Remove',
      name_en: 'Name (English)', name_ar: 'Name (Arabic)',
      selling_price: 'Selling price', cost_price: 'Cost',
      available_register: 'Available on the register',
      save_product: 'Save product', edit_product: 'Edit product',
      need_name: 'Give the product a name.', need_cat: 'Choose a category.',
      need_price: 'Enter a valid price.',
      product_added: 'Product added.', product_updated: 'Product updated.',
      product_deleted: 'Product deleted.', menu_restored: 'Menu restored.',

      /* settings */
      settings_title: 'Settings',
      language: 'Language', shop_details: 'Shop details',
      shop_name: 'Shop name', tagline: 'Tagline', branch: 'Branch',
      phone: 'Phone', address: 'Address', vat_number: 'VAT number',
      money_tax: 'Money & tax', currency_code: 'Currency code',
      decimals: 'Decimal places', vat_rate: 'VAT rate (%)',
      prices_incl_vat: 'Menu prices already include VAT',
      service_charge: 'Service charge (%)',
      receipt: 'Receipt', paper_width: 'Paper width',
      footer_msg: 'Footer message', next_order_no: 'Next order number',
      test_receipt: 'Print a test receipt',
      bilingual_receipt: 'Print receipts in both languages',
      data: 'Data', data_note: 'Everything is stored in this browser. Back it up regularly.',
      download_backup: 'Download backup', restore_backup: 'Restore backup',
      demo_data: 'Generate 30 days of sample sales',
      cannot_undo: 'These cannot be undone.',
      delete_orders: 'Delete all orders', factory_reset: 'Factory reset',
      save_settings: 'Save settings', saved: 'Saved.',

      /* receipt */
      r_order: 'Order', r_date: 'Date', r_type: 'Type', r_customer: 'Customer',
      r_item: 'Item', r_qty: 'Qty', r_price: 'Price', r_total: 'Total',
      r_net: 'Net of VAT', r_paid_by: 'Paid by', r_reprint: 'REPRINT',
      r_voided: 'VOIDED', r_items_count: 'item(s)'
    },

    ar: {
      nav_pos: 'الكاشير', nav_orders: 'الطلبات', nav_reports: 'التقارير',
      nav_products: 'المنتجات', nav_settings: 'الإعدادات',

      search_ph: 'ابحث في القائمة…  (اضغط / للبحث)',
      all_items: 'كل الأصناف', all: 'الكل',
      held_tickets: 'الطلبات المعلّقة', current_order: 'الطلب الحالي',
      clear: 'مسح', hold: 'تعليق', charge: 'الدفع',
      dine_in: 'داخل المقهى', takeaway: 'سفري', delivery: 'توصيل',
      no_items_yet: 'لا توجد أصناف بعد', tap_to_start: 'اضغط على منتج لبدء الطلب',
      discount: 'الخصم', none: 'بدون', amount: 'مبلغ',
      subtotal: 'المجموع', service: 'الخدمة', vat: 'ضريبة القيمة المضافة',
      included: 'شاملة', total: 'الإجمالي', each: 'للحبة',
      item: 'صنف', items: 'أصناف',
      no_match: 'لا توجد منتجات مطابقة',
      confirm_clear: 'هل تريد مسح الطلب الحالي؟',
      ticket_held: 'تم تعليق الطلب.', no_held: 'لا توجد طلبات معلّقة.',
      resume: 'استئناف', delete_: 'حذف', held_at: 'عُلّق',

      payment: 'الدفع', amount_due: 'المبلغ المطلوب',
      cash: 'نقداً', card: 'بطاقة', transfer: 'تحويل',
      cash_received: 'المبلغ المستلم', change: 'الباقي', exact: 'بالضبط',
      customer_opt: 'اسم العميل / رقم السيارة (اختياري)',
      cancel: 'إلغاء', complete_print: 'إتمام وطباعة',
      short_cash: 'المبلغ المستلم أقل من المطلوب.',
      order_done: 'تم إتمام الطلب رقم',

      orders_title: 'الطلبات', all_dates: 'كل التواريخ',
      ord_search_ph: 'رقم الطلب أو الصنف…',
      export_excel: 'تصدير إلى Excel', export_csv: 'تصدير CSV',
      th_no: 'رقم', th_time: 'الوقت', th_type: 'النوع', th_items: 'الأصناف',
      th_total: 'الإجمالي', th_payment: 'الدفع', th_status: 'الحالة',
      reprint: 'إعادة طباعة', void_: 'إلغاء', paid: 'مدفوع', voided: 'ملغي',
      no_orders: 'لا توجد طلبات لهذا الفلتر.',
      units_sold: 'الوحدات المباعة', revenue: 'الإيرادات', avg_ticket: 'متوسط الطلب',
      confirm_void: 'إلغاء هذا الطلب؟ سيبقى في السجل لكنه لن يُحتسب ضمن الإيرادات.',
      order_voided: 'تم إلغاء الطلب.',
      nothing_export: 'لا توجد طلبات للتصدير.',
      excel_saved: 'تم حفظ ملف Excel في مجلد التنزيلات.',

      reports_title: 'التقارير',
      today: 'اليوم', yesterday: 'أمس', this_week: 'هذا الأسبوع',
      this_month: 'هذا الشهر', all_time: 'كل الفترات',
      sales_by_hour: 'المبيعات حسب الساعة', payment_methods: 'طرق الدفع',
      units_by_product: 'الوحدات المباعة حسب المنتج', by_category: 'حسب الفئة',
      daily_revenue: 'الإيراد اليومي',
      k_revenue: 'الإيرادات', k_orders: 'الطلبات', k_units: 'الوحدات المباعة',
      k_net: 'الصافي قبل الضريبة', k_cost: 'تكلفة البضاعة', k_profit: 'إجمالي الربح',
      k_discounts: 'الخصومات الممنوحة',
      incl_vat: 'شامل الضريبة', per_ticket: 'لكل طلب',
      items_all_orders: 'صنف في جميع الطلبات', from_costs: 'من تكاليف المنتجات',
      margin: 'هامش الربح', no_sales: 'لا توجد مبيعات في هذه الفترة.',
      nothing_sold: 'لم يُباع شيء في هذه الفترة.', no_data: 'لا توجد بيانات.',
      th_product: 'المنتج', th_category: 'الفئة', th_units: 'الوحدات',
      th_revenue: 'الإيراد', th_profit: 'الربح', th_date: 'التاريخ',

      products_title: 'المنتجات', prod_search_ph: 'ابحث في المنتجات…',
      reset_menu: 'استعادة قائمة كانديز', new_product: '+ منتج جديد',
      th_name: 'الاسم', th_sub: 'الفئة الفرعية', th_price: 'السعر',
      th_cost: 'التكلفة', th_margin: 'الهامش',
      edit: 'تعديل', hide: 'إخفاء', show: 'إظهار',
      on_menu: 'في القائمة', hidden_: 'مخفي',
      no_products: 'لا توجد منتجات.',
      product_photo: 'الصورة', choose_photo: 'اختر صورة…', remove_photo: 'إزالة',
      name_en: 'الاسم (بالإنجليزية)', name_ar: 'الاسم (بالعربية)',
      selling_price: 'سعر البيع', cost_price: 'التكلفة',
      available_register: 'متاح في الكاشير',
      save_product: 'حفظ المنتج', edit_product: 'تعديل المنتج',
      need_name: 'أدخل اسم المنتج.', need_cat: 'اختر الفئة.',
      need_price: 'أدخل سعراً صحيحاً.',
      product_added: 'تمت إضافة المنتج.', product_updated: 'تم تحديث المنتج.',
      product_deleted: 'تم حذف المنتج.', menu_restored: 'تمت استعادة القائمة.',

      settings_title: 'الإعدادات',
      language: 'اللغة', shop_details: 'بيانات المحل',
      shop_name: 'اسم المحل', tagline: 'الشعار', branch: 'الفرع',
      phone: 'الهاتف', address: 'العنوان', vat_number: 'الرقم الضريبي',
      money_tax: 'المال والضريبة', currency_code: 'رمز العملة',
      decimals: 'عدد الخانات العشرية', vat_rate: 'نسبة الضريبة (%)',
      prices_incl_vat: 'أسعار القائمة شاملة للضريبة',
      service_charge: 'رسوم الخدمة (%)',
      receipt: 'الفاتورة', paper_width: 'عرض الورق',
      footer_msg: 'رسالة نهاية الفاتورة', next_order_no: 'رقم الطلب التالي',
      test_receipt: 'طباعة فاتورة تجريبية',
      bilingual_receipt: 'طباعة الفاتورة باللغتين',
      data: 'البيانات', data_note: 'كل البيانات محفوظة في هذا المتصفح. احفظ نسخة احتياطية بانتظام.',
      download_backup: 'تنزيل نسخة احتياطية', restore_backup: 'استعادة نسخة',
      demo_data: 'إنشاء مبيعات تجريبية لـ ٣٠ يوماً',
      cannot_undo: 'لا يمكن التراجع عن هذه العمليات.',
      delete_orders: 'حذف كل الطلبات', factory_reset: 'إعادة ضبط المصنع',
      save_settings: 'حفظ الإعدادات', saved: 'تم الحفظ.',

      r_order: 'الطلب', r_date: 'التاريخ', r_type: 'النوع', r_customer: 'العميل',
      r_item: 'الصنف', r_qty: 'الكمية', r_price: 'السعر', r_total: 'الإجمالي',
      r_net: 'الصافي قبل الضريبة', r_paid_by: 'طريقة الدفع', r_reprint: 'نسخة مكررة',
      r_voided: 'ملغي', r_items_count: 'صنف'
    }
  };

  var lang = 'en';

  function t(key, forLang) {
    var L = STRINGS[forLang || lang] || STRINGS.en;
    return (L[key] !== undefined) ? L[key] : (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
  }

  /* Localised product / category / sub-category names. */
  function pname(p, forLang) {
    var l = forLang || lang;
    if (l === 'ar') return (p.ar && p.ar.trim()) ? p.ar : p.name;
    return p.name;
  }
  function catName(name, forLang) {
    var l = forLang || lang;
    if (l !== 'ar') return name;
    var m = (window.CATEGORY_META || []).filter(function (c) { return c.name === name; })[0];
    return (m && m.ar) ? m.ar : name;
  }
  function subName(name, forLang) {
    var l = forLang || lang;
    if (l !== 'ar') return name;
    return (window.SUBCATEGORY_AR && window.SUBCATEGORY_AR[name]) || name;
  }
  /* Order types are stored in English; show them translated. */
  var TYPE_KEY = { 'Dine-in': 'dine_in', 'Takeaway': 'takeaway', 'Delivery': 'delivery' };
  var METHOD_KEY = { 'Cash': 'cash', 'Card': 'card', 'Transfer': 'transfer' };
  function typeName(v, forLang) { return TYPE_KEY[v] ? t(TYPE_KEY[v], forLang) : v; }
  function methodName(v, forLang) { return METHOD_KEY[v] ? t(METHOD_KEY[v], forLang) : v; }

  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (n) {
      n.textContent = t(n.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-ph]').forEach(function (n) {
      n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph')));
    });
  }

  function setLang(l) {
    lang = (l === 'ar') ? 'ar' : 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    applyI18n();
  }

  window.I18N = {
    t: t, setLang: setLang, applyI18n: applyI18n,
    get lang() { return lang; },
    isRTL: function () { return lang === 'ar'; },
    pname: pname, catName: catName, subName: subName,
    typeName: typeName, methodName: methodName,
    STRINGS: STRINGS
  };
})();
