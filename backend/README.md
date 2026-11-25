# MediPOS API

REST API for MediPOS, built with Node.js, Express 5, MongoDB (Mongoose) and JWT sign-in.
The Next.js app in the parent folder uses it for all pharmacy data.

## Run it locally

Requires Node.js 22.9 or newer.

```bash
cd backend
npm install
```

**Without a database** (quickest way to try it): starts an in-memory MongoDB with the demo data. Everything is lost when it stops.

```bash
npm run dev:memory
```

**With MongoDB Atlas**:

1. Copy `.env.example` to `.env` and fill in `MONGODB_URI`, `JWT_SECRET` and `SEED_STAFF_PASSWORD`.
   In Atlas, also allow your IP under *Network Access*.
2. Load the demo data (first time only; `--force` wipes and reloads an existing database):
   ```bash
   npm run seed
   ```
3. Start the API on http://localhost:4000:
   ```bash
   npm run dev
   ```

Then run the frontend from the parent folder with `NEXT_PUBLIC_API_URL=http://localhost:4000` in `.env.local`, and sign in.

## Demo logins

All demo staff share the password you set in `SEED_STAFF_PASSWORD` (`medipos-demo` for `dev:memory`).

| Email | Role | Can |
|---|---|---|
| michael.carter@medipos.pk | Admin | Everything, including staff and settings |
| rabia.anwar@medipos.pk | Pharmacist | Sell, refund, verify and dispense prescriptions |
| kashif.ali@medipos.pk | Cashier | Sell, add and edit customers |
| tariq.m@medipos.pk | Inventory Manager | Medicines, categories, stock, suppliers, purchase orders |
| noor.ua@medipos.pk | Pharmacist (inactive) | Cannot sign in |

Every signed-in user can read all data. The server enforces these permissions; the UI does not hide buttons yet,
so a refused action shows an error message.

## Tests

```bash
npm test
```

Runs the API against a throwaway in-memory MongoDB replica set (downloaded on first run). Your Atlas data is never touched.

## API

All routes are under `/api` and, apart from health and login, need `Authorization: Bearer <token>`.

| Method and path | Who | What |
|---|---|---|
| `GET /health` | anyone | Liveness check |
| `POST /auth/login` | anyone | `{ email, password }` → `{ token, user }` (20 tries per 15 min per IP) |
| `GET /auth/me` | signed in | Current user |
| `GET /bootstrap` | signed in | Every collection plus settings, in one response |
| `GET /{categories,medicines,suppliers,purchases,customers,sales,prescriptions,staff,movements,activity}` | signed in | List |
| `GET /{collection}/:id` | signed in | One record |
| `POST/PATCH/DELETE /categories`, `/medicines` | Admin, Inventory | Catalogue |
| `POST /medicines/:id/adjust-stock` | Admin, Inventory | `{ delta, type, reference }` |
| `POST/PATCH/DELETE /suppliers` | Admin, Inventory | Suppliers |
| `POST /purchases`, `PATCH /purchases/:id/status`, `POST /purchases/:id/receive` | Admin, Inventory | Purchase orders |
| `POST /sales` | Admin, Pharmacist, Cashier | Sale; prices and totals are worked out on the server |
| `POST /sales/:id/refund` | Admin, Pharmacist | Full refund |
| `POST/PATCH /customers`, `POST /customers/:id/redeem` | Admin, Pharmacist, Cashier | Customers and loyalty |
| `DELETE /customers/:id` | Admin | |
| `POST /prescriptions`, `PATCH /prescriptions/:id/status` | Admin, Pharmacist | Verify, reject, dispense |
| `POST/PATCH/DELETE /staff` | Admin | Staff accounts and passwords |
| `GET /settings`, `PATCH /settings` | signed in / Admin | Store settings |
| `POST /demo/reset` | Admin | Only when `ALLOW_DEMO_RESET=true`; keeps staff logins |

Writes answer with `{ changes, removed }`: the records that changed, in full, and the ids that were deleted.

### Business rules the server enforces

- A sale fails as a whole if any line is short of stock; nothing is taken.
- Sale and purchase-order numbers come from server-side counters, so two counters never get the same number.
- A refund puts stock back and reverses the customer's spend and loyalty points. A sale can be refunded once.
- Purchase orders: Draft → Pending → Partially Received → Received; only Draft or Pending can be cancelled.
- Prescriptions: Pending → Verified → Dispensed, or Rejected. Dispensing takes stock.
- Categories in use, and suppliers linked to medicines or orders, cannot be deleted.
- Admins cannot delete themselves or change their own role or status.
- Deactivating a staff member signs them out on their next request.

## Deploy

The API needs a Node host; Vercel hosts only the frontend. Render (free web service) works:

1. New Web Service from this GitHub repo, **Root Directory** `backend`, build `npm install`, start `npm start`.
2. Environment: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN=https://medipos-peach.vercel.app`, `TRUST_PROXY=1`.
3. In Atlas *Network Access*, allow the host (or `0.0.0.0/0` with a strong database password).
4. Seed once from your machine: `npm run seed` with the same `MONGODB_URI`.
5. In Vercel, set `NEXT_PUBLIC_API_URL` to the Render URL and redeploy the frontend.
