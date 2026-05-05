# IBIT Timetable Automation System

A comprehensive role-based timetable management system for IBIT (Institute of Business and Information Technology) with dynamic API integration and real-time updates.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python 3.x (for local development server)
- Git (for version control)

### Installation & Setup

1. **Clone the Repository**
```bash
git clone https://github.com/asyedfatim-create/Timetable-Explicitly-Kre8tive-Frontend.git
cd Timetable-Explicitly-Kre8tive-Frontend
```

2. **Install Dependencies** (if using Node.js server)
```bash
npm install
```

3. **Start the Frontend Server**

#### Option A: Python HTTP Server (Recommended for Development)
```bash
python -m http.server 8080
```

#### Option B: Node.js Server (if package.json exists)
```bash
npm start
# or
node server.js
```

4. **Access the Application**
Open your browser and navigate to:
```
http://localhost:8080
```

## 🎯 System Features

### Role-Based Access
- **Admin Portal** - Full system management and analytics
- **Teacher Portal** - Schedule management and request submission
- **Student Portal** - Timetable viewing and assignment tracking

### Key Features
- ✅ **Dynamic API Integration** - No hardcoded data
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Loading States** - Visual feedback during operations
- ✅ **Error Handling** - Graceful degradation to mock data
- ✅ **Responsive Design** - Works on all devices
- ✅ **Role-Based Navigation** - Appropriate features per user type

## 📱 Login Credentials (Development)

### Admin Access
- **Email**: `admin@ibit.edu.pk`
- **Password**: `admin123`

### Teacher Access
- **Email**: `teacher@ibit.edu.pk`
- **Password**: `teacher123`

### Student Access
- **Email**: `student@ibit.edu.pk`
- **Password**: `student123`

## 🔧 Development Workflow

### 1. Making Changes
```bash
# Make your changes to files
git add .
git commit -m "Describe your changes"
```

### 2. Running Locally
```bash
# Start the development server
python -m http.server 8080

# The system will be available at http://localhost:8080
```

### 3. Testing Your Changes
1. Open browser to `http://localhost:8080`
2. Test different roles and features
3. Verify API integration works correctly
4. Check error handling and loading states

### 4. Pushing Changes
```bash
# Push to remote repository
git push origin main
```

## 📊 Project Structure

```
Timetable-Explicitly-Kre8tive-Frontend/
├── 📄 HTML Files
│   ├── login.html              # Enhanced login system
│   ├── admin.html              # Admin portal
│   ├── teacher.html            # Teacher portal
│   └── student.html            # Student portal
├── 📁 JavaScript Files
│   ├── js/
│   │   ├── api.js              # Base API client
│   │   ├── api-integration.js   # API service layer
│   │   ├── admin-init.js       # Admin functionality
│   │   ├── teacher-init.js     # Teacher functionality
│   │   ├── student-init.js     # Student functionality
│   │   └── [other modules]    # Supporting modules
├── 🎨 CSS Files
│   └── css/
│       └── styles.css          # Main stylesheet
└── 📚 Documentation
    ├── README.md               # This file
    ├── API-INTEGRATION-SUMMARY.md
    └── README-IMPROVEMENTS.md
```

## 🔌 API Integration

### Backend Requirements
The system is designed to work with a RESTful API backend. Expected endpoints:

```javascript
// Authentication
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

// Admin Endpoints
GET  /api/v1/admin/stats
GET  /api/v1/admin/requests
POST /api/v1/admin/requests/{id}/approve
POST /api/v1/admin/requests/{id}/reject

// Teacher Endpoints
GET  /api/v1/teacher/profile
GET  /api/v1/teacher/schedule
GET  /api/v1/teacher/requests
POST /api/v1/teacher/requests

// Student Endpoints
GET  /api/v1/student/profile
GET  /api/v1/student/timetable
GET  /api/v1/student/assignments
GET  /api/v1/student/exams
```

### Development Mode
When the backend API is not available, the system automatically falls back to mock data for development and testing.

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port is in use
netstat -an | grep :8080

# Kill existing process if needed
# On Windows
taskkill /PID <process_id>
# On Mac/Linux
kill -9 <process_id>
```

#### API Connection Issues
- Check if backend server is running on expected port
- Verify API base URL in `js/api.js`
- Check browser console for error messages
- System falls back to mock data if API unavailable

#### Styling Issues
- Clear browser cache
- Check CSS file paths
- Verify responsive design on different screen sizes

### Getting Help
1. **Check Browser Console** for JavaScript errors
2. **Review Network Tab** for failed API calls
3. **Verify File Paths** in HTML script tags
4. **Check Git Status** for uncommitted changes

## 🚀 Deployment

### Production Deployment

#### 1. Static Hosting (GitHub Pages, Netlify, Vercel)
```bash
# Build for production (if needed)
npm run build

# Deploy to static hosting
# The system works out-of-the-box with static file hosting
```

#### 2. Server Deployment
```bash
# Deploy to your preferred hosting platform
# Ensure API endpoints are accessible
# Update API_BASE_URL in js/api.js if needed
```

### Environment Variables
For production deployment, configure:
```javascript
// In js/api.js
const API_BASE_URL = 'https://your-backend-api.com/api/v1';
```

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Android Chrome)

## 🔒 Security Features

- ✅ **Session Management** - Secure token-based authentication
- ✅ **Role-Based Access** - Users only see appropriate features
- ✅ **Input Validation** - Form validation and sanitization
- ✅ **Error Handling** - No sensitive data exposed in errors

## 📈 Performance

- ✅ **Lazy Loading** - Data loaded on demand
- ✅ **Caching Strategy** - Efficient data management
- ✅ **Optimized Assets** - Minified CSS and JavaScript
- ✅ **Responsive Images** - Optimized for all devices

## 🤝 Contributing

### Development Guidelines
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature-name`
3. **Make changes** following existing patterns
4. **Test thoroughly** across all roles
5. **Commit changes**: `git commit -m "Description"`
6. **Push branch**: `git push origin feature-name`
7. **Create Pull Request**

### Code Standards
- **JavaScript**: ES6+ with async/await
- **CSS**: Modern CSS with custom properties
- **HTML**: Semantic HTML5 structure
- **Comments**: Clear documentation for complex logic

## 📞 Support

### Getting Help
- **Documentation**: Check `API-INTEGRATION-SUMMARY.md` for technical details
- **Issues**: Report bugs via GitHub Issues
- **Features**: Request features via GitHub Discussions

## 📄 License

This project is part of the IBIT Timetable Automation System developed by Explicitly Kre8tive.

---

## 🎯 Quick Commands Reference

```bash
# Start development server
python -m http.server 8080

# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to remote
git push origin main

# View recent commits
git log --oneline -5
```

**🚀 Ready to Go!**

Start the system with `python -m http.server 8080` and open `http://localhost:8080` in your browser to begin using the IBIT Timetable Automation System.
