# Candiz POS

A complete point-of-sale system for a coffee shop — **English and Arabic**, with
product photos, thermal receipt printing, and **Excel export** of the sales history.

Pre-loaded with the full Candiz menu: 89 products across Hot Drinks, Cold Drinks and
Sweets, priced in **OMR** to three decimals.

No installation, no internet, no accounts. Plain HTML, CSS and JavaScript.

---

## Running it

**Double-click `index.html`.** It opens in your browser and works immediately.

> Keep the folder together — `index.html`, `css/`, `js/` and `img/` must stay side by side.

If you ever change a file and the page looks unchanged, press **Ctrl + F5** to force
the browser to reload it.

---

## Language

The **English / العربية** switch sits at the bottom of the left sidebar.

Switching flips the entire interface, including right-to-left layout, Arabic product
names, Arabic column headings, and Arabic sheet names in the Excel export. Your choice
is remembered.

Every product carries both names. Prices, dates and times always stay in Western
digits so the numbers line up in the receipt and in Excel.

---

## The five screens

### 🧾 Register
Each product shows as a photo tile with its name and price.

- Filter by category, then sub-category, or type in the **search box** — it searches
  English *and* Arabic names at once.
- Tap a tile to add it; a gold badge shows how many are on the ticket.
- **−** / **+** adjust quantity, **×** removes the line.
- Choose **Dine-in / Takeaway / Delivery**, apply a **discount** (% or fixed amount).
- **Hold** parks a ticket so you can serve the next customer, then **Held tickets →
  Resume** brings it back.
- **Charge** opens payment: Cash, Card or Transfer. For cash, enter what the customer
  gave you (or tap a quick-cash button) and the change is calculated.
- Completing the sale saves the order and opens the print dialog.

### 📋 Orders
Every sale, newest first. Defaults to today; use the date box or **All dates**.
Search by order number, customer, or any item name in either language.

- **Reprint** — prints a copy stamped *REPRINT*.
- **Void** — cancels a mistaken sale. It stays in the history but stops counting
  towards revenue.
- **Export to Excel** — see below.

### 📊 Reports
Pick **Today**, **Yesterday**, **This week**, **This month**, **All time**, or set
your own dates. You get revenue, orders, average ticket, **units sold**, net of VAT,
VAT, cost of goods, **gross profit with margin %**, discounts, a sales-by-hour chart,
the payment split, per-product units/revenue/profit, category breakdown and daily
revenue — plus **Export to Excel** and a CSV option.

### 🍰 Products
Add, edit, hide or delete anything. Each product has an English name, an Arabic name,
a photo, a selling price and a **cost** — the cost is what makes the profit figures
work, so keep it accurate.

To change a photo: **Edit → Choose photo…**, pick any image from your computer. It is
automatically cropped square and shrunk to 400×400 so it stays small.

*Hide* removes a product from the register without losing its sales history.

### ⚙️ Settings
Shop details (printed on receipts), currency and VAT, receipt options, and data
backup. **Print receipts in both languages** puts English and Arabic on every line.

---

## Excel export

The **Export to Excel** button produces a real `.xlsx` file — not a CSV pretending to
be one. It opens directly in Excel, LibreOffice, Numbers and Google Sheets, and you
can copy its sheets straight into your own workbooks.

**From Orders** (respects the date filter and search box) you get four sheets:

| Sheet | What's in it |
|---|---|
| **Orders** | One row per sale: number, date, time, type, payment, items, subtotal, discount, net, VAT, total, cash received, change, cost, profit, customer, status — with a totals row |
| **Items** | One row per product sold, so you can pivot by item |
| **Product** | Totals per product: units, revenue, cost, profit |
| **Daily revenue** | Totals per day |

**From Reports** you get a summary sheet for the chosen date range, plus per-product,
per-day and per-category sheets.

Headers are frozen and bold, money columns are formatted to three decimals, and if
you export while the interface is in Arabic the sheets are labelled in Arabic and set
right-to-left. Voided orders are marked but never counted in any total.

---

## Printing

Any receipt printer Windows can see will work — printing goes through the normal
browser print dialog.

1. **Settings → Receipt** → choose 80 mm or 58 mm paper.
2. Click **Print a test receipt**.
3. In the dialog choose your printer, set margins to **None**, turn **off**
   "Headers and footers".
4. Tick **Save as default** if offered.

Only the receipt prints — the rest of the screen is never included. To skip the
dialog on a busy day, start Chrome or Edge with `--kiosk-printing`.

---

## Your data

Everything is saved in this browser on this computer, instantly, with no server.

**Clearing your browsing data deletes your sales history.** So:

- **Settings → Download backup** at the end of each week (a `.json` file with your
  products, orders and settings).
- Keep backups on a USB stick or cloud drive.
- **Restore backup** puts it all back, here or on another computer.
- Always open the app the same way, since the data is tied to how the page is opened.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `/` | Jump to the Register and focus search |
| `1` – `5` | Switch screens |
| `F2` | Open payment |
| `Enter` | Complete the sale (in the payment window) |
| `Esc` | Close any window |

---

## How the money is calculated

```
Subtotal        = sum of (price × quantity)
− Discount      = a percentage of the subtotal, or a fixed amount
+ Service       = optional percentage (0 by default)
= Total         ← what the customer pays
```

VAT is then **extracted** from that total, because menu prices include it:

```
Net of VAT      = Total ÷ 1.05
VAT             = Total − Net
Gross profit    = Net − (cost × quantity)
```

Untick *"Menu prices already include VAT"* in Settings to add VAT on top instead.
Every figure is rounded to the smallest currency unit at each step, so the receipt,
the reports and the Excel file always agree to the baisa.

---

## About the photos and the menu

Product names in both languages came from the Candiz online catalogue.

**Photos: 26 included, 63 removed.** Every catalogue photo was checked one by one.
63 of them showed the Candiz logo — printed on the cup, on the takeaway box, or (for
water, Kinza and the V60 Signature) the bare logo on a white background. All 63 were
deleted, so **no competitor branding appears anywhere in this system.** The 26 that
remain are plain plates, plain white boxes, a wooden board and a marble stand, with
no logo or brand text of any kind.

The 63 products without a photo show a tinted category icon instead — ☕ for hot
drinks, 🧊 for cold, 🧁 for sweets. It looks deliberate, not broken.

**To add your own photos:** Products → **Edit** on any item → **Choose photo…** Pick
any picture from your computer; it is cropped square and shrunk to 400×400
automatically. Your own photos are stored with your data and are never overwritten
by an app update.

The remaining 26 photos are still Candiz's own product shots. They are fine for
demonstrating the system, but replace them with your own before you trade.

Two tidy-ups were made during the import:

- **Mojito Signature** appeared twice at the same 0.700 price; it is included once.
- The hot **Matcha Latte** had no cost recorded, which would have shown a false 100%
  margin. It uses 0.500, matching the other hot matchas.

Cold drinks that share a name with a hot one are prefixed *Iced* (and *مثلج* in
Arabic) so the two never get confused on the register or in the reports.
