import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'twwasteful.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  nib TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'both' CHECK (role IN ('buyer','seller','both','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  material TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity_kg REAL NOT NULL CHECK(quantity_kg > 0),
  min_order_kg REAL NOT NULL CHECK(min_order_kg > 0),
  price_per_kg REAL NOT NULL CHECK(price_per_kg >= 0),
  city TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'Layak olah',
  non_b3_confirmed INTEGER NOT NULL DEFAULT 1 CHECK(non_b3_confirmed IN (0,1)),
  image_path TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','reserved','sold','archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  buyer_company_id INTEGER NOT NULL REFERENCES companies(id),
  seller_company_id INTEGER NOT NULL REFERENCES companies(id),
  quantity_kg REAL NOT NULL CHECK(quantity_kg > 0),
  proposed_price_per_kg REAL NOT NULL CHECK(proposed_price_per_kg >= 0),
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL UNIQUE REFERENCES offers(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  buyer_company_id INTEGER NOT NULL REFERENCES companies(id),
  seller_company_id INTEGER NOT NULL REFERENCES companies(id),
  quantity_kg REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK(status IN ('awaiting_payment','payment_review','paid','pickup_scheduled','completed','cancelled')),
  payment_reference TEXT,
  pickup_date TEXT,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT DEFAULT '/dashboard',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_listings_status_category ON listings(status, category);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_offers_seller_status ON offers(seller_company_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_status ON offers(buyer_company_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_company_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_company_id, status);
`);

export function notify(companyId, title, body, href = '/dashboard') {
  db.prepare('INSERT INTO notifications (company_id,title,body,href) VALUES (?,?,?,?)')
    .run(companyId, title, body, href);
}

export function seedDemoData() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM listings').get().count;
  if (count > 0) return;
  const insertCompany = db.prepare(`INSERT INTO companies (name,industry,address,city,contact_name,phone,verification_status)
    VALUES (?,?,?,?,?,?,?)`);
  const insertListing = db.prepare(`INSERT INTO listings
    (company_id,title,category,material,description,quantity_kg,min_order_kg,price_per_kg,city,pickup_address,condition)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const companies = [
    insertCompany.run('PT Sirkula Plastik Nusantara','Plastik & Polimer','Kawasan Industri KIIC, Jl. Maligi Raya','Karawang','Rizky Pratama','0812-0000-1001','verified').lastInsertRowid,
    insertCompany.run('PT Kertas Lestari Abadi','Kertas & Kemasan','Kawasan Industri Jababeka, Cikarang','Bekasi','Nadia Putri','0812-0000-1002','verified').lastInsertRowid,
    insertCompany.run('PT Metalindo Presisi','Logam & Manufaktur','Kawasan Industri Surya Cipta','Karawang','Fajar Nugraha','0812-0000-1003','pending').lastInsertRowid,
    insertCompany.run('CV Kayu Sumber Rezeki','Kayu & Furnitur','Telukjambe, Karawang','Karawang','Dimas Saputra','0812-0000-1004','verified').lastInsertRowid,
    insertCompany.run('PT Tekstil Hijau Indonesia','Tekstil & Garmen','Kawasan Industri MM2100','Bekasi','Ayu Lestari','0812-0000-1005','verified').lastInsertRowid
  ];
  const items = [
    [companies[0],'Biji Plastik PP Regrind','Plastik','Polypropylene (PP)','Sisa produksi PP yang telah dicacah dan dibersihkan. Cocok untuk proses injection molding dan produk plastik non-food.',2400,200,8500,'Karawang','Kawasan Industri KIIC, Karawang','Bersih, sudah dicacah'],
    [companies[1],'Kardus OCC Grade A','Kertas','Old Corrugated Containers (OCC)','Kardus bekas produksi dalam kondisi kering, dipres per bal. Siap untuk bahan baku kertas daur ulang.',5200,500,2200,'Bekasi','Jababeka, Cikarang, Bekasi','Kering, bal press'],
    [companies[2],'Potongan Aluminium 6061','Logam','Aluminium 6061','Potongan sisa proses machining, dipisahkan dari material lain. Spesifikasi dan foto dapat diminta sebelum transaksi.',850,100,28500,'Karawang','Surya Cipta, Karawang','Sortir, non-kontaminasi'],
    [companies[3],'Serbuk & Potongan Kayu','Kayu','Serbuk kayu campuran','Sisa pemotongan kayu produksi furnitur. Dapat digunakan untuk papan partikel atau bahan olahan lain.',1800,150,1200,'Karawang','Telukjambe, Karawang','Kering'],
    [companies[4],'Kain Katun Perca','Tekstil','Cotton offcuts','Sisa potongan kain katun dari produksi garmen. Warna campuran, sudah dipilah dan dikemas dalam karung.',680,50,6500,'Bekasi','MM2100, Bekasi','Sudah dipilah']
  ];
  const transaction = db.transaction(() => items.forEach((item) => insertListing.run(...item)));
  transaction();
}

export default db;
