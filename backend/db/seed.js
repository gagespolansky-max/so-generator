const { getDb } = require('./schema');
const db = getDb();

db.prepare('DELETE FROM order_lines').run();
db.prepare('DELETE FROM order_changes').run();
db.prepare('DELETE FROM orders').run();
db.prepare('DELETE FROM customers').run();
db.prepare('DELETE FROM styles').run();

// Customers
const insertCust = db.prepare(`
  INSERT INTO customers (customer_code,customer_name,default_ship_destination,
    nj_wh_rate,ca_wh_rate,terms_rate,cards_hangers_brand,suffocation_warning,
    pre_ticket,pre_pack,cards_hangers,top_samples)
  VALUES (@customer_code,@customer_name,@default_ship_destination,
    @nj_wh_rate,@ca_wh_rate,@terms_rate,@cards_hangers_brand,1,1,1,1,1)
`);
insertCust.run({ customer_code:'Walmart.com', customer_name:'WALMART', default_ship_destination:'DIRECT TO L.A', nj_wh_rate:0, ca_wh_rate:0.07, terms_rate:0.053, cards_hangers_brand:'TIME AND TRU' });
insertCust.run({ customer_code:'Target.com',  customer_name:'TARGET',  default_ship_destination:'DIRECT TO L.A', nj_wh_rate:0, ca_wh_rate:0.07, terms_rate:0.050, cards_hangers_brand:'UNIVERSAL THREAD' });
insertCust.run({ customer_code:'Amazon.com',  customer_name:'AMAZON',  default_ship_destination:'FOB / DTC',     nj_wh_rate:0, ca_wh_rate:0.05, terms_rate:0.040, cards_hangers_brand:'' });

// Styles
const insertStyle = db.prepare(`
  INSERT INTO styles (
    style_number,description,category,brand,available_colors,available_sizes,
    materials,country_of_origin,hts_code,
    wholesale_price,retail_price,first_cost,vendor,
    duty_pct,tariff1_pct,tariff2_pct,tariff3_pct,royalty_pct,
    agent_fee,freight,misc,shipping_mode,season,active
  ) VALUES (
    @style_number,@description,@category,@brand,@available_colors,@available_sizes,
    @materials,@country_of_origin,@hts_code,
    @wholesale_price,@retail_price,@first_cost,@vendor,
    @duty_pct,@tariff1_pct,@tariff2_pct,@tariff3_pct,@royalty_pct,
    @agent_fee,@freight,@misc,@shipping_mode,@season,1
  )
`);

const styles = [
  { style_number:'TT261189', description:'IRREGULAR BUCKLE BELT', category:'BELTS', brand:'TIME AND TRU',
    available_colors:['AL TAN','AL NATURAL','BLACK'], available_sizes:['S/M','L','XL','2XL','3XL'],
    materials:[{material:'PU Leather',pct:60},{material:'Polyester',pct:40}],
    country_of_origin:'China', hts_code:'4203.30.00',
    wholesale_price:4.05, retail_price:12.97, first_cost:1.47, vendor:'JUNBANG',
    duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'FW25' },
  { style_number:'TT261190', description:'FAUX RAFFIA STRETCH BELT', category:'BELTS', brand:'TIME AND TRU',
    available_colors:['AL NATURAL','BLACK','COGNAC'], available_sizes:['S/M','L/XL','2XL/3XL'],
    materials:[{material:'Polyester',pct:70},{material:'Spandex',pct:30}],
    country_of_origin:'China', hts_code:'6217.10.9005',
    wholesale_price:4.55, retail_price:12.97, first_cost:1.69, vendor:'JUNBANG',
    duty_pct:0.149, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.14, shipping_mode:'BOAT', season:'FW25' },
  { style_number:'TT261191', description:'WOVEN LEATHER BELT', category:'BELTS', brand:'TIME AND TRU',
    available_colors:['TAN','BLACK','BROWN'], available_sizes:['S/M','L/XL','2XL/3XL'],
    materials:[{material:'PU Leather',pct:80},{material:'Cotton',pct:20}],
    country_of_origin:'China', hts_code:'4203.30.00',
    wholesale_price:5.25, retail_price:14.97, first_cost:1.95, vendor:'JUNBANG',
    duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'FW25' },
  { style_number:'TT261192', description:'STRETCH CASUAL BELT', category:'BELTS', brand:'TIME AND TRU',
    available_colors:['BLACK','NAVY','OLIVE'], available_sizes:['S/M','L','XL','2XL','3XL'],
    materials:[{material:'Polyester',pct:65},{material:'Rubber',pct:25},{material:'Nylon',pct:10}],
    country_of_origin:'China', hts_code:'6117.80.8500',
    wholesale_price:3.75, retail_price:10.97, first_cost:1.25, vendor:'JUNBANG',
    duty_pct:0.146, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'FW25' },
  { style_number:'GE271101', description:'WEBBING BELT ASSORTMENT', category:'BELTS', brand:'GEORGE',
    available_colors:['MULTI','BLACK/GREY'], available_sizes:['S/M','L/XL','2XL/3XL'],
    materials:[{material:'Nylon',pct:75},{material:'Polyester',pct:25}],
    country_of_origin:'Vietnam', hts_code:'6217.10.9005',
    wholesale_price:3.50, retail_price:9.97, first_cost:1.15, vendor:'MINGFENG',
    duty_pct:0.149, tariff1_pct:0, tariff2_pct:0, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'SS26' },
  { style_number:'GE271102', description:'CANVAS BELT 3PK', category:'BELTS', brand:'GEORGE',
    available_colors:['NAVY MULTI','KHAKI MULTI'], available_sizes:['S/M','L/XL'],
    materials:[{material:'Cotton',pct:100}],
    country_of_origin:'Vietnam', hts_code:'6217.10.1000',
    wholesale_price:4.95, retail_price:13.97, first_cost:1.75, vendor:'MINGFENG',
    duty_pct:0.063, tariff1_pct:0, tariff2_pct:0, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'SS26' },
  { style_number:'TT271201', description:'PLAQUE BUCKLE BELT', category:'BELTS', brand:'TIME AND TRU',
    available_colors:['BLACK','COGNAC','NUDE'], available_sizes:['S/M','L','XL','2XL'],
    materials:[{material:'PU Leather',pct:70},{material:'Metal',pct:20},{material:'Polyester',pct:10}],
    country_of_origin:'China', hts_code:'4203.30.00',
    wholesale_price:5.75, retail_price:15.97, first_cost:2.15, vendor:'JUNBANG',
    duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'SS26' },
  { style_number:'TT271202', description:'CHAIN LINK BELT', category:'ACCESSORIES', brand:'TIME AND TRU',
    available_colors:['GOLD','SILVER'], available_sizes:['ONE SIZE'],
    materials:[{material:'Metal',pct:90},{material:'PVC',pct:10}],
    country_of_origin:'China', hts_code:'7117.19.9000',
    wholesale_price:6.50, retail_price:16.97, first_cost:2.45, vendor:'JUNBANG',
    duty_pct:0.110, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'AIR', season:'SS26' },
  { style_number:'TT261193', description:'SKINNY BELT 3PK', category:'BELTS', brand:'TIME AND TRU',
    available_colors:['BLACK/BROWN/TAN','BLACK/NAVY/GREY'], available_sizes:['S/M','L/XL','2XL/3XL'],
    materials:[{material:'PU Leather',pct:55},{material:'Polyester',pct:35},{material:'Spandex',pct:10}],
    country_of_origin:'China', hts_code:'4203.30.00',
    wholesale_price:4.25, retail_price:12.97, first_cost:1.55, vendor:'JUNBANG',
    duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'FW25' },
  { style_number:'GE271103', description:'REVERSIBLE LEATHER BELT', category:'BELTS', brand:'GEORGE',
    available_colors:['BLACK/BROWN','TAN/COGNAC'], available_sizes:['S','M','L','XL','2XL'],
    materials:[{material:'Leather',pct:90},{material:'Metal',pct:10}],
    country_of_origin:'India', hts_code:'4203.30.00',
    wholesale_price:6.25, retail_price:17.97, first_cost:2.35, vendor:'MINGFENG',
    duty_pct:0.027, tariff1_pct:0, tariff2_pct:0, tariff3_pct:0,
    royalty_pct:0, agent_fee:0, freight:0.15, misc:0.07, shipping_mode:'BOAT', season:'SS26' },
];

for (const s of styles) {
  insertStyle.run({
    ...s,
    available_colors: JSON.stringify(s.available_colors),
    available_sizes:  JSON.stringify(s.available_sizes),
    materials:        JSON.stringify(s.materials),
  });
}

// Sample orders
const o1 = db.prepare(`
  INSERT INTO orders (so_number,log_number,po_number,customer_id,salesperson,entered_by,
    order_date,ship_date,cancel_date,mabd,status,
    suffocation_warning,pre_ticket,pre_pack,cards_hangers,cards_hangers_brand,top_samples,ship_direct_la,
    pre_pack_details)
  VALUES ('5973754','10160','BULK',1,'KIM PORTANTE','GUNES ALICI',
    '2025-09-25','2026-01-13','1/23/2026 (WK 51)','1/23/2026 (WK 51)','exported',
    1,1,1,1,'TIME AND TRU',1,1,'1 Warehouse Pack / 36 Vendor Pack')
`).run();

const lines1 = [
  { style_number:'TT261189', color:'AL TAN', size:'S/M',      qty:108, sell_price:4.05, retail_price:12.97, vpo_number:'181413', first_cost:1.47, vendor:'JUNBANG', freight:0.15, misc:0.07, duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261189', color:'AL TAN', size:'L',         qty:72,  sell_price:4.05, retail_price:12.97, vpo_number:'181413', first_cost:1.47, vendor:'JUNBANG', freight:0.15, misc:0.07, duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261189', color:'AL TAN', size:'XL',        qty:72,  sell_price:4.05, retail_price:12.97, vpo_number:'181413', first_cost:1.47, vendor:'JUNBANG', freight:0.15, misc:0.07, duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261189', color:'AL TAN', size:'2XL',       qty:36,  sell_price:4.05, retail_price:12.97, vpo_number:'181413', first_cost:1.47, vendor:'JUNBANG', freight:0.15, misc:0.07, duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261189', color:'AL TAN', size:'3XL',       qty:36,  sell_price:4.05, retail_price:12.97, vpo_number:'181413', first_cost:1.47, vendor:'JUNBANG', freight:0.15, misc:0.07, duty_pct:0.027, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261190', color:'AL NATURAL', size:'S/M',   qty:72,  sell_price:4.55, retail_price:12.97, vpo_number:'181413', first_cost:1.69, vendor:'JUNBANG', freight:0.15, misc:0.14, duty_pct:0.149, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261190', color:'AL NATURAL', size:'L/XL',  qty:72,  sell_price:4.55, retail_price:12.97, vpo_number:'181413', first_cost:1.69, vendor:'JUNBANG', freight:0.15, misc:0.14, duty_pct:0.149, tariff1_pct:0.25, tariff2_pct:0.20 },
  { style_number:'TT261190', color:'AL NATURAL', size:'2XL/3XL', qty:72, sell_price:4.55, retail_price:12.97, vpo_number:'181413', first_cost:1.69, vendor:'JUNBANG', freight:0.15, misc:0.14, duty_pct:0.149, tariff1_pct:0.25, tariff2_pct:0.20 },
];
const insLine = db.prepare(`INSERT INTO order_lines (order_id,line_number,style_number,color,size,qty,sell_price,retail_price,vpo_number,first_cost,vendor,freight,misc,duty_pct,tariff1_pct,tariff2_pct,tariff3_pct,royalty_pct,shipping_mode) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,'BOAT')`);
lines1.forEach((l, i) => insLine.run(o1.lastInsertRowid,i+1,l.style_number,l.color,l.size,l.qty,l.sell_price,l.retail_price,l.vpo_number,l.first_cost,l.vendor,l.freight,l.misc,l.duty_pct,l.tariff1_pct,l.tariff2_pct));

const o2 = db.prepare(`
  INSERT INTO orders (so_number,log_number,po_number,customer_id,salesperson,entered_by,
    order_date,ship_date,cancel_date,mabd,status,
    suffocation_warning,pre_ticket,pre_pack,cards_hangers,cards_hangers_brand,top_samples,ship_direct_la,
    pre_pack_details)
  VALUES ('5973800','10175','BULK',2,'KIM PORTANTE','GUNES ALICI',
    '2025-10-01','2026-02-01','2/15/2026 (WK 7)','2/15/2026 (WK 7)','confirmed',
    1,1,1,1,'UNIVERSAL THREAD',1,1,'1 Warehouse Pack / 36 Vendor Pack')
`).run();

const lines2 = [
  { size:'S/M', qty:144 }, { size:'L', qty:144 }, { size:'XL', qty:72 }, { size:'2XL', qty:36 },
];
lines2.forEach((l, i) => insLine.run(o2.lastInsertRowid,i+1,'TT271201','BLACK',l.size,l.qty,5.75,15.97,'181500',2.15,'JUNBANG',0.15,0.07,0.027,0.25,0.20));

// Sample change log for order 2
db.prepare(`INSERT INTO order_changes (order_id,changed_by,change_type,summary) VALUES (?,?,?,?)`).run(o2.lastInsertRowid,'KIM PORTANTE','create','Order created with 4 lines');
db.prepare(`INSERT INTO order_changes (order_id,changed_by,change_type,summary) VALUES (?,?,?,?)`).run(o2.lastInsertRowid,'GUNES ALICI','update','Ship Date changed from "2026-01-20" to "2026-02-01"; Cancel Date changed from "2/1/2026 (WK 5)" to "2/15/2026 (WK 7)"');

console.log('Seeded: 3 customers, 10 styles, 2 orders, 12 lines');
