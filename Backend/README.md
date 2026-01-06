# Shoppy Barz Backend API

A comprehensive backend API for the Shoppy Barz sports equipment e-commerce platform, built with Node.js, Express, and MongoDB.

## Features

- **Product Management**: CRUD operations for sports equipment products
- **User Authentication**: JWT-based authentication with password hashing
- **Order Management**: Complete e-commerce order processing
- **Contact Management**: Contact form handling with spam detection
- **Algerian Delivery System**: Complete wilayas and communes with delivery pricing
- **Admin Dashboard**: Statistics and management tools
- **Security**: Rate limiting, CORS, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Validation**: Mongoose validators
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/shoppy-barz

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Cloudinary Configuration (optional)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `POST /api/users/forgot-password` - Forgot password
- `POST /api/users/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories` - Get product categories
- `GET /api/products/search` - Search products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/stats/overview` - Product statistics (Admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id` - Update order (Admin)
- `PATCH /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/stats` - Order statistics (Admin)

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (Admin)
- `GET /api/contact/:id` - Get single contact (Admin)
- `PUT /api/contact/:id` - Update contact (Admin)
- `DELETE /api/contact/:id` - Delete contact (Admin)
- `PATCH /api/contact/:id/read` - Mark as read (Admin)
- `GET /api/contact/stats` - Contact statistics (Admin)

### Delivery (Algerian Wilayas)
- `GET /api/delivery/wilayas` - Get all wilayas
- `GET /api/delivery/wilayas/:id` - Get wilaya by ID
- `GET /api/delivery/wilayas/:id/communes` - Get communes by wilaya
- `POST /api/delivery/calculate` - Calculate delivery price
- `GET /api/delivery/zones` - Get delivery zones
- `GET /api/delivery/search` - Search wilayas
- `GET /api/delivery/stats` - Delivery statistics (Admin)

## Database Models

### User
- Authentication fields (email, password)
- Profile information (firstName, lastName, phone)
- Addresses and preferences
- Security features (login attempts, account locking)

### Product
- Product details (name, price, description, images)
- Inventory management (stock, inStock)
- Categories and tags
- Specifications and shipping info

### Order
- Order items and totals
- Shipping address and delivery info
- Payment status and tracking
- Order timeline and status management

### Contact
- Contact form submissions
- Spam detection
- Status tracking and assignment
- Notes and priority management

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Mongoose validators
- **CORS Protection**: Configured for frontend
- **Helmet**: Security headers
- **Account Locking**: After failed login attempts

## Algerian Delivery System

The backend includes a comprehensive Algerian delivery system with:

- **58 Wilayas** (provinces) with delivery pricing
- **Communes** (municipalities) for each wilaya
- **Dynamic pricing** based on location
- **Free delivery** for orders over 5000 DZD
- **Delivery time estimation** based on location
- **Delivery zones** (Immediate, Standard, Extended)

## Error Handling

- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for debugging
- Validation error handling

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Development

### Running in Development
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure MongoDB connection string
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up environment variables
6. Use PM2 or similar process manager

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, email support@shoppybarz.com or create an issue in the repository. 