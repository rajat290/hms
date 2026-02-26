# Mediflow - Advanced Hospital Management System

A comprehensive full-stack web application for managing hospital operations, appointments, and patient-doctor interactions. Built with the MERN stack (MongoDB, Express.js, React, Node.js), this system provides a seamless experience for patients, doctors, staff, and administrators with advanced features including AI-powered diagnostics, smart scheduling, comprehensive billing, and detailed analytics.

## 🚀 Latest Features & Updates

### 🔐 Enhanced Authentication System
- **Password Visibility Toggle**: Eye button to show/hide password during login
- **Forgot Password**: Complete password reset flow with email verification
- **Secure Registration**: Email verification and strong password requirements
- **Two-Factor Authentication Support**: Optional 2FA infrastructure for enhanced security
- **Role-based Authentication**: Separate authentication flows for Patients, Doctors, Staff, and Admins

### 📅 Smart Appointment Booking System
- **Patient Information Collection**: Automatic collection of patient details (name, gender, age) during booking
- **Profile Validation**: System checks existing user profiles and collects missing information
- **Real-time Availability**: Dynamic slot generation based on doctor schedules
- **Multiple Payment Options**: Cash payment at clinic or online payment via Razorpay/Stripe
- **Appointment History**: Complete booking history with status tracking
- **Check-in System**: Patient check-in functionality for queue management
- **Automated Reminders**: Email reminders sent 24 hours and 2 hours before appointments

### 👨‍⚕️ Doctor Management Panel
- **Interactive Dashboard**: Comprehensive overview with key metrics
- **Appointment Management**: View, accept, complete, and cancel appointments
- **Availability Management**: Set working hours and manage time slots
- **Patient Records**: Access to patient history and prescription management
- **Prescription System**: Generate and manage digital prescriptions
- **Earnings Dashboard**: Track consultation fees and payment status
- **Reviews Management**: View patient reviews and ratings

### 🏥 Advanced Admin Panel
- **Interactive Dashboard**: Clickable metric cards for quick navigation
- **Analytics & Insights**: Comprehensive statistics and performance metrics
- **Doctor Lifecycle Management**: Add, edit, remove, and manage doctors
- **Staff Management**: Complete staff panel with CRUD operations
- **Patient Management**: View patient records and appointment history
- **Billing & Payments**: Invoice generation, payment tracking, refunds
- **Audit Logs**: Track all admin actions for security
- **System Settings**: Configure platform-wide settings and policies

### 👥 Staff Panel (Reception/Front Desk)
- **Patient Registration**: Register new patients with complete details
- **Patient Check-in**: Mark patient arrivals for queue management
- **Appointment Management**: View and manage daily appointments
- **Payment Collection**: Record and manage payment transactions
- **Billing System**: Handle itemized billing and partial payments
- **Notifications**: Real-time notifications for appointments and payments

### 🤖 AI-Powered Features
- **Conversational AI Assistant**: Gemini-powered chat bot for medical queries
- **Symptom Checker**: AI-driven symptom analysis for preliminary diagnosis
- **Smart Scheduler**: Intelligent appointment recommendations
- **Prescription Management**: Automated prescription generation and tracking
- **Medical History Analysis**: AI-powered insights from patient records

### 💰 Advanced Billing & Payments
- **Invoice Generation**: Automatic invoice creation with unique invoice numbers
- **PDF Downloads**: Download professional invoice PDFs
- **Partial Payments**: Support for installment-based payments
- **Multiple Payment Methods**: Cash, Card, Online (Razorpay/Stripe)
- **Payment Tracking**: Complete payment history and logs
- **Refund Processing**: Process refunds for cancelled appointments
- **Financial Reports**: CSV export of financial data

## 📋 Complete Module Overview

### 1. **Frontend Module (Patient Portal)**
- **Home Page**: Hero section, specialty menu, top doctors, promotional banner
- **Authentication Pages**: Login, registration, password reset, email verification
- **Doctor Discovery**: Advanced filtering by specialty, location, gender, and availability
- **Doctor Profiles**: Detailed information, reviews, availability calendar
- **Appointment System**: Smart booking with patient info collection
- **User Dashboard**: Profile management, appointment history, payment records
- **Payment Integration**: Secure processing via Razorpay and Stripe
- **My Appointments**: View and manage booked appointments
- **My Billing**: View payment history and invoices
- **Notifications**: Personalized notification center
- **AI Chat Widget**: Conversational AI assistant on every page
- **Symptom Checker**: AI-powered preliminary diagnosis tool
- **Smart Scheduler**: Intelligent appointment recommendations

### 2. **Backend Module (API Server)**
- **User Management**: Complete CRUD operations with authentication
- **Doctor Management**: Profile management, availability, and schedule tracking
- **Appointment Management**: Booking, cancellation, status updates, check-in
- **Payment Processing**: Multi-gateway integration with webhooks
- **Staff Management**: Authentication, patient registration, queue management
- **File Upload System**: Secure image management via Cloudinary
- **Email Services**: Automated notifications and password reset
- **AI Integration**: Gemini API for symptom analysis and chat
- **Invoice Management**: Generation, tracking, PDF generation
- **Notification System**: Automated reminders and real-time notifications
- **Audit Logging**: Track all admin and staff actions
- **Analytics Engine**: Comprehensive data processing and reporting

### 3. **Admin Module (Management Panel)**
- **Dashboard Analytics**: Real-time metrics and interactive navigation
- **Doctor CRUD Operations**: Complete doctor lifecycle management
- **Staff Management**: Add, edit, and manage staff accounts
- **Appointment Monitoring**: Advanced filtering and status management
- **Patient Oversight**: User management and activity tracking
- **Financial Reports**: Revenue analytics, payment tracking
- **Billing Management**: Invoice generation, payment processing, refunds
- **Audit Logs**: View all administrative actions
- **Analytics Hub**: Advanced analytics with date range filtering
- **Billing Analytics**: Detailed financial metrics and trends

### 4. **Doctor Module (Specialist Panel)**
- **Personal Dashboard**: Appointment overview and quick actions
- **Patient Management**: View patient history and manage consultations
- **Schedule Management**: Set availability and manage time slots
- **Prescription System**: Create and manage patient prescriptions
- **Earnings Tracking**: Monitor fees and payment status
- **Profile Management**: Update professional information and credentials
- **Reviews**: View patient reviews and ratings

### 5. **Staff Module (Front Desk Panel)**
- **Patient Registration**: Register new patients with full details
- **Daily Dashboard**: Overview of today's appointments and collections
- **Queue Management**: Patient check-in and queue tracking
- **Appointment Management**: View all appointments by date
- **Payment Collection**: Record payments and handle billing
- **Patient Records**: View and manage patient information

## 🛠️ Tech Stack

### Frontend
- **React**: Component-based UI development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **React Toastify**: Notification system
- **jsPDF**: PDF generation for invoices

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
- **Nodemailer**: Email services
- **PDFKit**: PDF generation
- **TensorFlow.js**: AI/ML capabilities

### Testing
- **Vitest**: Unit testing framework
- **React Testing Library**: Component testing

## 📁 Project Structure

```
MediFlow-HMS/
├── frontend/          # Patient-facing React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── AIChatWidget.jsx       # AI conversational assistant
│   │   │   ├── SmartScheduler.jsx     # Smart appointment scheduler
│   │   │   ├── SymptomChecker.jsx     # AI symptom analyzer
│   │   │   └── ...
│   │   ├── pages/         # Application pages
│   │   ├── context/       # React context for state management
│   │   └── assets/        # Images and static files
│   └── package.json
├── backend/           # Express.js API server
│   ├── config/        # Database and cloud configurations
│   ├── controllers/   # Route handlers
│   │   ├── adminController.js    # Admin operations
│   │   ├── doctorController.js   # Doctor operations
│   │   ├── staffController.js    # Staff operations
│   │   ├── userController.js     # User operations
│   │   ├── aiController.js       # AI features
│   │   ├── notificationController.js  # Notifications
│   │   └── prescriptionController.js  # Prescriptions
│   ├── middleware/    # Authentication and file upload middleware
│   ├── models/        # MongoDB schemas
│   │   ├── userModel.js, doctorModel.js, staffModel.js
│   │   ├── appointmentModel.js, prescriptionModel.js
│   │   ├── invoiceModel.js, paymentLogModel.js
│   │   ├── notificationModel.js, auditLogModel.js
│   │   └── ...
│   ├── routes/        # API endpoints
│   │   ├── adminRoute.js, doctorRoute.js, staffRoute.js
│   │   ├── userRoute.js, aiRoute.js, paymentRoute.js
│   ├── jobs/          # Cron jobs for automated tasks
│   └── server.js      # Main server file
├── admin/             # Admin management panel (React)
│   ├── src/
│   │   ├── components/    # Admin UI components
│   │   ├── pages/         # Admin dashboard pages
│   │   │   ├── Admin/        # Admin-specific pages
│   │   │   ├── Doctor/       # Doctor management pages
│   │   │   └── Staff/        # Staff management pages
│   │   ├── context/       # Admin context
│   │   └── assets/        # Admin assets
│   └── package.json
└── README.md
```

## 👥 Detailed User Journeys & Workflows

### 🏥 **Patient User Journey**

#### **1. Account Creation & Authentication**
- **New User Registration**:
  - Visit website and click "Create Account"
  - Enter full name, email, and password
  - Use password visibility toggle to ensure correct entry
  - System validates email format and password strength
  - Receive email - Click verification link verification link
  to activate account

- **Login Process**:
  - Enter email and password on login page
  - Use "Forgot Password?" if password is forgotten
  - System sends reset token to email
  - Enter token and set new password

#### **2. Doctor Discovery & Selection**
- **Browse Specialties**: View specialty menu on homepage
- **Advanced Search & Filtering**: Filter by specialty, gender, fees, availability
- **Doctor Profile Review**: View detailed info, ratings, availability calendar

#### **3. Smart Appointment Booking**
- **Booking Flow**: Select doctor, choose date/time, provide patient info
- **Payment**: Cash at clinic or online via Razorpay/Stripe
- **Confirmation**: Receive booking confirmation with details

#### **4. Appointment Management**
- **View My Appointments**: Access from dashboard
- **Appointment Details**: View full details and prescriptions
- **Cancellation**: Cancel within allowed time window

#### **5. Profile & Account Management**
- **Update Personal Information**: Edit name, phone, address, DOB
- **Payment History**: View transactions and download invoices

### 👨‍⚕️ **Doctor Journey & Workflow**

#### **1. Doctor Onboarding**
- **Account Setup** (Admin-Managed): Admin creates doctor account
- **Profile Completion**: Upload photo, set fees, configure availability

#### **2. Daily Dashboard Operations**
- **Login & Overview**: View today's appointments, earnings, patient count
- **Appointment Management**: Accept, complete, or cancel appointments

#### **3. Patient Consultation**
- **Pre-Consultation**: Review patient history and previous prescriptions
- **During Consultation**: Update symptoms, create prescriptions
- **Post-Consultation**: Generate prescription, mark appointment complete

#### **4. Schedule & Availability**
- **Working Hours**: Define weekly schedule and consultation duration
- **Dynamic Updates**: Mark days off or adjust schedule

#### **5. Prescription System**
- **Create Prescriptions**: Add medicines with dosage and instructions
- **View History**: Access patient prescription history

### 🏢 **Staff Journey & Workflow**

#### **1. Patient Registration**
- **Register New Patient**: Enter complete patient details
- **Upload Documents**: Profile photo, ID proof (Aadhaar)
- **Insurance Details**: Record insurance provider and ID

#### **2. Daily Operations**
- **Dashboard Overview**: Today's appointments and expected collections
- **Patient Check-in**: Mark patients as arrived
- **Queue Management**: Track patient queue

#### **3. Payment Collection**
- **Record Payments**: Handle cash, card, or online payments
- **Partial Payments**: Support installment-based payments
- **Generate Invoices**: Create and provide invoices to patients

#### **4. Appointment Management**
- **View Appointments**: See all appointments for any date
- **Cancel Appointments**: Handle cancellation requests

### 🏢 **Admin Journey & System Management**

#### **1. Dashboard & Analytics**
- **Real-time Metrics**: View appointments, revenue, patient counts
- **Advanced Analytics**: Filter by date range, view trends
- **Billing Analytics**: Revenue trends, payment success rates

#### **2. Doctor Management**
- **Add Doctor**: Create doctor profiles with credentials
- **Manage Doctors**: Edit info, update availability, deactivate
- **Performance Tracking**: Monitor doctor appointments and ratings

#### **3. Staff Management**
- **Add Staff**: Create staff accounts for front desk
- **Manage Staff**: Edit details, reset passwords

#### **4. Patient Management**
- **View Patients**: Access complete patient database
- **Patient Details**: View medical history and appointments

#### **5. Billing & Financials**
- **Generate Invoices**: Create invoices for appointments
- **Process Payments**: Record and track payments
- **Handle Refunds**: Process refund requests
- **Export Reports**: Download financial data as CSV

#### **6. Audit & Security**
- **View Audit Logs**: Track all admin actions
- **System Settings**: Configure platform policies

## 📡 Comprehensive API Endpoints

### 🔐 **User Authentication & Management**
- `POST /api/user/register` - User registration with email verification
- `POST /api/user/login` - User login with JWT token generation
- `GET /api/user/get-profile` - Retrieve authenticated user profile
- `POST /api/user/update-profile` - Update user profile
- `POST /api/user/forgot-password` - Initiate password reset via email
- `POST /api/user/reset-password` - Reset password using token
- `POST /api/user/verify-email` - Verify email address

### 📅 **Appointment Management**
- `POST /api/user/book-appointment` - Book new appointment
- `GET /api/user/appointments` - Get user's appointment history
- `POST /api/user/cancel-appointment` - Cancel appointment
- `GET /api/user/doctor-slots/:docId` - Get available time slots

### 👨‍⚕️ **Doctor Management**
- `POST /api/doctor/login` - Doctor authentication
- `GET /api/doctor/profile` - Get doctor profile
- `POST /api/doctor/update-profile` - Update doctor info
- `GET /api/doctor/appointments` - Get doctor's appointments
- `POST /api/doctor/change-availability` - Update availability
- `POST /api/doctor/generate-prescription` - Generate prescription
- `GET /api/doctor/reviews/:docId` - Get doctor reviews
- `POST /api/doctor/add-review` - Add review for doctor

### 👥 **Staff Management**
- `POST /api/staff/login` - Staff authentication
- `GET /api/staff/profile` - Get staff profile
- `POST /api/staff/create-patient` - Register new patient
- `GET /api/staff/all-patients` - Get all patients
- `POST /api/staff/mark-checkin` - Mark patient check-in
- `POST /api/staff/update-payment` - Update payment status
- `GET /api/staff/notifications` - Get notifications

### 🏥 **Admin System Management**
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/add-doctor` - Create new doctor
- `GET /api/admin/doctors` - Get all doctors
- `POST /api/admin/add-staff` - Create new staff
- `GET /api/admin/all-staff` - Get all staff
- `GET /api/admin/appointments` - Get all appointments
- `POST /api/admin/cancel-appointment` - Cancel appointment
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/advanced-analytics` - Advanced analytics
- `POST /api/admin/create-patient` - Create patient from admin
- `GET /api/admin/patients` - Get all patients
- `POST /api/admin/generate-invoice` - Generate invoice
- `GET /api/admin/invoices` - Get all invoices
- `POST /api/admin/process-refund` - Process refund
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/billing-metrics` - Billing analytics
- `GET /api/admin/export-financials` - Export CSV

### 🤖 **AI & Analytics**
- `POST /api/ai/chat` - Conversational AI assistant
- `POST /api/ai/symptom-check` - AI symptom analysis
- `GET /api/ai/smart-schedule` - Smart scheduling

### 📧 **Notifications**
- `GET /api/notification/reminders` - Automated reminders (cron job)
- Internal notification creation for various events

## 🔐 Authentication & Security

- **JWT Tokens**: Secure authentication for all user types
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation using validator library
- **CORS**: Cross-origin resource sharing configuration
- **File Upload Security**: Multer with file type restrictions
- **Role-based Access Control**: Separate auth middleware for each role

## 💳 Payment Integration

- **Razorpay**: Indian payment gateway integration
- **Stripe**: International payment processing
- **Cash Payments**: Support for offline payments
- **Partial Payments**: Installment-based payment system
- **Secure Transactions**: PCI-compliant payment handling

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Cross-Browser**: Compatible with all modern browsers
- **Accessibility**: WCAG compliant design principles
- **Performance**: Optimized loading times and smooth interactions

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Cloudinary account for image uploads
- Razorpay/Stripe accounts for payments
- Gemini API key for AI features

### Backend Setup
1. Navigate to the backend directory:
   
```
bash
   cd MediFlow-HMS/backend
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Create a `.env` file with the following variables:
   
```
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ADMIN_EMAIL=admin@mediflow.com
   ADMIN_PASSWORD=your_admin_password
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   
```

4. Start the server:
   
```
bash
   npm start
   
```

### Frontend Setup
1. Navigate to the frontend directory:
   
```
bash
   cd MediFlow-HMS/frontend
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Start the development server:
   
```
bash
   npm run dev
   
```

### Admin Panel Setup
1. Navigate to the admin directory:
   
```bash
   cd MediFlow-HMS/admin
   
```

2. Install dependencies:
   
```
bash
   npm install
   
```

3. Start the development server:
   
```
bash
   npm run dev
   
```

## 🧪 Testing

The project includes comprehensive test suites:

### Frontend Testing
```
bash
cd frontend
npm run test        # Run unit tests
npm run test:ui     # Run tests with UI
```

### Backend Testing
```
bash
cd backend
npm test           # Run backend tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, email support@mediflow.com or join our Slack channel.

---

**Built with ❤️ using MERN Stack for better healthcare management**
