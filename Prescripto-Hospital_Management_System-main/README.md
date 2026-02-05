# Prescripto - Advanced Hospital Management System

A comprehensive full-stack web application for managing hospital operations, appointments, and patient-doctor interactions. Built with the MERN stack (MongoDB, Express.js, React, Node.js), this system provides a seamless experience for patients, doctors, and administrators with advanced features including AI-powered diagnostics, smart scheduling, and comprehensive analytics.

## 🚀 Latest Features & Updates

### 🔐 Enhanced Authentication System
- **Password Visibility Toggle**: Eye button to show/hide password during login
- **Forgot Password**: Complete password reset flow with email verification
- **Secure Registration**: Email verification and strong password requirements
- **OAuth Integration**: Google login support for quick access
- **Two-Factor Authentication**: Optional 2FA for enhanced security

### 📅 Smart Appointment Booking System
- **Patient Information Collection**: Automatic collection of patient details (name, gender, age) during booking
- **Profile Validation**: System checks existing user profiles and collects missing information
- **Real-time Availability**: Dynamic slot generation based on doctor schedules
- **Multiple Payment Options**: Cash payment at clinic or online payment via Razorpay/Stripe
- **Appointment History**: Complete booking history with status tracking

### 👨‍⚕️ Doctor Management Panel
- **Interactive Dashboard**: Comprehensive overview with key metrics
- **Appointment Management**: View, accept, and manage all appointments
- **Availability Management**: Set working hours and manage time slots
- **Patient Records**: Access to patient history and prescription management
- **Earnings Dashboard**: Track consultation fees and payment status

### 🏥 Advanced Admin Panel
- **Interactive Dashboard**: Clickable metric cards for quick navigation
- **Analytics & Insights**: Comprehensive statistics and performance metrics
- **Doctor Lifecycle Management**: Add, edit, remove, and manage doctors
- **Appointment Oversight**: Monitor all appointments with filtering options
- **Patient Management**: View patient records and appointment history
- **System Settings**: Configure platform-wide settings and policies

### 🤖 AI-Powered Features
- **Symptom Checker**: AI-driven symptom analysis for preliminary diagnosis
- **Smart Scheduler**: Intelligent appointment recommendations
- **Prescription Management**: Automated prescription generation and tracking
- **Medical History Analysis**: AI-powered insights from patient records

## 📋 Complete Module Overview

### 1. **Frontend Module (Patient Portal)**
- **Home Page**: Hero section, specialty menu, top doctors, promotional banner
- **Authentication Pages**: Login, registration, password reset, email verification
- **Doctor Discovery**: Advanced filtering by specialty, location, and availability
- **Doctor Profiles**: Detailed information, reviews, availability calendar
- **Appointment System**: Smart booking with patient info collection
- **User Dashboard**: Profile management, appointment history, payment records
- **Payment Integration**: Secure processing via Razorpay and Stripe
- **Symptom Checker**: AI-powered preliminary diagnosis tool
- **Smart Scheduler**: Intelligent appointment recommendations

### 2. **Backend Module (API Server)**
- **User Management**: Complete CRUD operations with authentication
- **Doctor Management**: Profile management and availability tracking
- **Appointment Management**: Booking, cancellation, status updates
- **Payment Processing**: Multi-gateway integration with webhooks
- **File Upload System**: Secure image management via Cloudinary
- **Email Services**: Automated notifications and password reset
- **AI Integration**: Symptom analysis and smart scheduling APIs
- **Analytics Engine**: Comprehensive data processing and reporting

### 3. **Admin Module (Management Panel)**
- **Dashboard Analytics**: Real-time metrics and interactive navigation
- **Doctor CRUD Operations**: Complete doctor lifecycle management
- **Appointment Monitoring**: Advanced filtering and status management
- **Patient Oversight**: User management and activity tracking
- **Financial Reports**: Payment tracking and revenue analytics
- **System Configuration**: Settings management and policy controls

### 4. **Doctor Module (Specialist Panel)**
- **Personal Dashboard**: Appointment overview and quick actions
- **Patient Management**: View patient history and manage consultations
- **Schedule Management**: Set availability and manage time slots
- **Prescription System**: Create and manage patient prescriptions
- **Earnings Tracking**: Monitor fees and payment status
- **Profile Management**: Update professional information and credentials

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

## 👥 Detailed User Journeys & Workflows

### 🏥 **Patient User Journey**

#### **1. Account Creation & Authentication**
- **New User Registration**:
  - Visit website and click "Create Account"
  - Enter full name, email, and password
  - Use password visibility toggle to ensure correct entry
  - System validates email format and password strength
  - Receive email verification link
  - Click verification link to activate account

- **Login Process**:
  - Enter email and password on login page
  - Use "Forgot Password?" if password is forgotten
  - System sends reset token to email
  - Enter token and set new password
  - Optional: Enable two-factor authentication for enhanced security

- **OAuth Login** (Future Feature):
  - Click "Login with Google" button
  - Authorize app permissions
  - Automatic account creation/linking

#### **2. Doctor Discovery & Selection**
- **Browse Specialties**:
  - View specialty menu on homepage (Cardiology, Dermatology, etc.)
  - Click specialty to filter doctors
  - View top doctors section with ratings

- **Advanced Search & Filtering**:
  - Use search bar to find doctors by name
  - Filter by location, experience, fees
  - Sort by availability, rating, or fees

- **Doctor Profile Review**:
  - View detailed doctor information
  - Read about qualifications and experience
  - Check availability calendar
  - View patient reviews and ratings

#### **3. Smart Appointment Booking**
- **Initial Booking Attempt**:
  - Click "Book Appointment" on doctor profile
  - System checks if user is logged in
  - If not logged in, redirect to login page

- **Patient Information Collection**:
  - System checks existing user profile for patient details
  - If information missing (name, gender, age), display collection form
  - User fills required patient information
  - Information automatically saves to profile and appointment

- **Slot Selection & Payment**:
  - View available time slots for selected date
  - Choose preferred time slot
  - Select payment method: Cash (pay at clinic) or Online
  - For online payment: Proceed to Razorpay/Stripe checkout
  - For cash payment: Instant booking confirmation

- **Booking Confirmation**:
  - Receive booking confirmation with details
  - Email notification sent with appointment info
  - Option to add appointment to calendar

#### **4. Appointment Management**
- **View My Appointments**:
  - Access "My Appointments" from user dashboard
  - View all upcoming, completed, and cancelled appointments
  - Filter appointments by status or date

- **Appointment Details**:
  - Click on appointment to view full details
  - See doctor information, date/time, payment status
  - Access prescription if available

- **Cancellation & Rescheduling**:
  - Cancel appointments within allowed time window
  - System prevents last-minute cancellations
  - Option to reschedule with available slots

#### **5. Profile & Account Management**
- **Update Personal Information**:
  - Edit name, phone, address, date of birth
  - Upload/change profile picture
  - Update medical information and preferences

- **Payment History**:
  - View all payment transactions
  - Download invoices and receipts
  - Track payment status and refunds

- **Account Security**:
  - Change password with current password verification
  - Enable/disable two-factor authentication
  - View login history and active sessions

### 👨‍⚕️ **Doctor Journey & Workflow**

#### **1. Doctor Onboarding & Setup**
- **Account Creation** (Admin-Managed):
  - Admin creates doctor account with basic information
  - Doctor receives login credentials via email
  - First login requires password change

- **Profile Completion**:
  - Upload professional photo and documents
  - Enter detailed qualifications and experience
  - Set consultation fees and specialties
  - Configure availability schedule

#### **2. Daily Dashboard Operations**
- **Login & Dashboard Overview**:
  - Secure login to doctor panel
  - View key metrics: Today's appointments, earnings, patient count
  - Quick access to recent activities

- **Appointment Management**:
  - View all appointments (pending, confirmed, completed)
  - Accept/reject appointment requests
  - Update appointment status (completed, cancelled, no-show)
  - Add notes and observations

#### **3. Patient Consultation Process**
- **Pre-Consultation Preparation**:
  - Review patient profile and medical history
  - Access previous prescriptions and notes
  - Prepare consultation agenda

- **During Consultation**:
  - Update patient symptoms and diagnosis
  - Create or update prescriptions
  - Order tests if required
  - Set follow-up appointments

- **Post-Consultation Tasks**:
  - Mark appointment as completed
  - Generate prescription PDF
  - Update patient records
  - Send consultation summary to patient

#### **4. Schedule & Availability Management**
- **Working Hours Setup**:
  - Define weekly schedule (Monday-Friday, custom hours)
  - Set consultation duration (15, 30, 45, 60 minutes)
  - Configure break times and lunch hours

- **Dynamic Availability Updates**:
  - Mark days off or emergency leaves
  - Adjust schedule for holidays
  - Handle appointment conflicts automatically

- **Slot Management**:
  - View booked vs available slots
  - Manually block slots for personal reasons
  - Set maximum appointments per day

#### **5. Prescription & Medical Records**
- **Prescription Creation**:
  - Select from medication database
  - Specify dosage, frequency, duration
  - Add special instructions
  - Generate printable prescription

- **Patient History Management**:
  - Maintain comprehensive patient records
  - Track treatment progress
  - Store test results and reports
  - Generate medical reports

#### **6. Earnings & Financial Tracking**
- **Revenue Dashboard**:
  - View daily, weekly, monthly earnings
  - Track payment status (paid, pending, overdue)
  - Monitor consultation statistics

- **Payment Reconciliation**:
  - View detailed transaction history
  - Download financial reports
  - Track outstanding payments

- **Fee Management**:
  - Set consultation fees by specialty
  - Offer discounts for specific cases
  - Manage insurance and corporate rates

### 🏢 **Admin Journey & System Management**

#### **1. Admin Access & Authentication**
- **Secure Login**:
  - Dedicated admin login portal
  - Multi-factor authentication
  - Role-based access control

- **Dashboard Overview**:
  - System-wide statistics and KPIs
  - Real-time alerts and notifications
  - Quick access to critical functions

#### **2. Doctor Lifecycle Management**
- **Doctor Onboarding**:
  - Create doctor profiles with detailed information
  - Upload credentials and certifications
  - Set initial availability and fees
  - Assign specialties and departments

- **Doctor Profile Management**:
  - Edit doctor information and specialties
  - Update fees and availability
  - Manage doctor status (active, inactive, suspended)
  - Handle doctor removal/deactivation

- **Performance Monitoring**:
  - Track doctor appointment volumes
  - Monitor patient satisfaction ratings
  - Review earnings and payment status
  - Generate performance reports

#### **3. Appointment Oversight & Management**
- **Global Appointment View**:
  - View all appointments across platform
  - Filter by doctor, date, status, specialty
  - Search appointments by patient name or ID

- **Appointment Status Management**:
  - Manually update appointment status
  - Handle appointment conflicts
  - Process refunds and cancellations
  - Resolve appointment disputes

- **Analytics & Reporting**:
  - Generate appointment trend reports
  - Track no-show rates and cancellation patterns
  - Monitor peak hours and busy periods
  - Optimize scheduling based on data

#### **4. Patient Management & Support**
- **Patient Database Access**:
  - View complete patient profiles
  - Access medical history and records
  - Monitor patient activity and engagement

- **User Support & Issue Resolution**:
  - Handle patient complaints and issues
  - Process account modifications
  - Manage data privacy requests
  - Coordinate with doctors for urgent cases

#### **5. Financial Management & Analytics**
- **Revenue Tracking**:
  - Monitor total platform revenue
  - Track payment gateway performance
  - Generate financial reports and statements

- **Payment Processing Oversight**:
  - Monitor payment success/failure rates
  - Handle payment disputes and chargebacks
  - Manage refunds and adjustments

#### **6. System Configuration & Maintenance**
- **Platform Settings**:
  - Configure system-wide policies
  - Set appointment booking rules
  - Manage notification templates
  - Update payment gateway settings

- **User Role Management**:
  - Create and manage admin accounts
  - Assign permissions and access levels
  - Monitor admin activity logs
  - Implement security policies

#### **7. Analytics & Business Intelligence**
- **Performance Metrics**:
  - User registration and engagement trends
  - Doctor utilization and satisfaction rates
  - Appointment booking patterns
  - Revenue growth and projections

- **System Health Monitoring**:
  - Server performance and uptime
  - API response times and error rates
  - Database performance metrics
  - Security incident tracking

- **Reporting & Insights**:
  - Generate comprehensive business reports
  - Create custom dashboards for stakeholders
  - Export data for external analysis
  - Predictive analytics for growth planning

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

## 📡 Comprehensive API Endpoints

### 🔐 **User Authentication & Management**
- `POST /api/user/register` - User registration with email verification
- `POST /api/user/login` - User login with JWT token generation
- `GET /api/user/get-profile` - Retrieve authenticated user profile
- `POST /api/user/update-profile` - Update user profile (name, phone, address, dob, gender)
- `POST /api/user/forgot-password` - Initiate password reset via email
- `POST /api/user/reset-password` - Reset password using token
- `POST /api/user/enable-2fa` - Enable two-factor authentication
- `POST /api/user/verify-2fa` - Verify 2FA code
- `POST /api/user/verify-email` - Verify email address

### 📅 **Appointment Management**
- `POST /api/user/book-appointment` - Book new appointment with patient info collection
- `GET /api/user/appointments` - Get user's appointment history
- `POST /api/user/cancel-appointment` - Cancel appointment with validation
- `GET /api/user/doctor-slots/:docId` - Get available time slots for doctor
- `GET /api/user/financial-summary` - Get user's financial summary
- `GET /api/user/prescriptions` - Get user's prescription history

### 💳 **Payment Processing**
- `POST /api/user/payment-razorpay` - Initialize Razorpay payment
- `POST /api/user/verifyRazorpay` - Verify Razorpay payment completion
- `POST /api/user/payment-stripe` - Initialize Stripe payment
- `POST /api/user/verifyStripe` - Verify Stripe payment completion

### 👨‍⚕️ **Doctor Management**
- `POST /api/doctor/login` - Doctor authentication
- `GET /api/doctor/profile` - Get doctor profile and availability
- `POST /api/doctor/update-profile` - Update doctor information
- `GET /api/doctor/appointments` - Get doctor's appointments
- `POST /api/doctor/change-availability` - Update doctor availability

### 🏥 **Admin System Management**
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/add-doctor` - Create new doctor account
- `GET /api/admin/doctors` - Get all doctors with filtering
- `POST /api/admin/change-availability` - Update doctor availability
- `GET /api/admin/appointments` - Get all appointments with advanced filtering
- `POST /api/admin/cancel-appointment` - Admin appointment cancellation
- `POST /api/admin/add-location` - Add new clinic location

### 🤖 **AI & Analytics (Future Integration)**
- `POST /api/ai/symptom-check` - AI-powered symptom analysis
- `GET /api/ai/smart-schedule` - Intelligent appointment recommendations
- `POST /api/ai/medical-analysis` - AI medical history analysis
- `GET /api/analytics/dashboard` - Comprehensive system analytics
- `GET /api/analytics/performance` - Performance metrics and reports

### 📧 **Notification & Communication**
- `POST /api/notification/email` - Send email notifications
- `POST /api/notification/sms` - Send SMS notifications (future)
- `GET /api/notification/history` - Get notification history

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
