# ISP Customer Management System 🌐

Sistem manajemen pelanggan WiFi/ISP berbasis web dengan tampilan modern, profesional, dan responsif. Dibangun untuk memudahkan pengelolaan data pelanggan, perangkat, tagihan, dan lokasi.

## 🎯 Fitur Utama

✅ **Dashboard** - Statistik pelanggan, tagihan, dan status  
✅ **Data Pelanggan** - CRUD data pelanggan dengan search & pagination  
✅ **Data Perangkat** - Manajemen perangkat WiFi per pelanggan  
✅ **Data Tagihan** - Kelola tagihan dengan status dan metode pembayaran  
✅ **Peta Lokasi** - Visualisasi pelanggan di peta dengan Leaflet.js  
✅ **WhatsApp Integration** - Pengiriman reminder tagihan otomatis  
✅ **Export Data** - Export data ke CSV  
✅ **Responsive Design** - Mobile-friendly dengan Bootstrap 5  

## 🏗️ Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Node.js + Express.js |
| **Database** | MySQL |
| **Frontend** | HTML5 + CSS3 + JavaScript |
| **UI Framework** | Bootstrap 5 |
| **Map** | Leaflet.js |
| **Icons** | FontAwesome 6.4 |
| **API Calls** | Axios |
| **Fonts** | Poppins (Google Fonts) |

## 📁 Struktur Folder

```
isp-management-system/
├── backend/
│   ├── config/              # Database configuration
│   ├── controllers/         # Business logic
│   ├── models/              # Database queries
│   ├── routes/              # API routes
│   ├── middleware/          # Validation & error handling
│   ├── services/            # External API integration
│   ├── server.js            # Main server
│   └── package.json
│
├── frontend/
│   ├── index.html           # Dashboard
│   ├── pages/               # Other pages
│   └── assets/              # CSS, JS, images
│
├── database/
│   └── isp_database.sql     # Database schema
│
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MySQL Server (v5.7+)
- XAMPP atau MySQL Client
- Code Editor (VS Code recommended)

### Step 1: Setup Database

1. Buka MySQL command line atau phpMyAdmin
2. Import database file:
   ```bash
   mysql -u root -p < database/isp_database.sql
   ```
3. Database name: `isp_management`
4. Default user: `root` (no password)

### Step 2: Setup Backend

1. Navigate ke folder backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` ke `.env` dan setup variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` dengan credentials lokal Anda:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=isp_management
   DB_PORT=3306
   PORT=5000
   ```

5. Start server:
   ```bash
   npm start
   ```
   Server akan berjalan di `http://localhost:5000`

### Step 3: Setup Frontend

Frontend adalah static files, cukup buka `frontend/index.html` di browser atau serve dengan HTTP server.

Recommended untuk development:
```bash
# Install live server (optional)
npm install -g live-server
cd frontend
live-server
```

Akses: `http://localhost:8080`

## 📊 API Endpoints

### Pelanggan
```
GET    /api/pelanggan              # Get all customers
GET    /api/pelanggan/:id          # Get customer by ID
POST   /api/pelanggan              # Create customer
PUT    /api/pelanggan/:id          # Update customer
DELETE /api/pelanggan/:id          # Delete customer
GET    /api/pelanggan/statistik    # Get statistics
POST   /api/pelanggan/import/excel # Import from Excel
```

### Perangkat
```
GET    /api/perangkat              # Get all devices
POST   /api/perangkat              # Create device
PUT    /api/perangkat/:id          # Update device
DELETE /api/perangkat/:id          # Delete device
```

### Tagihan
```
GET    /api/tagihan                # Get all invoices
POST   /api/tagihan                # Create invoice
PUT    /api/tagihan/:id            # Update invoice
DELETE /api/tagihan/:id            # Delete invoice
GET    /api/tagihan/statistik      # Get statistics
```

### Lokasi
```
GET    /api/lokasi                 # Get all locations
POST   /api/lokasi                 # Create location
PUT    /api/lokasi/:id             # Update location
DELETE /api/lokasi/:id             # Delete location
```

### WhatsApp
```
POST   /api/whatsapp/send-manual        # Send manual message
POST   /api/whatsapp/send-reminder-h3   # Send H-3 reminders
POST   /api/whatsapp/send-confirmation  # Send confirmation
```

## 🔐 Environment Variables

Wajib di setup di file `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=isp_management
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=development

# JWT (untuk authentication, optional)
JWT_SECRET=your_super_secret_key

# WhatsApp Integration (Fonnte)
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_API_KEY=your_fonnte_api_key

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🧪 Testing

### Test WhatsApp API
```bash
node -e "
const axios = require('axios');
axios.post('http://localhost:5000/api/whatsapp/send-manual', {
  pelanggan_id: 31,
  tagihan_id: 5
}).then(res => console.log(res.data));
"
```

### Test Database Connection
```bash
mysql -u root -p isp_management
SELECT * FROM pelanggan LIMIT 5;
```

## 📝 Development

### Project Structure (Backend)

```
backend/
├── config/
│   └── database.js              # MySQL connection pool
├── controllers/
│   ├── PelangganController.js   # Customer logic
│   ├── PerangkatController.js   # Device logic
│   ├── TagihanController.js     # Invoice logic
│   ├── LokasiController.js      # Location logic
│   ├── WhatsAppController.js    # WhatsApp logic
│   └── GeocodingController.js   # Maps logic
├── models/
│   ├── PelangganModel.js        # Customer queries
│   ├── PerangkatModel.js        # Device queries
│   ├── TagihanModel.js          # Invoice queries
│   └── LokasiModel.js           # Location queries
├── routes/
│   ├── pelangganRoutes.js
│   ├── perangkatRoutes.js
│   ├── tagihanRoutes.js
│   ├── lokasiRoutes.js
│   ├── whatsappRoutes.js
│   ├── geocodingRoutes.js
│   └── adminRoutes.js
├── middleware/
│   ├── validateInput.js         # Form validation
│   └── errorHandler.js          # Error handling
├── services/
│   ├── WhatsAppService.js       # Fonnte API integration
│   └── GeocodingService.js      # Google Maps integration
└── server.js                     # Express app setup
```

## 🔧 Troubleshooting

### Database Connection Error
- Pastikan MySQL server running
- Check DB credentials di `.env`
- Run: `mysql -u root -p` untuk verify connection

### Port 5000 Already in Use
```bash
# Kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### WhatsApp Message Not Sent
- Check Fonnte API key di `.env`
- Verify phone number format (harus 62-prefixed)
- Check Fonnte quota dan balance

### CORS Error
- Backend CORS middleware sudah enabled
- Ensure frontend URL di whitelist (jika strict mode)

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Bootstrap 5 Docs](https://getbootstrap.com/)
- [Leaflet.js Docs](https://leafletjs.com/)
- [Fonnte API Docs](https://www.fonnte.com/)

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 👨‍💻 Author

Created with ❤️ for ISP Management

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Status:** Active Development
