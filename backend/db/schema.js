const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'so-generator.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS styles (
      style_number TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'ACCESSORIES',
      brand TEXT DEFAULT '',
      available_colors TEXT DEFAULT '[]',
      available_sizes TEXT DEFAULT '[]',
      materials TEXT DEFAULT '[]',
      country_of_origin TEXT DEFAULT '',
      hts_code TEXT DEFAULT '',
      wholesale_price REAL DEFAULT 0,
      retail_price REAL DEFAULT 0,
      first_cost REAL DEFAULT 0,
      vendor TEXT DEFAULT '',
      duty_pct REAL DEFAULT 0.146,
      tariff1_pct REAL DEFAULT 0.075,
      tariff2_pct REAL DEFAULT 0.200,
      tariff3_pct REAL DEFAULT 0,
      royalty_pct REAL DEFAULT 0,
      agent_fee REAL DEFAULT 0,
      freight REAL DEFAULT 0.15,
      misc REAL DEFAULT 0.07,
      shipping_mode TEXT DEFAULT 'BOAT',
      season TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      default_ship_destination TEXT DEFAULT 'DIRECT TO L.A',
      nj_wh_rate REAL DEFAULT 0,
      ca_wh_rate REAL DEFAULT 0.07,
      terms_rate REAL DEFAULT 0.053,
      notes TEXT DEFAULT '',
      suffocation_warning INTEGER DEFAULT 1,
      pre_ticket INTEGER DEFAULT 1,
      pre_pack INTEGER DEFAULT 1,
      pre_pack_label INTEGER DEFAULT 0,
      pre_pack_details TEXT DEFAULT '1 Warehouse Pack / 36 Vendor Pack',
      cards_hangers INTEGER DEFAULT 1,
      cards_hangers_brand TEXT DEFAULT '',
      sewn_in_label INTEGER DEFAULT 0,
      testing_required INTEGER DEFAULT 0,
      testing_procedure TEXT DEFAULT '',
      top_samples INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      so_number TEXT UNIQUE,
      log_number TEXT DEFAULT '',
      po_number TEXT DEFAULT '',
      customer_id INTEGER REFERENCES customers(id),
      salesperson TEXT DEFAULT '',
      entered_by TEXT DEFAULT '',
      order_date TEXT DEFAULT '',
      ship_date TEXT DEFAULT '',
      cancel_date TEXT DEFAULT '',
      mabd TEXT DEFAULT '',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','confirmed','exported')),
      suffocation_warning INTEGER DEFAULT 1,
      pre_ticket INTEGER DEFAULT 1,
      pre_pack INTEGER DEFAULT 1,
      pre_pack_label INTEGER DEFAULT 0,
      pre_pack_details TEXT DEFAULT '',
      cards_hangers INTEGER DEFAULT 1,
      cards_hangers_brand TEXT DEFAULT '',
      sewn_in_label INTEGER DEFAULT 0,
      testing_required INTEGER DEFAULT 0,
      testing_procedure TEXT DEFAULT '',
      ship_direct_nj INTEGER DEFAULT 0,
      ship_direct_la INTEGER DEFAULT 1,
      ship_fob_dtc INTEGER DEFAULT 0,
      in_stock_order INTEGER DEFAULT 0,
      closeout_order INTEGER DEFAULT 0,
      top_samples INTEGER DEFAULT 1,
      pre_production_samples INTEGER DEFAULT 0,
      other_notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      line_number INTEGER,
      style_number TEXT REFERENCES styles(style_number),
      color TEXT DEFAULT '',
      size TEXT DEFAULT '',
      ppk_ctg INTEGER DEFAULT 0,
      qty INTEGER DEFAULT 0,
      sell_price REAL DEFAULT 0,
      retail_price REAL DEFAULT 0,
      vpo_number TEXT DEFAULT '',
      first_cost REAL DEFAULT 0,
      vendor TEXT DEFAULT '',
      agent_fee REAL DEFAULT 0,
      freight REAL DEFAULT 0.15,
      misc REAL DEFAULT 0.07,
      duty_pct REAL DEFAULT 0.146,
      tariff1_pct REAL DEFAULT 0.075,
      tariff2_pct REAL DEFAULT 0.200,
      tariff3_pct REAL DEFAULT 0,
      royalty_pct REAL DEFAULT 0,
      shipping_mode TEXT DEFAULT 'BOAT',
      remarks TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS order_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      changed_by TEXT DEFAULT 'System',
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      change_type TEXT DEFAULT 'update',
      summary TEXT,
      diff_json TEXT
    );

    CREATE TABLE IF NOT EXISTS order_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      author TEXT NOT NULL DEFAULT 'Anonymous',
      body TEXT NOT NULL,
      line_style_number TEXT DEFAULT NULL,
      mentions TEXT DEFAULT '[]',
      resolved INTEGER DEFAULT 0,
      resolved_by TEXT DEFAULT NULL,
      resolved_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blanket_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT DEFAULT '',
      customer_id INTEGER REFERENCES customers(id),
      description TEXT DEFAULT '',
      salesperson TEXT DEFAULT '',
      total_committed_qty INTEGER DEFAULT 0,
      cancel_date_start TEXT DEFAULT '',
      cancel_date_end TEXT DEFAULT '',
      status TEXT DEFAULT 'open' CHECK(status IN ('open','partial','fulfilled','closed')),
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blanket_order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blanket_order_id INTEGER NOT NULL REFERENCES blanket_orders(id) ON DELETE CASCADE,
      style_number TEXT DEFAULT '',
      color TEXT DEFAULT '',
      total_qty INTEGER DEFAULT 0,
      sell_price REAL DEFAULT 0,
      first_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migrations for existing databases
  const addCol = (table, col, def) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
  };
  addCol('styles', 'materials', 'TEXT DEFAULT "[]"');
  addCol('styles', 'country_of_origin', 'TEXT DEFAULT ""');
  addCol('styles', 'hts_code', 'TEXT DEFAULT ""');
  addCol('styles', 'tariff3_pct', 'REAL DEFAULT 0');
  addCol('order_lines', 'tariff3_pct', 'REAL DEFAULT 0');
  addCol('order_lines', 'price_snapshot_date', 'TEXT DEFAULT NULL');
  addCol('orders', 'parent_blanket_id', 'INTEGER REFERENCES blanket_orders(id) DEFAULT NULL');
}

module.exports = { getDb };
