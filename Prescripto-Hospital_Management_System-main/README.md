# Prescripto - Hospital Management System

A comprehensive full-stack web application for managing hospital operations, appointments, and patient-doctor interactions. Built with the MERN stack (MongoDB, Express.js, React, Node.js), this system provides a seamless experience for patients, doctors, and administrators.

## 🚀 Features

### For Patients (Frontend)
- **User Registration & Authentication**: Secure signup and login with JWT tokens
- **Doctor Discovery**: Browse doctors by specialty with detailed profiles
- **Appointment Booking**: Easy online appointment scheduling with real-time availability
- **Profile Management**: Update personal information and view appointment history
- **Payment Integration**: Secure payments via Razorpay and Stripe
- **Responsive Design**: Mobile-friendly interface built with React and Tailwind CSS

### For Doctors (Doctor Panel)
- **Dashboard**: Overview of appointments, earnings, and patient statistics
- **Appointment Management**: View and manage scheduled appointments
- **Profile Management**: Update professional information and availability
- **Earnings Tracking**: Monitor consultation fees and payments

### For Administrators (Admin Panel)
- **Doctor Management**: Add, edit, and remove doctors from the system
- **Appointment Oversight**: View all appointments across the platform
- **Dashboard Analytics**: Comprehensive statistics on users, doctors, and appointments
- **System Administration**: Full control over platform operations

## 🛠️ Tech Stack

### Frontend
- **React**: Component-based UI development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Toastify**: Notification system

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **Cloudinary**: Image upload and management
- **Multer**: File upload middleware
- **Razorpay & Stripe**: Payment gateways
- **Validator**: Input validation

### Additional Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📁 Project Structure

```
Prescripto-Hospital_Management_System-main/
├── frontend/          # Patient-facing React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── context/       # React context for state management
│   │   └── assets/        # Images and static files
│   └── package.json
├── backend/           # Express.js API server
│   ├── config/        # Database and cloud configurations
│   ├── controllers/   # Route handlers
│   ├── middleware/    # Authentication and file upload middleware
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API endpoints
│   └── server.js      # Main server file
├── admin/             # Admin management panel
│   ├── src/
│   │   ├── components/    # Admin UI components
│   │   ├── pages/         # Admin dashboard pages
│   │   ├── context/       # Admin context
│   │   └── assets/        # Admin assets
│   └── package.json
└── README.md
```

## 🔧 Modules Overview

### 1. Frontend Module (Patient Portal)
- **Home Page**: Hero section, specialty menu, top doctors, promotional banner
- **Doctor Listing**: Filter doctors by specialty
- **Doctor Profile**: Detailed information, availability, booking interface
- **Appointment System**: Date/time selection, payment processing
- **User Dashboard**: Profile management, appointment history

### 2. Backend Module (API Server)
- **User Management**: Registration, authentication, profile updates
- **Doctor Management**: CRUD operations for doctor profiles
- **Appointment Management**: Booking, cancellation, status updates
- **Payment Processing**: Integration with payment gateways
- **File Upload**: Image management via Cloudinary

### 3. Admin Module (Management Panel)
- **Dashboard**: Analytics and overview statistics
- **Doctor CRUD**: Add/edit/remove doctors
- **Appointment Monitoring**: View and manage all appointments
- **User Oversight**: Monitor user activities

## ⚙️ How It Works

### User Journey
1. **Registration/Login**: Users create accounts or log in to access the system
2. **Browse Doctors**: Users explore available doctors by specialty
3. **Book Appointment**: Select doctor, choose date/time, and proceed to payment
4. **Payment**: Secure payment processing through integrated gateways
5. **Confirmation**: Receive appointment confirmation and details
6. **Consultation**: Attend virtual/physical appointment as scheduled

### Doctor Workflow
1. **Login**: Doctors access their dedicated panel
2. **View Appointments**: Check scheduled appointments and patient details
3. **Manage Availability**: Update working hours and availability
4. **Consultation**: Conduct appointments and update status
5. **Earnings**: Track consultation fees and payments

### Admin Operations
1. **System Oversight**: Monitor overall platform performance
2. **Doctor Management**: Onboard new doctors and manage existing ones
3. **Appointment Monitoring**: Oversee all appointments and resolve issues
4. **Analytics**: Review system usage and performance metrics

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Cloudinary account for image uploads
- Razorpay/Stripe accounts for payments

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. Start the server:
   ```bash
   npm start
   # or for development
   npm run server
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Admin Panel Setup
1. Navigate to the admin directory:
   ```bash
   cd admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### User Routes
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/profile` - Get user profile
- `POST /api/user/book-appointment` - Book appointment
- `GET /api/user/appointments` - Get user appointments

### Doctor Routes
- `POST /api/doctor/login` - Doctor login
- `GET /api/doctor/profile` - Get doctor profile
- `GET /api/doctor/appointments` - Get doctor appointments
- `POST /api/doctor/update-profile` - Update doctor profile

### Admin Routes
- `POST /api/admin/login` - Admin login
- `POST /api/admin/add-doctor` - Add new doctor
- `GET /api/admin/doctors` - Get all doctors
- `GET /api/admin/appointments` - Get all appointments
- `POST /api/admin/change-availability` - Update doctor availability

## 🔐 Authentication & Security

- **JWT Tokens**: Secure authentication for all user types
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation using validator library
- **CORS**: Cross-origin resource sharing configuration
- **File Upload Security**: Multer with file type restrictions

## 💳 Payment Integration

- **Razorpay**: Indian payment gateway integration
- **Stripe**: International payment processing
- **Secure Transactions**: PCI-compliant payment handling
- **Multiple Currencies**: Support for various currencies

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Cross-Browser**: Compatible with all modern browsers
- **Accessibility**: WCAG compliant design principles
- **Performance**: Optimized loading times and smooth interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@prescripto.com or join our Slack channel.

---

**Built with ❤️ by RAJAT SINGH TOMAR for better healthcare management**
