# EasyStay Hotel Booking Platform

English | [简体中文](./README.md)

A complete hotel booking system with a mobile user interface and a PC admin interface.

## Project Info

- **Server IP**: 81.71.15.150
- **Domain**: easystay4u.site (HTTPS + Let's Encrypt certificate configured)
- **Project Path**: /root/hotel/EasyStay_Hotel_Booking_kud
- **Access URLs**:
  - Admin: https://easystay4u.site
  - Mobile: https://easystay4u.site/mobile/
  - Backend API: https://easystay4u.site/api
  - API Docs: http://81.71.15.150/api-docs/
  - Direct IP Access (recommended before ICP filing):
    - Admin: http://81.71.15.150/
    - Mobile: http://81.71.15.150/mobile/
    - Health Check: http://81.71.15.150/api/health

## Project Structure

```text
EasyStay_Hotel_Booking_kud/
├── server/              # Backend service (Node.js + Express)
├── client-mobile/       # Mobile app (React + Ant Design Mobile)
├── admin-pc/            # PC admin app (React + Ant Design)
├── pm2.config.js        # Unified PM2 config
├── logs/                # Service logs
└── server/data/         # Data files (JSON)
```

## Tech Stack

### Backend
- Node.js
- Express
- JSON file storage

### Mobile
- React 18
- React Router
- Ant Design Mobile
- Axios

### PC Admin
- React 18
- React Router
- Ant Design
- Axios

## Quick Start

### Option 1: Start all services with PM2 (recommended for cloud servers)

```bash
# Enter project directory
cd /root/hotel/EasyStay_Hotel_Booking_kud

# Start all services with the unified PM2 config
pm2 start pm2.config.js

# Save PM2 process list (for startup)
pm2 save
pm2 startup

# Check service status
pm2 status
```

### Option 2: Start services separately (local development)

```bash
# 1. Install dependencies
cd server
npm install

cd ../client-mobile
npm install

cd ../admin-pc
npm install

# 2. Start backend service (Terminal 1)
cd server
npm start

# 3. Start mobile app (Terminal 2)
cd client-mobile
npm start

# 4. Start PC admin app (Terminal 3)
cd admin-pc
npm start
```

## Common PM2 Commands

```bash
# Check status of all services
pm2 status

# View service logs
pm2 logs easystay-server
pm2 logs easystay-admin
pm2 logs easystay-mobile

# Restart services
pm2 restart all
pm2 restart easystay-server

# Stop services
pm2 stop all
pm2 stop easystay-server

# Delete services
pm2 delete all
```

## Test Accounts

- **Admin**: admin / admin123
- **Merchant**: merchant1 / merchant123

## Features

### Mobile Features
- Hotel search page: banner, city selector, date selector, star/price filters, quick tags
- Hotel list page: paginated loading, sorting, filtering, city selector
- Hotel detail page: image carousel, room price list (sorted by price), booking

### PC Admin Features
- Dashboard: statistics for hotel count and review status
- Merchant entry: add new hotel information
- Review management: review pending hotels
- Hotel management: view, edit, and delete all hotels

### Backend APIs
- `GET /api/hotels` - Get hotel list (supports pagination, sorting, filters: city/star/price/tags; `status=approved` shows online hotels only)
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels` - Add a hotel (supports room types and opening time)
- `PUT /api/hotels/:id` - Update a hotel
- `PUT /api/hotels/:id/status` - Update hotel status (including review rejection reason and `offline`)
- `DELETE /api/hotels/:id` - Delete a hotel
- `POST /api/bookings` - Create booking (user-side hotel booking)
- `GET /api/bookings` - Get booking list
- `GET /api/stats` - Get statistics

## Business Flow

1. **Merchant entry**: Add hotel information on the "Merchant Entry" page in the PC admin app
2. **Review management**: Review pending hotels on the "Review Management" page (approve/reject)
3. **User browsing**: Approved hotels are shown on mobile, where users can search and view details

## Data Storage

- `server/data/hotels.json` - Hotel data
- `server/data/users.json` - User data
- `server/data/bookings.json` - Booking order data
- `server/data/messages.json` - Notification messages

## Location Feature (Baidu Maps)

The "Locate" button on the homepage and hotel list uses Baidu Maps reverse geocoding. **An AK is preconfigured in this project**, so it works once the backend starts. For other clones, apply for your own AK and create `server/.env`.

See Chapter 4 in [项目手册.md](./项目手册.md) for details.

## Development Notes

- Backend default port: 3000
- Mobile default port: 3001
- PC admin default port: 3011
- All requests are proxied to the backend service

## Changelog

### Latest fixes and improvements (2026-02)

**Bug Fixes:**
- Backend API: pagination, sorting, and filtering (`city/star/price/tags`)
- Hotel offline/online: supports `offline` state and restoring online
- Admin hotel status update: correctly passes `role` parameter
- Review rejection: reason is required and displayed in details
- Hotel room types: supports multi-room entry and price-sorted display on details page
- Registration form: role selection switched to Ant Design `Select`
- Mobile: city selector and URL parameter synchronization

**New Features:**
- City selector component: supports hot cities, search, and list selection
- Room types and opening time: extended merchant entry form
- Booking API: user booking integrated with backend, orders persisted to `bookings.json`

## Hotel Data Update

This project's hotel dataset has been updated with:
- **Real data**: real hotel information for Beijing, Tianjin, and Shanghai (fetched via Baidu Maps API)
- **Mock data**: hotel data for 100+ cities nationwide (generated from an administrative-division-based model)
- **Total volume**: 5,469 hotel records

Related scripts are in `server/scripts/`:
- `fetch-real-hotels.js` - Fetch real hotel data
- `generate-from-real.js` - Generate mock hotel data
- `clean-and-import.js` - Data cleaning and import
- `geo_data.js` - National administrative division data

## HTTPS and Domain

This project has completed an HTTPS upgrade:
- **Domain**: `easystay4u.site` (registered on Alibaba Cloud)
- **SSL Certificate**: Let's Encrypt (auto-renewed, 90-day validity)
- **Protocols**: TLS 1.2/1.3 + HTTP/2 + HSTS
- **Auto redirect**: domain HTTP access auto-redirects to HTTPS (301)
- **Direct IP compatibility**: `http://81.71.15.150` remains available

## Documents

- **Project Manual** (deployment, self-check, defense, FAQ): [项目手册.md](./项目手册.md)
- **Deployment Guide**: [部署指南.md](./部署指南.md)
- **Validation Testing Guide**: [验证测试指导手册.md](./验证测试指导手册.md)
- **Git Commit Guide**: [GIT_提交指南.md](./GIT_提交指南.md)
- **Coze AI Agent Setup Guide**: [Coze_Agent_搭建指南.md](./Coze_Agent_搭建指南.md)
- **Coze AI Design and Deployment Plan**: [Coze_Agent_设计方案与部署步骤.md](./Coze_Agent_设计方案与部署步骤.md)

## License

This project is licensed under the [MIT License](./LICENSE).
