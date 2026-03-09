# 🍽️ Foodie Flow

A full-stack food ordering platform with a **Next.js 16** frontend and a **.NET 9 Clean Architecture** REST API backend, featuring multi-role dashboards, real-time order tracking, media uploads, and push notifications.

---

## 🚀 Features

### Customer Features
- **Restaurant Discovery**: Browse and search restaurants by name or category
- **Menu Browsing**: View dishes with images, prices, descriptions, and ratings
- **Cart & Checkout**: Add items, adjust quantities, and place orders with delivery details
- **Order Tracking**: Live 6-step progress tracker (Placed → Accepted → Preparing → Ready → On the Way → Delivered)
- **Order History**: View all past orders with full item and pricing breakdown
- **Reviews**: Rate and review dishes and restaurants after a verified purchase
- **Push Notifications**: Browser-level alerts via Web Push API and Service Worker

### Restaurant Features
- **Dish Management**: Full CRUD for menu items with image and video uploads (Cloudinary)
- **Menu Uploads**: Upload structured menus and promotional content
- **Order Processing**: Accept, reject, and update orders through the full lifecycle
- **Review Management**: View and respond to customer reviews
- **Restaurant Profile**: Manage restaurant details, logo, and banner

### Admin Features
- **Dashboard**: Platform-wide stats — total users, restaurants, orders, revenue, and daily trends via Recharts charts
- **User Management**: View, activate/deactivate users, assign roles, and delete accounts
- **Restaurant Oversight**: Approve, suspend, and manage all registered restaurants
- **Order Monitoring**: View all orders across the platform, filter by status
- **Review Moderation**: Publish, hide, or remove reviews
- **Category Management**: Create and manage food categories
- **Audit Logs**: Full activity log per user and platform-wide
- **Push Notifications**: Broadcast notifications to all users from the admin panel

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts** — analytics and reporting charts
- **Lucide React** — icons
- **Web Push API + Service Worker** — push notifications

### Backend
- **.NET 9** (ASP.NET Core Web API)
- **Clean Architecture** — Core / Application / Infrastructure / API layers
- **Entity Framework Core 9** + **SQL Server**
- **JWT Bearer Authentication** with refresh token rotation
- **Cloudinary** — image (5 MB limit) and video file storage
- **MailKit + MimeKit** — transactional email (verification, password reset)
- **Scalar** — OpenAPI docs with Bearer JWT support
- **Rate Limiting** — 100 requests/minute fixed window

---

## 🏗️ Architecture

```
Foodie-Flow/
├── FoodieFlow-backend/
│   └── FoodOrdering-master/
│       ├── FoodOrdering.API/           # Controllers, Program.cs, middleware
│       │   └── Controllers/            # Auth, Admin, Restaurant, Order, Dish, Review...
│       ├── FoodOrdering.Application/   # Services, Interfaces, DTOs, Repositories (contracts)
│       ├── FoodOrdering.Core/          # Entities, Enums, Validators (pure domain)
│       └── FoodOrdering.Infrastructure/# EF Core DbContext, Migrations, Repositories, Cloudinary, Email
│
└── FoodieFlow-frontend/
    └── src/
        ├── app/
        │   ├── (auth)/                 # Login, Register, Verify Email, Forgot/Reset Password
        │   ├── admin/                  # Dashboard, Users, Restaurants, Orders, Reviews, Audit Logs...
        │   ├── customer/               # Browse, Search, Cart, Checkout, Orders, Profile
        │   └── restaurant/             # Dashboard, Dishes, Orders, Videos, Reviews
        ├── components/                 # Admin, Customer, Restaurant, Layout, Common UI
        ├── lib/api/                    # Typed service layers (auth, admin, customer, restaurant)
        ├── store/                      # Auth store, Cart store, UI store
        └── types/                      # TypeScript types for orders, dishes, auth, reviews
```

---

## 🔐 Authentication & Security

- JWT access tokens (60-minute expiry) with refresh token rotation
- Expired token header (`Token-Expired: true`) for silent client-side refresh
- Bcrypt password hashing
- Email verification required on registration
- Forgot password / reset password flow via email
- Account lockout after repeated failed login attempts
- Role-based authorization: `Customer`, `Restaurant`, `Admin`
- Session tracking per user (device/IP)

---

## 📦 Order Lifecycle

Orders move through 10 statuses tracked with individual timestamps:

```
Pending → Accepted → Preparing → Ready → PickedUp → OnTheWay → Delivered → Completed
                                                                          ↘ Cancelled / Rejected
```

Each order stores delivery GPS coordinates, subtotal, delivery fee, service fee, tax, discount, and total amount.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **.NET 9 SDK**
- **SQL Server** (local or remote)
- **Cloudinary account** (for image/video uploads)
- **SMTP server** (for email, optional in dev)

### 1. Backend Setup

```bash
cd FoodieFlow-backend/FoodOrdering-master

# Update connection string in FoodOrdering.API/appsettings.json
# "DefaultConnection": "your SQL Server connection string"

# Run migrations
dotnet ef database update --project FoodOrdering.Infrastructure --startup-project FoodOrdering.API

# Start the API
dotnet run --project FoodOrdering.API
# Runs on https://localhost:7297
# Scalar API docs at https://localhost:7297/scalar
```

**Required `appsettings.json` values:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your-sql-server-connection-string"
  },
  "Jwt": {
    "Key": "your-secret-key-min-32-chars",
    "Issuer": "YourApp",
    "Audience": "YourAppUsers",
    "ExpireMinutes": 60
  },
  "Cloudinary": {
    "CloudName": "your-cloud-name",
    "ApiKey": "your-api-key",
    "ApiSecret": "your-api-secret"
  },
  "Email": {
    "FromEmail": "no-reply@yourapp.com",
    "SmtpHost": "your-smtp-host",
    "SmtpPort": "587",
    "SmtpUseSsl": "true",
    "SmtpUser": "your-smtp-user",
    "SmtpPass": "your-smtp-password"
  }
}
```

### 2. Frontend Setup

```bash
cd FoodieFlow-frontend/onlineFoodOrdering-foodieFlow-frontend-main

# Create .env.local
cp .evn.local .env.local
# Update values:
# NEXT_PUBLIC_API_URL=https://localhost:7297
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

npm install
npm run dev
# Runs on http://localhost:3000
```

---

## 🗃️ Database Migrations

| Migration | Date | Description |
|-----------|------|-------------|
| `Initial Migration` | 2026-02-08 | Users, Restaurants, Dishes, Categories |
| `role` | 2026-02-08 | Role entity |
| `roles` | 2026-02-08 | User–Role join table |
| `authfix` | 2026-02-12 | Auth fields (lockout, sessions, tokens) |
| `order` | 2026-02-14 | Orders and OrderItems |
| `Review` | 2026-02-19 | Reviews for dishes and restaurants |
| `book` | 2026-02-23 | Book/menu reference entity |

To apply all migrations:
```bash
dotnet ef database update --project FoodOrdering.Infrastructure --startup-project FoodOrdering.API
```

---

## 📡 API Overview

The REST API is documented via **Scalar** at `/scalar` in development. Key route groups:

| Route Group | Description |
|-------------|-------------|
| `POST /api/auth/register` | Register as customer |
| `POST /api/auth/register-restaurant` | Register as restaurant owner |
| `POST /api/auth/login` | Login, returns JWT + refresh token |
| `POST /api/auth/refresh-token` | Rotate refresh token |
| `GET /api/restaurants` | Browse restaurants |
| `GET/POST /api/dishes` | Dish management |
| `GET/POST /api/orders` | Create and retrieve orders |
| `POST /api/orders/{id}/accept` | Restaurant accepts order |
| `POST /api/orders/{id}/reject` | Restaurant rejects order |
| `GET/POST /api/reviews` | Reviews for dishes and restaurants |
| `GET /api/admin/dashboard` | Platform stats (Admin only) |
| `GET /api/admin/audit-logs` | User activity logs (Admin only) |

---

## 📁 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://localhost:7297
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-key   # Optional — enables full Web Push
```

### Backend (`appsettings.json`)
See the configuration section above. Never commit real secrets — use environment variables or a secrets manager in production.
