# TitouBarz - Premium Calisthenics Equipment Store

A full-stack e-commerce application for selling premium calisthenics and sports equipment, built with React.js, Node.js, MongoDB, and deployed on Firebase.

## 🚀 **Features**

- **Product Management**: Full CRUD operations for products with MongoDB
- **Order System**: Complete order management with wilaya-based shipping
- **Admin Panel**: Protected admin interface with password authentication
- **Responsive Design**: Modern UI with Material-UI components
- **Real-time Data**: Live product and order updates
- **Multi-language Support**: English and Arabic labels

## 🛠️ **Tech Stack**

### Frontend
- React.js 18
- Material-UI (MUI)
- React Router DOM
- CSS Custom Properties

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- RESTful API

### Database
- MongoDB (Local or Atlas)

### Deployment
- Firebase Hosting (Frontend)
- Render/Vercel/Heroku (Backend)

## 📋 **Prerequisites**

- Node.js (v16 or higher)
- MongoDB (Local installation or MongoDB Atlas account)
- Firebase account (for deployment)
- Git

## 🚀 **Quick Start**

### 1. **Clone the Repository**
```bash
git clone <your-repo-url>
cd Shoppy-Barz
```

### 2. **Backend Setup**

#### Install Dependencies
```bash
cd Backend
npm install
```

#### Environment Configuration
Create a `.env` file in the Backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/titoubarz
PORT=5000
NODE_ENV=development
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/titoubarz
PORT=5000
NODE_ENV=production
```

#### Start MongoDB
**Local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**MongoDB Atlas:**
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a new cluster
- Get your connection string
- Update `.env` file

#### Start Backend Server
```bash
npm start
# or
npm run dev
```

### 3. **Frontend Setup**

#### Install Dependencies
```bash
cd Frontend
npm install
```

#### Start Development Server
```bash
npm run dev
```

## 🔧 **Configuration**

### MongoDB Connection
The application supports both local MongoDB and MongoDB Atlas:

**Local MongoDB:**
- Install MongoDB Community Server
- Default connection: `mongodb://localhost:27017/titoubarz`

**MongoDB Atlas:**
- Free tier available
- Better for production
- Automatic backups and scaling

### API Endpoints
- **Products**: `GET/POST/PUT/DELETE /api/products`
- **Orders**: `GET/POST/PUT/DELETE /api/orders`
- **Admin**: Protected routes with password authentication

## 🚀 **Deployment**

### Frontend (Firebase)

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### 2. Login to Firebase
```bash
firebase login
```

#### 3. Initialize Firebase Project
```bash
cd Frontend
firebase init hosting
```

#### 4. Build and Deploy
```bash
npm run build
firebase deploy
```

### Backend (Render/Vercel/Heroku)

#### Render (Recommended - Free)
1. Create account at [Render](https://render.com)
2. Connect your GitHub repository
3. Set environment variables
4. Deploy automatically on push

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

#### Heroku
1. Install Heroku CLI
2. Create app: `heroku create`
3. Set config vars
4. Deploy: `git push heroku main`

## 📱 **Usage**

### Admin Access
- URL: `/admin`
- Password: `toUfik99T@`
- Manage products and orders

### Product Management
- Add/Edit/Delete products
- Upload product images
- Set categories and pricing
- Manage inventory

### Order System
- Customer order forms
- Wilaya-based shipping calculation
- Order status tracking
- Admin order management

## 🔒 **Security Features**

- Admin route protection
- Password-based authentication
- Input validation
- CORS configuration
- Environment variable protection

## 📊 **Database Schema**

### Products
- Name, description, price
- Images array
- Category, tags
- Specifications
- Ratings and reviews
- Inventory status

### Orders
- Customer information
- Product details
- Shipping information
- Order status
- Payment details

## 🐛 **Troubleshooting**

### Common Issues

**MongoDB Connection Error:**
- Check if MongoDB is running
- Verify connection string
- Check network connectivity

**Port Already in Use:**
- Change PORT in .env file
- Kill process using the port

**CORS Issues:**
- Check backend CORS configuration
- Verify frontend API URL

**Build Errors:**
- Clear node_modules and reinstall
- Check Node.js version
- Verify package.json dependencies

### Debug Mode
```bash
# Backend
NODE_ENV=development npm start

# Frontend
npm run dev
```

## 📈 **Performance Optimization**

- Database indexing
- Image optimization
- Lazy loading
- Code splitting
- CDN for static assets

## 🔄 **Updates and Maintenance**

### Regular Tasks
- Database backups
- Security updates
- Performance monitoring
- User feedback collection

### Version Control
- Feature branches
- Pull request reviews
- Automated testing
- Deployment pipelines

## 📞 **Support**

For technical support or questions:
- Email: info@titoubarz.com
- GitHub Issues: Create an issue in the repository

## 📄 **License**

This project is licensed under the MIT License.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎯 **Roadmap**

- [ ] User authentication system
- [ ] Shopping cart functionality
- [ ] Payment integration
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-currency support

---

**Happy Coding! 🚀**
