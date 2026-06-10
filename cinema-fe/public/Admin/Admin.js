/* ============================================================
   CINEMA T&M - ADMIN PANEL  |  script.js
   ============================================================ */

// ──────────────────────────────────────────────
// 1. SEED DATA
// ──────────────────────────────────────────────
const SEED = {
  nguoidung: [
    { id:1, username:'admin',    email:'admin@cinema.com',   password:'admin123', role:'admin', status:'active',   createdAt:'01/01/2024' },
    { id:2, username:'staff01',  email:'staff01@cinema.com', password:'123456',   role:'user',  status:'active',   createdAt:'15/02/2024' },
    { id:3, username:'staff02',  email:'staff02@cinema.com', password:'123456',   role:'user',  status:'active',   createdAt:'20/03/2024' },
    { id:4, username:'viewer01', email:'viewer01@cinema.com',password:'123456',   role:'user',  status:'inactive', createdAt:'05/04/2024' },
    { id:5, username:'viewer02', email:'viewer02@cinema.com',password:'123456',   role:'user',  status:'active',   createdAt:'10/05/2024' }
  ],
  nhanvien: [
    { id:1, name:'Nguy\u1ec5n V\u0103n An',   email:'vanan@cinema.com',    phone:'0901234567', position:'Thu ng\u00e2n',            status:'\u0110ang l\u00e0m', hireDate:'01/01/2023' },
    { id:2, name:'Tr\u1ea7n Th\u1ecb B\u00ecnh', email:'thibinh@cinema.com',  phone:'0912345678', position:'Nh\u00e2n vi\u00ean chi\u1ebfu phim', status:'\u0110ang l\u00e0m', hireDate:'15/03/2023' },
    { id:3, name:'L\u00ea V\u0103n C\u01b0\u1eddng', email:'vancuong@cinema.com', phone:'0923456789', position:'B\u1ea3o v\u1ec7',             status:'\u0110ang l\u00e0m', hireDate:'01/06/2023' },
    { id:4, name:'Ph\u1ea1m Th\u1ecb Dung',   email:'thidung@cinema.com',  phone:'0934567890', position:'Qu\u1ea3n l\u00fd',            status:'\u0110ang l\u00e0m', hireDate:'01/02/2022' },
    { id:5, name:'Ho\u00e0ng V\u0103n Em',    email:'vanem@cinema.com',    phone:'0945678901', position:'Thu ng\u00e2n',            status:'Ngh\u1ec9 ph\u00e9p', hireDate:'10/09/2023' }
  ],
  khachhang: [
    { id:1, name:'Nguy\u1ec5n Minh Ch\u00e2u', email:'minhchau@gmail.com', phone:'0901111111', points:150, registeredAt:'01/03/2024' },
    { id:2, name:'Tr\u1ea7n B\u1ea3o Long',    email:'baolong@gmail.com',  phone:'0902222222', points:320, registeredAt:'15/03/2024' },
    { id:3, name:'L\u00ea Th\u1ecb Hoa',       email:'thihoa@gmail.com',   phone:'0903333333', points:80,  registeredAt:'20/03/2024' },
    { id:4, name:'Ph\u1ea1m Anh Tu\u1ea5n',   email:'anhtuan@gmail.com',  phone:'0904444444', points:500, registeredAt:'01/04/2024' },
    { id:5, name:'V\u0169 Th\u1ecb Mai',       email:'thimai@gmail.com',   phone:'0905555555', points:200, registeredAt:'10/04/2024' },
    { id:6, name:'\u0110\u1eb7ng Ho\u00e0i Nam', email:'hoainam@gmail.com', phone:'0906666666', points:420, registeredAt:'15/04/2024' },
    { id:7, name:'Ng\u00f4 Th\u1ecb Lan',      email:'thilan@gmail.com',   phone:'0907777777', points:60,  registeredAt:'01/05/2024' },
    { id:8, name:'B\u00f9i V\u0103n Hi\u1ebfu', email:'vanhieu@gmail.com', phone:'0908888888', points:280, registeredAt:'10/05/2024' }
  ],
  phim: [
    { id:1, title:'Avengers: Endgame',       genre:'H\u00e0nh \u0111\u1ed9ng, Phi\u00eau l\u01b0u', duration:182, releaseDate:'2024-01-15', director:'Anthony Russo',    actors:'Robert Downey Jr., Chris Evans',     description:'H\u00e0nh tr\u00ecnh c\u1ee7a c\u00e1c Avengers \u0111\u1ec3 \u0111\u00e1nh b\u1ea1i Thanos.', status:'\u0110ang chi\u1ebfu', poster:'' },
    { id:2, title:'Spider-Man: No Way Home', genre:'H\u00e0nh \u0111\u1ed9ng, Vi\u1ec5n t\u01b0\u1edfng',  duration:148, releaseDate:'2024-02-10', director:'Jon Watts',         actors:'Tom Holland, Zendaya',               description:'Peter Parker ph\u1ea3i chi\u1ebfn \u0111\u1ea5u khi \u0111a v\u0169 tr\u1ee5 m\u1edf ra.', status:'\u0110ang chi\u1ebfu', poster:'' },
    { id:3, title:'The Dark Knight',         genre:'H\u00e0nh \u0111\u1ed9ng, T\u1ed9i ph\u1ea1m',   duration:152, releaseDate:'2024-03-20', director:'Christopher Nolan', actors:'Christian Bale, Heath Ledger',       description:'Batman \u0111\u1ed1i \u0111\u1ea7u v\u1edbi Joker \u1edf Gotham City.', status:'\u0110ang chi\u1ebfu', poster:'' },
    { id:4, title:'Inception',               genre:'Vi\u1ec5n t\u01b0\u1edfng, H\u00e0nh \u0111\u1ed9ng',  duration:148, releaseDate:'2024-04-05', director:'Christopher Nolan', actors:'Leonardo DiCaprio, J. Gordon-Levitt',description:'C\u00e2u chuy\u1ec7n v\u1ec1 th\u1ebf gi\u1edbi gi\u1ea5c m\u01a1.', status:'S\u1eafp chi\u1ebfu', poster:'' },
    { id:5, title:'Interstellar',            genre:'Vi\u1ec5n t\u01b0\u1edfng, Drama',    duration:169, releaseDate:'2024-05-15', director:'Christopher Nolan', actors:'Matthew McConaughey, Anne Hathaway', description:'Cu\u1ed9c h\u00e0nh tr\u00ecnh v\u0169 tr\u1ee5 t\u00ecm ki\u1ebfm ng\u00f4i nh\u00e0 m\u1edbi.', status:'S\u1eafp chi\u1ebfu', poster:'' },
    { id:6, title:'Parasite',                genre:'Drama, Thriller',        duration:132, releaseDate:'2023-12-01', director:'Bong Joon-ho',      actors:'Song Kang-ho, Lee Sun-kyun',         description:'K\u00fd sinh tr\u00f9ng - b\u1ed9 phim v\u1ec1 s\u1ef1 b\u1ea5t b\u00ecnh \u0111\u1eb3ng x\u00e3 h\u1ed9i.', status:'Ng\u1eebng chi\u1ebfu', poster:'' }
  ],
  phongchieu: [
    { id:1, name:'Ph\u00f2ng 1 - Cinema A', capacity:100, type:'2D',   status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:2, name:'Ph\u00f2ng 2 - Cinema B', capacity:80,  type:'3D',   status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:3, name:'Ph\u00f2ng 3 - IMAX',     capacity:150, type:'IMAX', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:4, name:'Ph\u00f2ng 4 - 4DX',      capacity:60,  type:'4DX',  status:'B\u1ea3o tr\u00ec' }
  ],
  suatchieu: [
    { id:1, movieId:1, movieTitle:'Avengers: Endgame',       roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', date:'2024-06-08', time:'10:00', price:90000,  status:'\u0110ang b\u00e1n' },
    { id:2, movieId:1, movieTitle:'Avengers: Endgame',       roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', date:'2024-06-08', time:'13:00', price:100000, status:'\u0110ang b\u00e1n' },
    { id:3, movieId:2, movieTitle:'Spider-Man: No Way Home', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', date:'2024-06-08', time:'15:30', price:90000,  status:'\u0110ang b\u00e1n' },
    { id:4, movieId:3, movieTitle:'The Dark Knight',         roomId:3, roomName:'Ph\u00f2ng 3 - IMAX',     date:'2024-06-09', time:'18:00', price:150000, status:'S\u1eafp chi\u1ebfu' },
    { id:5, movieId:4, movieTitle:'Inception',               roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', date:'2024-06-10', time:'20:00', price:100000, status:'S\u1eafp chi\u1ebfu' },
    { id:6, movieId:2, movieTitle:'Spider-Man: No Way Home', roomId:3, roomName:'Ph\u00f2ng 3 - IMAX',     date:'2024-06-07', time:'09:00', price:150000, status:'\u0110\u00e3 chi\u1ebfu' },
    { id:7, movieId:1, movieTitle:'Avengers: Endgame',       roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', date:'2024-06-07', time:'14:00', price:90000,  status:'\u0110\u00e3 chi\u1ebfu' },
    { id:8, movieId:6, movieTitle:'Parasite',                roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', date:'2024-06-05', time:'20:00', price:90000,  status:'\u0110\u00e3 chi\u1ebfu' }
  ],
  ve: [
    { id:1,  code:'VE001', customerId:1, customerName:'Nguy\u1ec5n Minh Ch\u00e2u', showtimeId:7, movieTitle:'Avengers: Endgame',       seatCode:'A1', price:90000,  status:'\u0110\u00e3 thanh to\u00e1n', createdAt:'07/06/2024' },
    { id:2,  code:'VE002', customerId:2, customerName:'Tr\u1ea7n B\u1ea3o Long',    showtimeId:7, movieTitle:'Avengers: Endgame',       seatCode:'A2', price:90000,  status:'\u0110\u00e3 thanh to\u00e1n', createdAt:'07/06/2024' },
    { id:3,  code:'VE003', customerId:3, customerName:'L\u00ea Th\u1ecb Hoa',       showtimeId:6, movieTitle:'Spider-Man: No Way Home', seatCode:'B3', price:150000, status:'\u0110\u00e3 thanh to\u00e1n', createdAt:'07/06/2024' },
    { id:4,  code:'VE004', customerId:4, customerName:'Ph\u1ea1m Anh Tu\u1ea5n',   showtimeId:8, movieTitle:'Parasite',                seatCode:'C1', price:90000,  status:'\u0110\u00e3 thanh to\u00e1n', createdAt:'05/06/2024' },
    { id:5,  code:'VE005', customerId:5, customerName:'V\u0169 Th\u1ecb Mai',       showtimeId:1, movieTitle:'Avengers: Endgame',       seatCode:'A3', price:90000,  status:'\u0110\u00e3 \u0111\u1eb7t',   createdAt:'08/06/2024' },
    { id:6,  code:'VE006', customerId:6, customerName:'\u0110\u1eb7ng Ho\u00e0i Nam', showtimeId:2, movieTitle:'Avengers: Endgame',     seatCode:'B1', price:100000, status:'\u0110\u00e3 \u0111\u1eb7t',   createdAt:'08/06/2024' },
    { id:7,  code:'VE007', customerId:1, customerName:'Nguy\u1ec5n Minh Ch\u00e2u', showtimeId:3, movieTitle:'Spider-Man: No Way Home', seatCode:'A5', price:90000,  status:'\u0110\u00e3 \u0111\u1eb7t',   createdAt:'08/06/2024' },
    { id:8,  code:'VE008', customerId:2, customerName:'Tr\u1ea7n B\u1ea3o Long',    showtimeId:4, movieTitle:'The Dark Knight',         seatCode:'E1', price:150000, status:'\u0110\u00e3 \u0111\u1eb7t',   createdAt:'08/06/2024' },
    { id:9,  code:'VE009', customerId:7, customerName:'Ng\u00f4 Th\u1ecb Lan',      showtimeId:6, movieTitle:'Spider-Man: No Way Home', seatCode:'C2', price:150000, status:'\u0110\u00e3 h\u1ee7y',   createdAt:'07/06/2024' },
    { id:10, code:'VE010', customerId:8, customerName:'B\u00f9i V\u0103n Hi\u1ebfu', showtimeId:8, movieTitle:'Parasite',              seatCode:'D3', price:90000,  status:'\u0110\u00e3 thanh to\u00e1n', createdAt:'05/06/2024' }
  ],
  hoadon: [
    { id:1,  code:'HD001', customerId:1, customerName:'Nguy\u1ec5n Minh Ch\u00e2u', totalAmount:90000,  paymentMethod:'Ti\u1ec1n m\u1eb7t',    createdAt:'15/01/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:2,  code:'HD002', customerId:2, customerName:'Tr\u1ea7n B\u1ea3o Long',    totalAmount:180000, paymentMethod:'Chuy\u1ec3n kho\u1ea3n', createdAt:'20/02/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:3,  code:'HD003', customerId:3, customerName:'L\u00ea Th\u1ecb Hoa',       totalAmount:150000, paymentMethod:'Th\u1ebb t\u00edn d\u1ee5ng', createdAt:'10/03/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:4,  code:'HD004', customerId:4, customerName:'Ph\u1ea1m Anh Tu\u1ea5n',   totalAmount:90000,  paymentMethod:'Ti\u1ec1n m\u1eb7t',    createdAt:'05/04/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:5,  code:'HD005', customerId:5, customerName:'V\u0169 Th\u1ecb Mai',       totalAmount:90000,  paymentMethod:'Chuy\u1ec3n kho\u1ea3n', createdAt:'12/04/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:6,  code:'HD006', customerId:6, customerName:'\u0110\u1eb7ng Ho\u00e0i Nam', totalAmount:200000, paymentMethod:'V\u00ed \u0111i\u1ec7n t\u1eed', createdAt:'18/05/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:7,  code:'HD007', customerId:7, customerName:'Ng\u00f4 Th\u1ecb Lan',      totalAmount:150000, paymentMethod:'Th\u1ebb t\u00edn d\u1ee5ng', createdAt:'07/06/2024', status:'\u0110\u00e3 h\u1ee7y' },
    { id:8,  code:'HD008', customerId:8, customerName:'B\u00f9i V\u0103n Hi\u1ebfu', totalAmount:90000,  paymentMethod:'Ti\u1ec1n m\u1eb7t',    createdAt:'05/06/2024', status:'\u0110\u00e3 thanh to\u00e1n' },
    { id:9,  code:'HD009', customerId:1, customerName:'Nguy\u1ec5n Minh Ch\u00e2u', totalAmount:90000,  paymentMethod:'Chuy\u1ec3n kho\u1ea3n', createdAt:'08/06/2024', status:'Ch\u1edd thanh to\u00e1n' },
    { id:10, code:'HD010', customerId:2, customerName:'Tr\u1ea7n B\u1ea3o Long',    totalAmount:250000, paymentMethod:'Th\u1ebb t\u00edn d\u1ee5ng', createdAt:'08/06/2024', status:'Ch\u1edd thanh to\u00e1n' }
  ],
  ghe: [
    { id:1,  code:'A1', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'A', col:1, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:2,  code:'A2', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'A', col:2, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:3,  code:'A3', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'A', col:3, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:4,  code:'A4', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'A', col:4, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:5,  code:'A5', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'A', col:5, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:6,  code:'B1', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'B', col:1, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:7,  code:'B2', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'B', col:2, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:8,  code:'B3', roomId:1, roomName:'Ph\u00f2ng 1 - Cinema A', row:'B', col:3, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:9,  code:'C1', roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', row:'C', col:1, type:'VIP',        status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:10, code:'C2', roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', row:'C', col:2, type:'VIP',        status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:11, code:'D1', roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', row:'D', col:1, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:12, code:'D2', roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', row:'D', col:2, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:13, code:'D3', roomId:2, roomName:'Ph\u00f2ng 2 - Cinema B', row:'D', col:3, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:14, code:'E1', roomId:3, roomName:'Ph\u00f2ng 3 - IMAX',     row:'E', col:1, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:15, code:'E2', roomId:3, roomName:'Ph\u00f2ng 3 - IMAX',     row:'E', col:2, type:'Th\u01b0\u1eddng', status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:16, code:'F1', roomId:3, roomName:'Ph\u00f2ng 3 - IMAX',     row:'F', col:1, type:'Couple',     status:'Ho\u1ea1t \u0111\u1ed9ng' },
    { id:17, code:'F2', roomId:3, roomName:'Ph\u00f2ng 3 - IMAX',     row:'F', col:2, type:'Couple',     status:'B\u1ea3o tr\u00ec' }
  ],
  thongbao: [
    { id:1, title:'Khuy\u1ebfn m\u00e3i th\u00e1ng 6', content:'Gi\u1ea3m 20% gi\u00e1 v\u00e9 v\u00e0o cu\u1ed1i tu\u1ea7n trong th\u00e1ng 6. \u00c1p d\u1ee5ng cho t\u1ea5t c\u1ea3 c\u00e1c su\u1ea5t chi\u1ebfu.', target:'all', type:'promotion', sentAt:'01/06/2024 08:00' },
    { id:2, title:'B\u1ea3o tr\u00ec ph\u00f2ng 4DX', content:'Ph\u00f2ng 4DX s\u1ebd t\u1ea1m ng\u01b0ng ho\u1ea1t \u0111\u1ed9ng t\u1eeb ng\u00e0y 08-10/06/2024 \u0111\u1ec3 b\u1ea3o tr\u00ec \u0111\u1ecbnh k\u1ef3.', target:'staff', type:'warning', sentAt:'05/06/2024 09:00' },
    { id:3, title:'Phim m\u1edbi th\u00e1ng 6', content:'C\u00e1c phim m\u1edbi s\u1ebd \u0111\u01b0\u1ee3c c\u00f4ng chi\u1ebfu trong th\u00e1ng 6/2024. \u0110\u1eb7t v\u00e9 s\u1edbm \u0111\u1ec3 nh\u1eadn \u01b0u \u0111\u00e3i.', target:'customers', type:'info', sentAt:'07/06/2024 10:00' }
  ],
  nextId: { nguoidung:6, nhanvien:6, khachhang:9, phim:7, phongchieu:5, suatchieu:9, ve:11, hoadon:11, ghe:18, thongbao:4 }
};

// ──────────────────────────────────────────────
// 2. DATABASE (localStorage)
// ──────────────────────────────────────────────
const DB_KEY = 'cinema_admin_v1';

function dbLoad() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function dbSave(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

let db = dbLoad() || JSON.parse(JSON.stringify(SEED));
dbSave(db); // persist seed if fresh

function nextId(entity) {
  const id = db.nextId[entity] || 1;
  db.nextId[entity] = id + 1;
  dbSave(db);
  return id;
}

// ──────────────────────────────────────────────
// 3. STATE
// ──────────────────────────────────────────────
let currentSection = 'dashboard';
let pendingDelete  = { entity: null, id: null };
let revenueChart   = null;

// ──────────────────────────────────────────────
// 4. UTILITIES
// ──────────────────────────────────────────────
function showToast(msg, isError) {
  const el = document.getElementById('liveToast');
  el.className = 'toast align-items-center border-0 ' + (isError ? 'text-bg-danger' : 'text-bg-success');
  document.getElementById('toastMsg').textContent = msg;
  bootstrap.Toast.getOrCreateInstance(el, { delay: 2800 }).show();
}

function fmtCurrency(n) {
  if (!n && n !== 0) return '';
  return new Intl.NumberFormat('vi-VN').format(n) + '\u00a0\u0111';
}

function fmtDate(d) {
  if (!d) return '';
  if (d.includes('-')) {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }
  return d;
}

const STATUS_MAP = {
  // green
  '\u0110ang chi\u1ebfu':'sb-success', 'Ho\u1ea1t \u0111\u1ed9ng':'sb-success', '\u0110ang l\u00e0m':'sb-success',
  '\u0110ang b\u00e1n':'sb-success', '\u0110\u00e3 thanh to\u00e1n':'sb-success', 'active':'sb-success',
  // orange
  'S\u1eafp chi\u1ebfu':'sb-warning', 'Ch\u1edd thanh to\u00e1n':'sb-warning', '\u0110\u00e3 \u0111\u1eb7t':'sb-warning',
  'Ngh\u1ec9 ph\u00e9p':'sb-warning', 'B\u1ea3o tr\u00ec':'sb-warning',
  // red
  'Ng\u1eebng chi\u1ebfu':'sb-danger', '\u0110\u00e3 ngh\u1ec9':'sb-danger', '\u0110\u00e3 h\u1ee7y':'sb-danger',
  'H\u1ee7y':'sb-danger', 'inactive':'sb-danger', '\u0110\u00f3ng c\u1eeda':'sb-danger',
  // blue
  '\u0110\u00e3 chi\u1ebfu':'sb-info', 'admin':'sb-info'
};

function badge(status) {
  const cls = STATUS_MAP[status] || 'sb-secondary';
  const label = status === 'active' ? 'Ho\u1ea1t \u0111\u1ed9ng' : status === 'inactive' ? 'V\u00f4 hi\u1ec7u' : status;
  return `<span class="status-badge ${cls}">${label}</span>`;
}

function roleBadge(role) {
  return role === 'admin'
    ? '<span class="badge bg-primary">Admin</span>'
    : '<span class="badge bg-secondary">User</span>';
}

function typeBadge(type) {
  const colors = { 'VIP':'bg-warning text-dark', 'Couple':'bg-danger', 'Th\u01b0\u1eddng':'bg-light text-dark border' };
  return `<span class="badge ${colors[type] || 'bg-secondary'}">${type}</span>`;
}

function actionBtns(entity, id) {
  return `<button class="btn-act btn-act-edit"   onclick="openModal('${entity}',${id})"><i class="fas fa-edit"></i></button>` +
         `<button class="btn-act btn-act-delete" onclick="confirmDelete('${entity}',${id})"><i class="fas fa-trash"></i></button>`;
}

// ──────────────────────────────────────────────
// 5. NAVIGATION
// ──────────────────────────────────────────────
function navigate(section) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  const item = document.querySelector(`.sidebar-item[data-section="${section}"]`);
  if (item) item.classList.add('active');

  document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
  const sec = document.getElementById(`section-${section}`);
  if (sec) sec.classList.add('active');

  currentSection = section;
  renderSection(section);
}

function renderSection(section) {
  switch (section) {
    case 'dashboard':  renderDashboard();  break;
    case 'nguoidung':  renderNguoidung();  break;
    case 'nhanvien':   renderNhanvien();   break;
    case 'khachhang':  renderKhachhang();  break;
    case 'phim':       renderPhim();       break;
    case 'phongchieu': renderPhongchieu(); break;
    case 'suatchieu':  renderSuatchieu();  break;
    case 've':         renderVe();         break;
    case 'hoadon':     renderHoadon();     break;
    case 'ghe':        renderGhe();        break;
    case 'thongbao':   renderThongbao();   break;
  }
}

// ──────────────────────────────────────────────
// 6. DASHBOARD
// ──────────────────────────────────────────────
function renderDashboard() {
  const soldTickets = db.ve.filter(v => v.status === '\u0110\u00e3 thanh to\u00e1n').length;
  const revenue = db.hoadon.filter(h => h.status === '\u0110\u00e3 thanh to\u00e1n').reduce((s, h) => s + h.totalAmount, 0);

  document.getElementById('statTotalMovies').textContent = db.phim.length;
  document.getElementById('statTotalUsers').textContent  = db.nguoidung.length + db.khachhang.length;
  document.getElementById('statTotalTickets').textContent = soldTickets;

  const rev = revenue >= 1e6
    ? (revenue / 1e6).toFixed(1) + 'M'
    : new Intl.NumberFormat('vi-VN').format(revenue);
  document.getElementById('statRevenue').textContent = rev;

  // Recent tickets
  const recent = [...db.ve].reverse().slice(0, 8);
  document.getElementById('recentTicketsBody').innerHTML = recent.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${v.code}</strong></td>
      <td>${v.customerName}</td>
      <td>${v.movieTitle}</td>
      <td><span class="badge bg-light text-dark border">${v.seatCode}</span></td>
      <td>${fmtCurrency(v.price)}</td>
      <td>${badge(v.status)}</td>
    </tr>`).join('');

  buildChart();
}

function buildChart() {
  const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const data   = new Array(12).fill(0);

  db.hoadon.forEach(h => {
    if (h.status !== '\u0110\u00e3 thanh to\u00e1n') return;
    const parts = h.createdAt.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[1], 10) - 1;
      if (m >= 0 && m < 12) data[m] += h.totalAmount;
    }
  });

  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChart) { revenueChart.destroy(); }

  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Doanh thu (VND)',
        data: data,
        backgroundColor: 'rgba(13,110,253,0.75)',
        borderColor: '#0d6efd',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : new Intl.NumberFormat('vi-VN').format(v)
          }
        }
      }
    }
  });
}

// ──────────────────────────────────────────────
// 7. RENDER TABLES
// ──────────────────────────────────────────────
function renderNguoidung() {
  const q    = (document.getElementById('searchNguoidung').value || '').toLowerCase();
  const role = document.getElementById('filterRoleNguoidung').value;
  const rows = db.nguoidung
    .filter(u => (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (!role || u.role === role))
    .map((u, i) => `<tr>
      <td>${i+1}</td><td><strong>${u.username}</strong></td><td>${u.email}</td>
      <td>${roleBadge(u.role)}</td><td>${badge(u.status)}</td><td>${u.createdAt}</td>
      <td>${actionBtns('nguoidung', u.id)}</td></tr>`).join('');
  document.getElementById('nguoidungTableBody').innerHTML = rows || emptyRow(7);
}

function renderNhanvien() {
  const q  = (document.getElementById('searchNhanvien').value || '').toLowerCase();
  const vt = document.getElementById('filterViTriNhanvien').value;
  const rows = db.nhanvien
    .filter(n => (!q || n.name.toLowerCase().includes(q) || n.email.toLowerCase().includes(q)) && (!vt || n.position === vt))
    .map((n, i) => `<tr>
      <td>${i+1}</td><td><strong>${n.name}</strong></td><td>${n.email}</td>
      <td>${n.phone}</td><td>${n.position}</td><td>${badge(n.status)}</td>
      <td>${actionBtns('nhanvien', n.id)}</td></tr>`).join('');
  document.getElementById('nhanvienTableBody').innerHTML = rows || emptyRow(7);
}

function renderKhachhang() {
  const q = (document.getElementById('searchKhachhang').value || '').toLowerCase();
  const rows = db.khachhang
    .filter(k => !q || k.name.toLowerCase().includes(q) || k.email.toLowerCase().includes(q) || k.phone.includes(q))
    .map((k, i) => `<tr>
      <td>${i+1}</td><td><strong>${k.name}</strong></td><td>${k.email}</td>
      <td>${k.phone}</td>
      <td><span class="badge bg-warning text-dark">${k.points} \u0111i\u1ec3m</span></td>
      <td>${k.registeredAt}</td>
      <td>${actionBtns('khachhang', k.id)}</td></tr>`).join('');
  document.getElementById('khachhangTableBody').innerHTML = rows || emptyRow(7);
}

function renderPhim() {
  const q  = (document.getElementById('searchPhim').value || '').toLowerCase();
  const st = document.getElementById('filterStatusPhim').value;
  const rows = db.phim
    .filter(p => (!q || p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q)) && (!st || p.status === st))
    .map((p, i) => `<tr>
      <td>${i+1}</td><td><strong>${p.title}</strong></td><td>${p.genre}</td>
      <td>${p.duration} ph\u00fat</td><td>${p.director}</td><td>${fmtDate(p.releaseDate)}</td>
      <td>${badge(p.status)}</td>
      <td>${actionBtns('phim', p.id)}</td></tr>`).join('');
  document.getElementById('phimTableBody').innerHTML = rows || emptyRow(8);
}

function renderPhongchieu() {
  const rows = db.phongchieu.map((r, i) => `<tr>
    <td>${i+1}</td><td><strong>${r.name}</strong></td>
    <td>${r.capacity} gh\u1ebf</td>
    <td><span class="badge bg-info text-dark">${r.type}</span></td>
    <td>${badge(r.status)}</td>
    <td>${actionBtns('phongchieu', r.id)}</td></tr>`).join('');
  document.getElementById('phongchieuTableBody').innerHTML = rows || emptyRow(6);
}

function renderSuatchieu() {
  const q    = (document.getElementById('searchSuatchieu').value || '').toLowerCase();
  const date = document.getElementById('filterDateSuatchieu').value;
  const st   = document.getElementById('filterStatusSuatchieu').value;
  const rows = db.suatchieu
    .filter(s =>
      (!q || s.movieTitle.toLowerCase().includes(q) || s.roomName.toLowerCase().includes(q)) &&
      (!date || s.date === date) &&
      (!st || s.status === st))
    .map((s, i) => `<tr>
      <td>${i+1}</td><td><strong>${s.movieTitle}</strong></td><td>${s.roomName}</td>
      <td>${fmtDate(s.date)}</td><td>${s.time}</td><td>${fmtCurrency(s.price)}</td>
      <td>${badge(s.status)}</td>
      <td>${actionBtns('suatchieu', s.id)}</td></tr>`).join('');
  document.getElementById('suatchieuTableBody').innerHTML = rows || emptyRow(8);
}

function renderVe() {
  const q  = (document.getElementById('searchVe').value || '').toLowerCase();
  const st = document.getElementById('filterStatusVe').value;
  const rows = db.ve
    .filter(v => (!q || v.code.toLowerCase().includes(q) || v.customerName.toLowerCase().includes(q) || v.movieTitle.toLowerCase().includes(q)) && (!st || v.status === st))
    .map((v, i) => `<tr>
      <td>${i+1}</td><td><strong>${v.code}</strong></td><td>${v.customerName}</td>
      <td>${v.movieTitle}</td>
      <td><span class="badge bg-light text-dark border">${v.seatCode}</span></td>
      <td>${fmtCurrency(v.price)}</td><td>${v.createdAt}</td>
      <td>${badge(v.status)}</td>
      <td>${actionBtns('ve', v.id)}</td></tr>`).join('');
  document.getElementById('veTableBody').innerHTML = rows || emptyRow(9);
}

function renderHoadon() {
  const q  = (document.getElementById('searchHoadon').value || '').toLowerCase();
  const st = document.getElementById('filterStatusHoadon').value;
  const rows = db.hoadon
    .filter(h => (!q || h.code.toLowerCase().includes(q) || h.customerName.toLowerCase().includes(q)) && (!st || h.status === st))
    .map((h, i) => `<tr>
      <td>${i+1}</td><td><strong>${h.code}</strong></td><td>${h.customerName}</td>
      <td><strong>${fmtCurrency(h.totalAmount)}</strong></td><td>${h.paymentMethod}</td>
      <td>${h.createdAt}</td><td>${badge(h.status)}</td>
      <td>${actionBtns('hoadon', h.id)}</td></tr>`).join('');
  document.getElementById('hoadonTableBody').innerHTML = rows || emptyRow(8);
}

function renderGhe() {
  const roomFilter = document.getElementById('filterRoomGhe').value;
  const typeFilter = document.getElementById('filterTypeGhe').value;

  // populate room dropdown
  const roomSel = document.getElementById('filterRoomGhe');
  const curVal  = roomSel.value;
  roomSel.innerHTML = '<option value="">T\u1ea5t c\u1ea3 ph\u00f2ng</option>' +
    db.phongchieu.map(r => `<option value="${r.id}" ${curVal == r.id ? 'selected':''}>${r.name}</option>`).join('');

  const rows = db.ghe
    .filter(g => (!roomFilter || g.roomId == roomFilter) && (!typeFilter || g.type === typeFilter))
    .map((g, i) => `<tr>
      <td>${i+1}</td>
      <td><strong>${g.code}</strong></td><td>${g.roomName}</td>
      <td>${g.row}</td><td>${g.col}</td>
      <td>${typeBadge(g.type)}</td><td>${badge(g.status)}</td>
      <td>${actionBtns('ghe', g.id)}</td></tr>`).join('');
  document.getElementById('gheTableBody').innerHTML = rows || emptyRow(8);
}

function renderThongbao() {
  const typeLabel = { info: '\u2139\ufe0f Th\u00f4ng tin', promotion: '\ud83c\udf89 Khuy\u1ebfn m\u00e3i', warning: '\u26a0\ufe0f C\u1ea3nh b\u00e1o' };
  const targetLabel = { all: 'T\u1ea5t c\u1ea3', customers: 'Kh\u00e1ch h\u00e0ng', staff: 'Nh\u00e2n vi\u00ean' };
  const html = db.thongbao.map(n => `
    <div class="notif-item notif-${n.type}">
      <div class="d-flex justify-content-between align-items-start">
        <span class="notif-item-title">${n.title}</span>
        <button class="btn-act btn-act-delete" onclick="deleteNotif(${n.id})"><i class="fas fa-times"></i></button>
      </div>
      <div class="notif-item-meta">${typeLabel[n.type] || n.type} &bull; ${targetLabel[n.target] || n.target} &bull; ${n.sentAt}</div>
      <div class="notif-item-body">${n.content}</div>
    </div>`).join('');
  document.getElementById('notifHistoryList').innerHTML = html || '<p class="text-muted">Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o n\u00e0o.</p>';
}

function emptyRow(cols) {
  return `<tr><td colspan="${cols}" class="text-center text-muted py-4">Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u</td></tr>`;
}

// ──────────────────────────────────────────────
// 8. MODALS – OPEN
// ──────────────────────────────────────────────
function openModal(entity, id) {
  const modalEl = document.getElementById(`modal-${entity}`);
  if (!modalEl) return;
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  if (id) {
    const item = db[entity] ? db[entity].find(x => x.id === id) : null;
    if (!item) return;
    document.getElementById(`modal-${entity}-title`).textContent = 'S\u1eeda ' + entityLabel(entity);
    populateModal(entity, item);
  } else {
    document.getElementById(`modal-${entity}-title`).textContent = 'Th\u00eam ' + entityLabel(entity);
    clearModal(entity);
  }

  // Populate dynamic selects
  if (entity === 'suatchieu') {
    populateSelect('suatchieu-movie', db.phim.map(p => ({ value: p.id, text: p.title })));
    populateSelect('suatchieu-room', db.phongchieu.map(r => ({ value: r.id, text: r.name })));
    if (id) {
      const item = db.suatchieu.find(x => x.id === id);
      document.getElementById('suatchieu-movie').value = item.movieId;
      document.getElementById('suatchieu-room').value  = item.roomId;
    }
  }
  if (entity === 've') {
    populateSelect('ve-customer', db.khachhang.map(k => ({ value: k.id, text: k.name })));
    populateSelect('ve-showtime', db.suatchieu.map(s => ({ value: s.id, text: `${s.movieTitle} - ${fmtDate(s.date)} ${s.time}` })));
    if (id) {
      const item = db.ve.find(x => x.id === id);
      document.getElementById('ve-customer').value = item.customerId;
      document.getElementById('ve-showtime').value = item.showtimeId;
    }
  }
  if (entity === 'ghe') {
    populateSelect('ghe-room', db.phongchieu.map(r => ({ value: r.id, text: r.name })));
    if (id) {
      const item = db.ghe.find(x => x.id === id);
      document.getElementById('ghe-room').value = item.roomId;
    }
  }

  modal.show();
}

function entityLabel(e) {
  const map = {
    nguoidung:'Ng\u01b0\u1eddi D\u00f9ng', nhanvien:'Nh\u00e2n Vi\u00ean', khachhang:'Kh\u00e1ch H\u00e0ng',
    phim:'Phim', phongchieu:'Ph\u00f2ng Chi\u1ebfu', suatchieu:'Su\u1ea5t Chi\u1ebfu',
    ve:'V\u00e9', hoadon:'H\u00f3a \u0110\u01a1n', ghe:'Gh\u1ebf'
  };
  return map[e] || e;
}

function populateSelect(id, options) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = options.map(o => `<option value="${o.value}">${o.text}</option>`).join('');
}

function populateModal(entity, item) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val == null ? '' : val; };
  switch (entity) {
    case 'nguoidung':
      set('nguoidung-id', item.id); set('nguoidung-username', item.username);
      set('nguoidung-email', item.email); set('nguoidung-password', '');
      set('nguoidung-role', item.role); set('nguoidung-status', item.status); break;
    case 'nhanvien':
      set('nhanvien-id', item.id); set('nhanvien-name', item.name);
      set('nhanvien-email', item.email); set('nhanvien-phone', item.phone);
      set('nhanvien-position', item.position); set('nhanvien-status', item.status); break;
    case 'khachhang':
      set('khachhang-id', item.id); set('khachhang-name', item.name);
      set('khachhang-email', item.email); set('khachhang-phone', item.phone);
      set('khachhang-points', item.points); break;
    case 'phim':
      set('phim-id', item.id); set('phim-title', item.title); set('phim-genre', item.genre);
      set('phim-duration', item.duration); set('phim-releaseDate', item.releaseDate);
      set('phim-director', item.director); set('phim-actors', item.actors);
      set('phim-status', item.status); set('phim-poster', item.poster);
      set('phim-description', item.description); break;
    case 'phongchieu':
      set('phongchieu-id', item.id); set('phongchieu-name', item.name);
      set('phongchieu-capacity', item.capacity); set('phongchieu-type', item.type);
      set('phongchieu-status', item.status); break;
    case 'suatchieu':
      set('suatchieu-id', item.id); set('suatchieu-date', item.date);
      set('suatchieu-time', item.time); set('suatchieu-price', item.price);
      set('suatchieu-status', item.status); break;
    case 've':
      set('ve-id', item.id); set('ve-seat', item.seatCode);
      set('ve-price', item.price); set('ve-status', item.status); break;
    case 'hoadon':
      set('hoadon-id', item.id); set('hoadon-code', item.code);
      set('hoadon-customer', item.customerName); set('hoadon-amount', item.totalAmount);
      set('hoadon-payment', item.paymentMethod); set('hoadon-status', item.status); break;
    case 'ghe':
      set('ghe-id', item.id); set('ghe-row', item.row);
      set('ghe-col', item.col); set('ghe-type', item.type); set('ghe-status', item.status); break;
  }
}

function clearModal(entity) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val == null ? '' : val; };
  switch (entity) {
    case 'nguoidung': set('nguoidung-id',''); set('nguoidung-username',''); set('nguoidung-email',''); set('nguoidung-password',''); set('nguoidung-role','user'); set('nguoidung-status','active'); break;
    case 'nhanvien':  set('nhanvien-id',''); set('nhanvien-name',''); set('nhanvien-email',''); set('nhanvien-phone',''); set('nhanvien-position','Thu ng\u00e2n'); set('nhanvien-status','\u0110ang l\u00e0m'); break;
    case 'khachhang': set('khachhang-id',''); set('khachhang-name',''); set('khachhang-email',''); set('khachhang-phone',''); set('khachhang-points',0); break;
    case 'phim':      set('phim-id',''); set('phim-title',''); set('phim-genre',''); set('phim-duration',''); set('phim-releaseDate',''); set('phim-director',''); set('phim-actors',''); set('phim-description',''); set('phim-poster',''); set('phim-status','\u0110ang chi\u1ebfu'); break;
    case 'phongchieu':set('phongchieu-id',''); set('phongchieu-name',''); set('phongchieu-capacity',''); set('phongchieu-type','2D'); set('phongchieu-status','Ho\u1ea1t \u0111\u1ed9ng'); break;
    case 'suatchieu': set('suatchieu-id',''); set('suatchieu-date',''); set('suatchieu-time',''); set('suatchieu-price',''); set('suatchieu-status','\u0110ang b\u00e1n'); break;
    case 've':        set('ve-id',''); set('ve-seat',''); set('ve-price',''); set('ve-status','\u0110\u00e3 \u0111\u1eb7t'); break;
    case 'ghe':       set('ghe-id',''); set('ghe-row',''); set('ghe-col',''); set('ghe-type','Th\u01b0\u1eddng'); set('ghe-status','Ho\u1ea1t \u0111\u1ed9ng'); break;
  }
}

// ──────────────────────────────────────────────
// 9. MODALS – SAVE
// ──────────────────────────────────────────────
function saveEntity(entity) {
  const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  let obj = {};
  switch (entity) {
    case 'nguoidung': {
      if (!g('nguoidung-username') || !g('nguoidung-email')) { showToast('Vui l\u00f2ng \u0111i\u1ec1n \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin!', true); return; }
      obj = { username: g('nguoidung-username'), email: g('nguoidung-email'), role: g('nguoidung-role'), status: g('nguoidung-status') };
      const pw = g('nguoidung-password'); if (pw) obj.password = pw;
      break;
    }
    case 'nhanvien': {
      if (!g('nhanvien-name')) { showToast('Vui l\u00f2ng nh\u1eadp h\u1ecd t\u00ean!', true); return; }
      obj = { name: g('nhanvien-name'), email: g('nhanvien-email'), phone: g('nhanvien-phone'), position: g('nhanvien-position'), status: g('nhanvien-status') };
      break;
    }
    case 'khachhang': {
      if (!g('khachhang-name')) { showToast('Vui l\u00f2ng nh\u1eadp h\u1ecd t\u00ean!', true); return; }
      obj = { name: g('khachhang-name'), email: g('khachhang-email'), phone: g('khachhang-phone'), points: parseInt(g('khachhang-points'), 10) || 0 };
      break;
    }
    case 'phim': {
      if (!g('phim-title')) { showToast('Vui l\u00f2ng nh\u1eadp t\u00ean phim!', true); return; }
      obj = { title: g('phim-title'), genre: g('phim-genre'), duration: parseInt(g('phim-duration'), 10) || 0, releaseDate: g('phim-releaseDate'), director: g('phim-director'), actors: g('phim-actors'), description: g('phim-description'), status: g('phim-status'), poster: g('phim-poster') };
      break;
    }
    case 'phongchieu': {
      if (!g('phongchieu-name')) { showToast('Vui l\u00f2ng nh\u1eadp t\u00ean ph\u00f2ng!', true); return; }
      obj = { name: g('phongchieu-name'), capacity: parseInt(g('phongchieu-capacity'), 10) || 0, type: g('phongchieu-type'), status: g('phongchieu-status') };
      break;
    }
    case 'suatchieu': {
      const movieSel = document.getElementById('suatchieu-movie');
      const roomSel  = document.getElementById('suatchieu-room');
      const movie    = db.phim.find(p => p.id === parseInt(movieSel.value, 10));
      const room     = db.phongchieu.find(r => r.id === parseInt(roomSel.value, 10));
      obj = { movieId: movie ? movie.id : 0, movieTitle: movie ? movie.title : '', roomId: room ? room.id : 0, roomName: room ? room.name : '', date: g('suatchieu-date'), time: g('suatchieu-time'), price: parseInt(g('suatchieu-price'), 10) || 0, status: g('suatchieu-status') };
      break;
    }
    case 've': {
      const custSel = document.getElementById('ve-customer');
      const stSel   = document.getElementById('ve-showtime');
      const cust    = db.khachhang.find(k => k.id === parseInt(custSel.value, 10));
      const st      = db.suatchieu.find(s => s.id === parseInt(stSel.value, 10));
      obj = { customerId: cust ? cust.id : 0, customerName: cust ? cust.name : '', showtimeId: st ? st.id : 0, movieTitle: st ? st.movieTitle : '', seatCode: g('ve-seat'), price: parseInt(g('ve-price'), 10) || 0, status: g('ve-status') };
      break;
    }
    case 'hoadon': {
      obj = { totalAmount: parseInt(g('hoadon-amount'), 10) || 0, paymentMethod: g('hoadon-payment'), status: g('hoadon-status') };
      break;
    }
    case 'ghe': {
      const roomSel = document.getElementById('ghe-room');
      const room    = db.phongchieu.find(r => r.id === parseInt(roomSel.value, 10));
      const row     = g('ghe-row').toUpperCase();
      const col     = parseInt(g('ghe-col'), 10) || 1;
      obj = { roomId: room ? room.id : 0, roomName: room ? room.name : '', row: row, col: col, code: row + col, type: g('ghe-type'), status: g('ghe-status') };
      break;
    }
  }

  const idVal = parseInt(g(`${entity}-id`), 10);
  if (idVal) {
    const idx = db[entity].findIndex(x => x.id === idVal);
    if (idx !== -1) db[entity][idx] = { ...db[entity][idx], ...obj };
  } else {
    const newId = nextId(entity);
    const extra = {};
    if (entity === 'nguoidung')  { extra.createdAt = new Date().toLocaleDateString('vi-VN'); if (!obj.password) obj.password = '123456'; }
    if (entity === 'nhanvien')   { extra.hireDate = new Date().toLocaleDateString('vi-VN'); }
    if (entity === 'khachhang')  { extra.registeredAt = new Date().toLocaleDateString('vi-VN'); }
    if (entity === 've')         { extra.code = 'VE' + String(newId).padStart(3,'0'); extra.createdAt = new Date().toLocaleDateString('vi-VN'); }
    if (entity === 'hoadon')     { extra.code = 'HD' + String(newId).padStart(3,'0'); extra.createdAt = new Date().toLocaleDateString('vi-VN'); extra.customerName = obj.customerName || ''; extra.customerId = obj.customerId || 0; }
    db[entity].push({ id: newId, ...obj, ...extra });
  }

  dbSave(db);
  bootstrap.Modal.getInstance(document.getElementById(`modal-${entity}`))?.hide();
  renderSection(currentSection);
  showToast('L\u01b0u th\u00e0nh c\u00f4ng!');
}

// ──────────────────────────────────────────────
// 10. DELETE
// ──────────────────────────────────────────────
function confirmDelete(entity, id) {
  pendingDelete = { entity, id };
  bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteModal')).show();
}

function deleteNotif(id) {
  db.thongbao = db.thongbao.filter(n => n.id !== id);
  dbSave(db);
  renderThongbao();
  showToast('\u0110\u00e3 x\u00f3a th\u00f4ng b\u00e1o.');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
  const { entity, id } = pendingDelete;
  if (!entity) return;
  db[entity] = db[entity].filter(x => x.id !== id);
  dbSave(db);
  bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
  renderSection(currentSection);
  showToast('\u0110\u00e3 x\u00f3a th\u00e0nh c\u00f4ng!');
  pendingDelete = { entity: null, id: null };
});

// ──────────────────────────────────────────────
// 11. FILTER
// ──────────────────────────────────────────────
function filterTable(entity) { renderSection(entity); }

// ──────────────────────────────────────────────
// 12. FORM HANDLERS
// ──────────────────────────────────────────────
document.getElementById('profileForm').addEventListener('submit', function (e) {
  e.preventDefault();
  showToast('C\u1eadp nh\u1eadt th\u00f4ng tin th\u00e0nh c\u00f4ng!');
});

document.getElementById('changePasswordForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const np = document.getElementById('newPassword').value;
  const cp = document.getElementById('confirmPassword').value;
  if (!np) { showToast('Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u m\u1edbi!', true); return; }
  if (np !== cp) { showToast('M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp!', true); return; }
  showToast('\u0110\u1ed5i m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng!');
  this.reset();
});

document.getElementById('sendNotificationForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const notif = {
    id: nextId('thongbao'),
    title:   document.getElementById('notifTitle').value.trim(),
    content: document.getElementById('notifContent').value.trim(),
    target:  document.getElementById('notifTarget').value,
    type:    document.getElementById('notifType').value,
    sentAt:  new Date().toLocaleString('vi-VN')
  };
  db.thongbao.unshift(notif);
  dbSave(db);
  this.reset();
  renderThongbao();
  showToast('\u0110\u00e3 g\u1eedi th\u00f4ng b\u00e1o th\u00e0nh c\u00f4ng!');
});

document.getElementById('logoutBtn').addEventListener('click', function () {
  if (confirm('\u0411\u1ea1n c\u00f3 mu\u1ed1n \u0111\u0103ng xu\u1ea5t kh\u00f4ng?')) {
    window.location.href = 'pages/login.html';
  }
});

document.getElementById('sidebarToggleBtn').addEventListener('click', function () {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.getElementById('mainContent').classList.toggle('expanded');
});

// ──────────────────────────────────────────────
// 13. EXPOSE GLOBALS (called from HTML onclick)
// ──────────────────────────────────────────────
window.openModal     = openModal;
window.saveEntity    = saveEntity;
window.confirmDelete = confirmDelete;
window.filterTable   = filterTable;
window.deleteNotif   = deleteNotif;

// ──────────────────────────────────────────────
// 14. INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.sidebar-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      navigate(this.dataset.section);
    });
  });
  navigate('dashboard');
});
