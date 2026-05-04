# WhatsApp Ticketing System

A comprehensive customer support platform built with WhatsApp Business API integration for managing conversations, tickets, and bulk messaging.

## Architecture

- **Frontend**: React 18 with Vite, TypeScript support, and TailwindCSS
- **Backend**: Node.js with Express.js
- **Database**: MySQL 8+ 
- **Authentication**: JWT with bcrypt password hashing
- **External API**: WhatsApp Business API (Meta Graph API v18.0)

## Features

### Staff Features
- **Ticket Management**: 3-column inbox interface (ticket list, conversation, details)
- **Message Actions**: Reply, forward, flag, create ticket from messages via right-click
- **Contact Management**: Store customer data with labels (VIP, New Customer, Issue, etc.)
- **Bulk Messaging**: CSV upload with variable replacement ({{name}}, {{company}})
- **Templates**: Save and reuse message templates
- **Analytics**: Real-time dashboard with charts and performance metrics

### Admin Features
- **Multi-Phone Management**: Manage multiple WhatsApp Business numbers
- **Staff Management**: Create and manage agent accounts
- **Chat History**: View and search all conversations
- **System Settings**: Configure system preferences
- **Reports**: Export chat logs and analytics

## Setup Instructions

### Prerequisites

- Node.js 16+
- MySQL 8+
- WhatsApp Business API credentials (or use demo mode for testing)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in backend directory:
```env
# Server
PORT=8080
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_ticketing

# WhatsApp Business API (Demo Mode)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=demo_phone_id_12345
WHATSAPP_ACCESS_TOKEN=demo_access_token
WHATSAPP_VERIFY_TOKEN=demo_verify_token

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

4. Setup database:
```bash
mysql -u root -p
CREATE DATABASE whatsapp_ticketing;
exit;

# Import database schema
mysql -u root -p whatsapp_ticketing < database/DATABASE-WORKING-FINAL.sql
```

5. Run the backend:
```bash
npm start
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:8080
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`



## Project Structure

```
whatsapp-ticketing-system/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection
│   ├── controllers/             # Request handlers
│   ├── models/                  # Database models
│   ├── routes/                  # API routes
│   ├── middleware/              # Auth & validation
│   ├── database/
│   │   └── DATABASE-WORKING-FINAL.sql
│   ├── server.js                # Express app entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new staff member
- `POST /api/auth/login` - Staff login
- `GET /api/auth/profile` - Get current user profile

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id/status` - Update ticket status

### Messages
- `GET /api/messages/:ticketId` - Get messages for ticket
- `POST /api/messages/:ticketId/reply` - Send reply

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create contact
- `POST /api/contacts/:id/labels` - Assign label to contact
- `DELETE /api/contacts/:id/labels/:label` - Remove label

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Phone Numbers
- `GET /api/phones` - Get all phone numbers
- `POST /api/phones` - Add phone number
- `PATCH /api/phones/:id/toggle` - Toggle active status

### Bulk Messaging
- `GET /api/bulk-messages` - Get campaigns
- `POST /api/bulk-messages` - Create campaign

### Analytics
- `GET /api/analytics/stats` - Get statistics
- `GET /api/analytics/charts` - Get chart data

## Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

### Database Schema
The application uses 11 tables:
- `staff` - System users
- `phone_numbers` - WhatsApp business numbers
- `tickets` - Support tickets
- `messages` - WhatsApp messages
- `contacts` - Customer information
- `contact_labels` - Contact categorization
- `message_templates` - Saved templates
- `bulk_messages` - Messaging campaigns
- `bulk_message_recipients` - Campaign tracking
- `ticket_assignments` - Ticket-agent mapping
- `tasks` - Task management

## Production Deployment

### Environment Setup

**Backend `.env`:**
```env
NODE_ENV=production
PORT=8080
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=strong-production-password
JWT_SECRET=super-long-random-production-secret

# Real WhatsApp API credentials
WHATSAPP_PHONE_NUMBER_ID=your_real_phone_id
WHATSAPP_ACCESS_TOKEN=your_real_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

### Build & Deploy

1. **Build Frontend:**
```bash
cd frontend
npm run build
```

2. **Deploy with PM2:**
```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "whatsapp-backend"

# Serve frontend
cd ../frontend
pm2 serve dist 3000 --name "whatsapp-frontend"

# Save configuration
pm2 save
pm2 startup
```

3. **Setup Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

4. **SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d yourdomain.com
```

## WhatsApp Business API Setup

For production with real WhatsApp messaging:

1. Create Meta Business Manager account: https://business.facebook.com
2. Add WhatsApp Business Account
3. Get Phone Number ID and Access Token
4. Update `.env` with real credentials
5. Configure webhook URL for incoming messages

For development, demo mode works without real API credentials.

## License

MIT License - see LICENSE file for details.

## Contact

**Developer**: Koushik Shet  
**Email**: koushikshet2401@gmail.com  
**GitHub**: [@koushikshet](https://github.com/koushikshet)

## Acknowledgments

- WhatsApp Business API - Meta Platforms
- Periskope - UI/UX inspiration
- Open source community
