# SweetCrumbs — Online Bakery Shop Management System

A full-stack student project with a responsive storefront, Express backend, SQLite database, login/registration, cart, checkout, order tracking, product reviews, coupons, and an admin dashboard. The scope follows the provided SRS: product browsing, cart/order management, payment-method selection, delivery status, administration, reports and reviews.

## Requirements
- Node.js 22 LTS or Node.js 24 (your installed Node.js v24.22.0 is suitable)
- Internet connection for the first dependency installation
- VS Code (recommended)

## Run in VS Code
1. Extract this ZIP and open the `bakery-shop` folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Run:
   ```bash
   npm install
   npm start
   ```
4. Open **http://localhost:3000** in your browser.
5. The SQLite database (`bakery.db`) is created automatically in this folder on first start. Products and demo coupons are seeded automatically.

## Demo administrator
- Email: `admin@sweetcrumbs.local`
- Password: `Admin@123`

Log in with the admin account and choose the account icon to open the admin dashboard. You can manage products and stock, update order statuses, view customers, and see sales reports.

## Main features
- Responsive bakery storefront with categories, search, sorting, product detail and ratings display
- Customer registration/login and session authentication
- Cart quantity controls, stock checks, coupons (`SWEET10`, `BAKE50`), delivery fee and free delivery on qualifying orders
- Checkout, unique order code, order history, eligible cancellation and stock restoration
- Admin: create/edit/hide products, view/update orders, customers and sales reports
- Delivery partner API/dashboard flow for ready-for-dispatch orders
- SQLite persistence; password hashes stored with bcrypt
- Review submission is limited to customers who have a delivered order for the product

## Important project/demo notes
- **Payments are simulated.** COD is recorded as pay-on-delivery; UPI/card choices are demo confirmations only. This project does not collect card details and is not connected to a real payment gateway.
- Delivery status is managed by the administrator in the dashboard. A delivery-role account can use the delivery API/dashboard, but there is no public delivery-partner registration screen yet.
- Email/SMS notifications, GPS live tracking, production-grade session storage, HTTPS setup, password reset, and deployment hardening require external service/configuration and are not enabled in this local demo.
- The default admin credentials are for local coursework only. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` environment variables before sharing or deploying the app. Use HTTPS and a persistent session store in production.
- The default Express session MemoryStore is intended for local demonstration only.

## Environment variables (optional)
PowerShell:
```powershell
$env:PORT="3000"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="Use-A-Strong-Password"
$env:SESSION_SECRET="a-long-random-secret"
npm start
```

## Troubleshooting
- `npm` not recognized: install Node.js LTS, restart VS Code, and try `node -v` / `npm -v`.
- Port already in use: run `$env:PORT="3001"` in PowerShell before `npm start`, then visit `http://localhost:3001`.
- If `npm install` fails while building `better-sqlite3`, make sure this project has the updated dependency (`better-sqlite3` 12.x) in `package.json`. Close apps that may lock `node_modules`, remove the incomplete `node_modules` folder, then run `npm install` again. On Windows, use Command Prompt in VS Code if PowerShell blocks `npm.ps1`.
- To reset the demo database, stop the server and delete `bakery.db` (this deletes demo orders/accounts); start the server again to recreate it.
