# Local Setup

## MySQL Setup

1. Install MySQL 8.0+ locally (https://dev.mysql.com/downloads/mysql/)

2. Create database and user:
   ```sql
   CREATE DATABASE so_generator CHARACTER SET utf8mb4;
   CREATE USER 'so_app'@'localhost' IDENTIFIED BY 'soapp_password';
   GRANT ALL PRIVILEGES ON so_generator.* TO 'so_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Edit `backend/.env` if you need different credentials (defaults match above)

4. Install dependencies and start:
   ```
   cd backend && npm install && npm start
   ```
   The schema creates automatically on first run.

5. (Optional) Seed sample data:
   ```
   node db/seed.js
   ```

## Starting the app

Terminal 1:
```
cd backend && npm start
```

Terminal 2:
```
cd frontend && npm run dev
```

Open: http://localhost:5173

## HTS Codes

The app includes a built-in HTS code reference for apparel accessories (belts, jewelry, scarves, etc.).

- Browse/search: GET /api/hts/search?q=belt
- Auto-suggest from style attributes: GET /api/hts/suggest?category=BELTS&material=leather&coo=China
- Lookup specific code: GET /api/hts/4203.30.00

In the Style Catalog, use the "Auto-suggest" button in the HTS Classification section to get recommended codes based on the style's category, primary material, and country of origin.

## Change Log

All order edits (PO #, SO #, ship date, cancel date, MABD, status, salesperson changes) are automatically recorded in the change log. View them on Step 4 (Review) of any saved order.
