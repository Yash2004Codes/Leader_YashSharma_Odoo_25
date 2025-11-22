# StockMaster - Inventory Management System

A complete, modular Inventory Management System (IMS) built with Next.js that digitizes and streamlines all stock-related operations within a business.

## Features

### Authentication
- User sign up and login
- OTP-based password reset
- JWT token-based authentication
- Protected routes

### Dashboard
- Real-time KPIs:
  - Total Products in Stock
  - Low Stock / Out of Stock Items
  - Pending Receipts
  - Pending Deliveries
  - Internal Transfers Scheduled
- Dynamic filters by document type, status, warehouse, and category
- Recent transactions overview

### Product Management
- Create and update products
- SKU/Code management
- Product categories
- Unit of measure tracking
- Stock availability per location
- Reordering rules and alerts
- Low stock and out of stock indicators

### Operations

#### 1. Receipts (Incoming Stock)
- Create receipts for incoming goods from vendors
- Add supplier information
- Input quantities received
- Validate to automatically increase stock
- Track receipt status (draft, waiting, ready, done)

#### 2. Delivery Orders (Outgoing Stock)
- Create delivery orders for customer shipments
- Pick and pack items
- Validate to automatically decrease stock
- Stock reservation system
- Insufficient stock validation

#### 3. Internal Transfers
- Move stock between warehouses
- Track transfers from source to destination
- Automatic stock updates in both locations
- Complete audit trail

#### 4. Stock Adjustments
- Fix mismatches between recorded and physical stock
- Enter counted quantities
- Automatic difference calculation
- System updates and logs adjustments

#### 5. Move History (Stock Ledger)
- Complete audit trail of all stock movements
- Filter by product, warehouse, transaction type
- View quantity changes, before/after values
- Reference numbers for traceability

### Additional Features
- Multi-warehouse support
- Low stock alerts
- SKU search and smart filters
- Real-time stock tracking
- Complete transaction history

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT, bcryptjs
- **State Management**: Zustand
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- **Windows users**: Visual Studio Build Tools with "Desktop development with C++" workload
  - Download from: https://visualstudio.microsoft.com/downloads/
  - Or install via: `npm install -g windows-build-tools` (may require admin)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd StockMaster
```

2. Install dependencies:
```bash
npm install
```

**Note for Windows users**: If you encounter build errors with `better-sqlite3`, you need to install Visual Studio Build Tools:
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Select "Desktop development with C++" workload
- Or run: `npm install --global windows-build-tools` (requires admin)
- Then retry `npm install`

3. Set up environment variables (optional):
Create a `.env.local` file in the root directory:
```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
OTP_EXPIRES_IN=600000
DB_PATH=./data/stockmaster.db

# Email configuration for OTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Time Setup

1. Sign up for a new account
2. You'll be redirected to the dashboard
3. The system automatically creates:
   - A default "Main Warehouse"
   - A default "General" product category

## Usage

### Inventory Flow Example

1. **Receive Goods from Vendor**
   - Go to Receipts → New Receipt
   - Add supplier, select warehouse, add products and quantities
   - Validate the receipt → Stock increases automatically

2. **Move to Production Rack**
   - Go to Transfers → New Transfer
   - Select source and destination warehouses
   - Add products to transfer
   - Validate → Stock moves between locations

3. **Deliver Finished Goods**
   - Go to Deliveries → New Delivery Order
   - Add customer, select warehouse, add products
   - Validate → Stock decreases automatically

4. **Adjust Damaged Items**
   - Go to Adjustments → New Adjustment
   - Select warehouse, enter counted quantities
   - System calculates difference
   - Validate → Stock updates automatically

All transactions are logged in the Stock Ledger (Move History).

## Project Structure

```
StockMaster/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── products/      # Product management
│   │   ├── warehouses/    # Warehouse management
│   │   ├── receipts/      # Receipts (incoming)
│   │   ├── deliveries/    # Delivery orders (outgoing)
│   │   ├── transfers/     # Internal transfers
│   │   ├── adjustments/   # Stock adjustments
│   │   └── dashboard/     # Dashboard data
│   ├── dashboard/         # Dashboard page
│   ├── products/          # Products page
│   ├── receipts/          # Receipts page
│   ├── deliveries/        # Deliveries page
│   ├── transfers/         # Transfers page
│   ├── adjustments/       # Adjustments page
│   ├── history/           # Move history page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── forgot-password/   # Password reset
├── components/            # React components
│   ├── layout/            # Layout components
│   └── ui/               # UI components
├── lib/                  # Utilities and helpers
│   ├── db.ts             # Database initialization
│   ├── auth.ts           # Authentication utilities
│   ├── api.ts            # API client
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Helper functions
└── data/                 # SQLite database (auto-created)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `GET /api/products/categories` - List categories
- `POST /api/products/categories` - Create category

### Warehouses
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse

### Receipts
- `GET /api/receipts` - List receipts
- `POST /api/receipts` - Create receipt
- `GET /api/receipts/[id]` - Get receipt details
- `PUT /api/receipts/[id]` - Update/validate receipt

### Deliveries
- `GET /api/deliveries` - List delivery orders
- `POST /api/deliveries` - Create delivery order
- `PUT /api/deliveries/[id]` - Update/validate delivery

### Transfers
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create transfer
- `PUT /api/transfers/[id]` - Update/validate transfer
- `GET /api/transfers/history` - Get move history

### Adjustments
- `GET /api/adjustments` - List adjustments
- `POST /api/adjustments` - Create adjustment
- `PUT /api/adjustments/[id]` - Update/validate adjustment

### Dashboard
- `GET /api/dashboard` - Get dashboard KPIs and recent transactions

## Building for Production

```bash
npm run build
npm start
```

## Database

The application uses SQLite for simplicity and portability. The database is automatically created in the `data/` directory on first run. The schema includes:

- Users and authentication
- Warehouses and locations
- Products and categories
- Stock levels per warehouse
- Receipts and delivery orders
- Internal transfers
- Stock adjustments
- Complete stock ledger (audit trail)

## Security Notes

- Change `JWT_SECRET` in production
- Use environment variables for sensitive data
- Consider using PostgreSQL or MySQL for production
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Set up proper email service for OTP delivery

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
