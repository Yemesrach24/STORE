# Inventory Management System

A comprehensive inventory management application built with Next.js 14, TypeScript, Tailwind CSS, and MongoDB. Features user authentication, role-based access control, real-time inventory tracking, and a modern responsive interface.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Google OAuth 2.0**: Secure user authentication with Google Sign-In (Auth.js)
- **Role-Based Access Control**: Admin, Manager, and User roles
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Secure session handling

### 📦 Inventory Management
- **CRUD Operations**: Complete Create, Read, Update, Delete for inventory items
- **Real-time Tracking**: Live inventory updates and stock monitoring
- **Category Management**: Hierarchical category system with colors and icons
- **Stock Alerts**: Low stock and out-of-stock notifications
- **Barcode/SKU Support**: Product identification and tracking
- **Supplier Management**: Track suppliers and purchase information

### 📊 Analytics & Reporting
- **Dashboard Analytics**: Real-time statistics and metrics
- **Export Functionality**: CSV export for inventory data
- **Stock Status Tracking**: In-stock, low-stock, out-of-stock monitoring
- **Profit Margin Calculation**: Automatic profit margin calculations
- **Transaction History**: Complete audit trail for all inventory changes

### 👥 User Management
- **Profile Management**: User profiles with customizable settings
- **Account Settings**: Regional, notification, and security preferences
- **Personal Inventory**: User-specific inventory views
- **Avatar Upload**: Profile picture management

### 🛠️ Admin Panel
- **User Management**: Admin control over user accounts
- **Global Inventory**: System-wide inventory overview
- **Bulk Operations**: Mass actions on users and inventory
- **System Analytics**: Comprehensive system statistics
- **Activity Logs**: User activity tracking

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first responsive layout
- **shadcn/ui Components**: Beautiful, accessible UI components
- **Dark/Light Mode**: Theme customization
- **Loading States**: Smooth loading experiences
- **Error Boundaries**: Graceful error handling

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Google OAuth 2.0 via Auth.js (NextAuth)
- **Database**: MongoDB with Mongoose
- **Form Handling**: React Hook Form + Zod
- **State Management**: React Hooks
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd inventory-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment example file and configure your variables:

```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Google OAuth (Auth.js)
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_auth_secret_here
AUTH_GOOGLE_ID=your_google_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your_google_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/inventory-management
```

> 📘 **Need the Google OAuth Client ID/Secret?** Follow the complete
> step-by-step walkthrough in [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md) —
> it covers the Google Cloud Console clicks, the exact redirect URI, and
> troubleshooting for the most common errors.

### 4. Database Setup

#### Local MongoDB
```bash
# Start MongoDB service
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env.local`

### 5. Seed Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All API endpoints require authentication. Include the authorization header:
```
// Sessions are cookie-based — the NextAuth session cookie is sent automatically
```

### Endpoints

#### Authentication
- `GET /api/users/me` - Get current user profile

#### User Management
- `PATCH /api/users/{userId}/settings` - Update user settings

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category

#### Inventory Items
- `GET /api/items` - Get inventory items (with pagination, search, filters)
- `POST /api/items` - Create new item
- `GET /api/items/{id}` - Get item by ID
- `PUT /api/items/{id}` - Update item
- `PATCH /api/items/{id}` - Update item quantity
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/export` - Export items to CSV

#### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create user (admin only)
- `PUT /api/admin/users/{id}` - Update user (admin only)
- `DELETE /api/admin/users/{id}` - Delete user (admin only)
- `PATCH /api/admin/users/bulk` - Bulk user operations (admin only)
- `GET /api/admin/inventory` - Global inventory overview (admin only)
- `GET /api/admin/analytics` - System analytics (admin only)

### Rate Limiting
- **Authentication endpoints**: 5 requests/minute
- **Admin endpoints**: 50 requests/minute
- **Regular endpoints**: 100 requests/minute

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🧪 Testing

### Postman Collection
Import the provided Postman collection (`postman_collection.json`) to test all API endpoints.

### Manual Testing
1. Start the development server
2. Navigate to the application
3. Sign up for a new account
4. Test all features and functionality

## 📁 Project Structure

```
inventory-management/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── inventory/         # Inventory pages
│   │   ├── profile/           # Profile pages
│   │   └── auth/              # Authentication pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components
│   │   ├── inventory/        # Inventory components
│   │   ├── profile/          # Profile components
│   │   └── admin/            # Admin components
│   ├── lib/                  # Utility libraries
│   │   ├── validations/      # Zod schemas
│   │   ├── mongodb.ts        # Database connection
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── rate-limit.ts     # Rate limiting
│   │   └── error-handler.ts  # Error handling
│   ├── models/               # Mongoose models
│   └── hooks/                # Custom React hooks
├── public/                   # Static assets
├── postman_collection.json   # Postman API collection
├── API_DOCUMENTATION.md      # Complete API documentation
└── env.example              # Environment variables template
```

## 🔧 Configuration

### Environment Variables

See `env.example` for all available environment variables and their descriptions.

### Database Models

#### User Model
- Basic info (name, email, role)
- Profile settings (phone, location, bio)
- Preferences (timezone, language, currency, theme)
- Notification settings
- Security settings

#### Item Model
- Product information (name, description, SKU, barcode)
- Inventory data (quantity, price, cost price)
- Category and supplier information
- Stock management (min/max quantities)
- Tags and metadata

#### Category Model
- Hierarchical categories with parent-child relationships
- Color and icon customization
- User association

#### Transaction Model
- Complete audit trail for inventory changes
- Transaction types (IN, OUT, ADJUSTMENT, TRANSFER)
- User tracking and timestamps

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Configure build settings for Next.js
- **Railway**: Use the Next.js template
- **DigitalOcean App Platform**: Select Next.js as the framework

### Environment Setup for Production

1. Create production environment variables
2. Set up production MongoDB database
3. Configure Google OAuth and AUTH_SECRET for production
4. Set up domain and SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the [Issues](../../issues) page
3. Create a new issue with detailed information

## 🧪 Testing

### Test Types

- **Unit Tests**: Jest + React Testing Library for component testing
- **Integration Tests**: Component interaction and workflow testing
- **API Tests**: Backend endpoint testing with database integration
- **E2E Tests**: Playwright for full user journey testing

### Running Tests

```bash
# Unit and integration tests
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug

# Database seeding
npm run seed
npm run test:seed
```

### Test Coverage

- Unit tests: 80%+ coverage target
- Integration tests: Critical user flows
- E2E tests: Main user journeys
- API tests: All endpoints

### Documentation

- [Testing Guide](TESTING.md) - Comprehensive testing documentation
- [API Documentation](API_DOCUMENTATION.md) - API testing and examples
- Postman collection for API testing

## 🗺️ Roadmap

- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and analytics
- [ ] Integration with external APIs
- [ ] Multi-tenant support
- [ ] Advanced search and filtering
- [ ] Barcode scanning
- [ ] Email notifications
- [ ] Backup and restore functionality
- [ ] Performance optimizations

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Auth.js](https://authjs.dev/) - Authentication (Google OAuth 2.0)
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
