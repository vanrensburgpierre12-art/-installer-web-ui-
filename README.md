# 🚗 Vehicle Installation Tracker

A comprehensive web application for tracking vehicle installations, repairs, and maintenance with full audit trails, image management, and multi-level approval workflows. Built for legal compliance and comprehensive job tracking.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Quick Start Guide](#-quick-start-guide)
- [Installation Guide](#-installation-guide)
- [Configuration](#-configuration)
- [User Guide](#-user-guide)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)
- [Support](#-support)

## ✨ Features

### 🔧 Core Functionality
- **Job Management**: Create, track, and manage vehicle installation jobs
- **Vehicle Management**: Track vehicle details with pre/post inspection forms
- **Image Upload**: Upload up to 4 pictures per installation (device serial, tablet serial, connection photos)
- **Audit Trail**: Comprehensive logging of all actions and changes for legal compliance
- **Multi-level Approval**: Manager sign-off and approval workflow
- **User Management**: Role-based access control (Installer, Manager, Admin)
- **Client Management**: Track clients, sites, and vehicles

### 📊 Business Features
- **Legal Compliance**: Full audit trail for legal requirements
- **Digital Signatures**: Manager and technician sign-offs
- **Pre/Post Inspections**: Detailed vehicle inspection forms
- **Travel Tracking**: Record travel details and mileage
- **Task Management**: Break down jobs into manageable tasks
- **Real-time Status**: Live job status updates and notifications

### 🛡️ Security & Compliance
- **Role-based Access**: Granular permissions for different user types
- **Audit Logging**: Every action logged with user, timestamp, and IP
- **Data Integrity**: Comprehensive validation and error handling
- **Secure File Upload**: Image upload with proper validation
- **JWT Authentication**: Secure token-based authentication

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **Multer** for file uploads
- **Comprehensive audit logging**

### Frontend
- **React** with TypeScript
- **Material-UI** components
- **React Router** for navigation
- **Axios** for API calls
- **Responsive design**

### Infrastructure
- **Docker** containerization
- **Docker Compose** for orchestration
- **Nginx** reverse proxy (production)
- **PostgreSQL** in container

## 🚀 Quick Start Guide

### Prerequisites
- Docker and Docker Compose installed
- Git
- 4GB RAM minimum
- 10GB free disk space

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vehicle-installation-tracker
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment variables (optional for quick start)
nano .env
```

### 3. Start the Application

#### Development Mode (Recommended for first-time setup)
```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up --build

# Or run in background
docker-compose -f docker-compose.dev.yml up -d --build
```

#### Production Mode
```bash
# Start all services in production mode
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

### 5. Create Admin User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

## 📖 Installation Guide

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows with Docker

#### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB free space
- **OS**: Linux (Ubuntu 20.04+)

### Docker Installation

#### Ubuntu/Debian
```bash
# Update package index
sudo apt-get update

# Install required packages
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

#### macOS
```bash
# Install using Homebrew
brew install --cask docker

# Or download Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### Windows
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and restart your computer
3. Enable WSL 2 if prompted

### Application Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd vehicle-installation-tracker
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

#### 3. Database Setup
The database will be automatically created and initialized when you start the application for the first time.

#### 4. Start Application
```bash
# Development mode
docker-compose -f docker-compose.dev.yml up --build

# Production mode
docker-compose up --build
```

#### 5. Verify Installation
```bash
# Check if all services are running
docker-compose ps

# Check application health
curl http://localhost:5000/health

# Check database connection
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT version();"
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_NAME=vehicle_tracker
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# Application Configuration
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760

# Optional: SSL Configuration (for production)
# SSL_CERT_PATH=/path/to/cert.pem
# SSL_KEY_PATH=/path/to/key.pem
```

### Security Configuration

#### 1. Change Default Passwords
```bash
# Generate a secure password
openssl rand -base64 32

# Update .env file with secure password
DB_PASSWORD=your_generated_secure_password
```

#### 2. Generate JWT Secret
```bash
# Generate a secure JWT secret
openssl rand -base64 64

# Update .env file
JWT_SECRET=your_generated_jwt_secret
```

#### 3. Configure CORS
```env
# For production, set your domain
CORS_ORIGIN=https://yourdomain.com
```

### Database Configuration

#### Backup Configuration
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U postgres vehicle_tracker > backup_$DATE.sql
echo "Backup created: backup_$DATE.sql"
EOF

chmod +x backup.sh
```

#### Restore from Backup
```bash
# Restore database
docker-compose exec -T db psql -U postgres vehicle_tracker < backup_20231201_120000.sql
```

## 👥 User Guide

### User Roles

#### 🔧 Installer
- View assigned jobs
- Start/complete jobs
- Upload images (up to 4 per job)
- Complete pre/post inspections
- Add and complete tasks
- View job history

#### 👨‍💼 Manager
- All installer permissions
- Create/edit jobs
- Create/edit vehicles and clients
- Approve/reject jobs
- View all jobs and audit logs
- Manage user accounts
- Generate reports

#### 👑 Admin
- All manager permissions
- User management
- System configuration
- Full audit access
- Database management
- System maintenance

### Getting Started

#### 1. Login
- Navigate to http://localhost:3000
- Use the admin credentials created during setup
- Change default password on first login

#### 2. Create Users
1. Go to Users section (Admin only)
2. Click "Add User"
3. Fill in user details
4. Assign appropriate role
5. Save user

#### 3. Add Clients
1. Go to Clients section
2. Click "Add Client"
3. Enter client information
4. Add sites for the client
5. Save client

#### 4. Add Vehicles
1. Go to Vehicles section
2. Click "Add Vehicle"
3. Select client and site
4. Enter vehicle details
5. Save vehicle

#### 5. Create Jobs
1. Go to Jobs section
2. Click "Create Job"
3. Select client, site, and vehicle
4. Assign technician
5. Set job details
6. Save job

### Workflow

#### For Installers
1. **View Assigned Jobs**: Check dashboard for new jobs
2. **Start Job**: Click "Start Job" when ready to begin
3. **Pre-Inspection**: Complete vehicle pre-inspection form
4. **Upload Images**: Take and upload required photos
5. **Add Tasks**: Break down work into tasks
6. **Complete Work**: Finish installation work
7. **Post-Inspection**: Complete vehicle post-inspection
8. **Complete Job**: Mark job as complete for approval

#### For Managers
1. **Review Jobs**: Check jobs requiring approval
2. **Approve/Reject**: Review completed jobs
3. **Sign Off**: Provide digital signature
4. **Monitor Progress**: Track job status and progress
5. **Generate Reports**: Create audit reports

## 📚 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### Register (Admin only)
```http
POST /api/auth/register
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "installer"
}
```

### Job Management

#### Get All Jobs
```http
GET /api/jobs?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Create Job
```http
POST /api/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "clientId": "uuid",
  "siteId": "uuid",
  "vehicleId": "uuid",
  "assignedTechnicianId": "uuid",
  "jobType": "install",
  "workType": "new_installation",
  "productType": "tracking_device",
  "description": "Install tracking device",
  "scheduledDate": "2023-12-01",
  "scheduledTime": "09:00"
}
```

#### Start Job
```http
POST /api/jobs/{jobId}/start
Authorization: Bearer <token>
```

#### Complete Job
```http
POST /api/jobs/{jobId}/complete
Authorization: Bearer <token>
```

### Image Upload

#### Upload Images
```http
POST /api/images/job/{jobId}
Content-Type: multipart/form-data
Authorization: Bearer <token>

images: [file1, file2, file3, file4]
imageType: "device_serial"
```

### Audit Logs

#### Get Audit Logs
```http
GET /api/audit?page=1&limit=50&action=JOB_CREATED
Authorization: Bearer <token>
```

## 🛠️ Development

### Running Locally (without Docker)

#### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database settings
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
npm start
```

#### Database Setup
```bash
# Install PostgreSQL locally
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb vehicle_tracker

# Run schema
psql -U postgres -d vehicle_tracker -f server/database/schema.sql
```

### Development Workflow

#### 1. Code Changes
- Make changes to source code
- Changes are automatically reflected in development mode

#### 2. Database Changes
- Modify `server/database/schema.sql`
- Restart database container: `docker-compose restart db`

#### 3. Testing
```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

#### 4. Building for Production
```bash
# Build frontend
cd client
npm run build

# Build Docker image
docker build -t vehicle-tracker .
```

## 🚀 Production Deployment

### Using Docker Compose

#### 1. Production Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Update .env for production
nano .env
```

#### 2. SSL Configuration (Optional)
```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update nginx.conf with SSL configuration
```

#### 3. Start Production Services
```bash
# Start with Nginx
docker-compose --profile production up -d

# Or start without Nginx
docker-compose up -d
```

#### 4. Configure Reverse Proxy
```bash
# Update nginx.conf with your domain
# Set up SSL certificates
# Configure firewall rules
```

### Monitoring and Maintenance

#### Health Checks
```bash
# Check application health
curl http://localhost:5000/health

# Check database
docker-compose exec db pg_isready -U postgres

# Check all services
docker-compose ps
```

#### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f db
```

#### Backups
```bash
# Database backup
docker-compose exec db pg_dump -U postgres vehicle_tracker > backup_$(date +%Y%m%d).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres -c "SELECT 1;"
```

**Solutions:**
- Verify database credentials in `.env`
- Check if database container is healthy
- Restart database: `docker-compose restart db`

#### 2. File Upload Issues
```bash
# Check upload directory permissions
docker-compose exec api ls -la uploads/

# Check disk space
docker-compose exec api df -h
```

**Solutions:**
- Check `MAX_FILE_SIZE` setting
- Verify upload directory permissions
- Ensure sufficient disk space

#### 3. Authentication Issues
```bash
# Check JWT secret
echo $JWT_SECRET

# Check token expiration
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/profile
```

**Solutions:**
- Verify `JWT_SECRET` is set
- Check token expiration settings
- Clear browser storage

#### 4. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
netstat -tulpn | grep :5432
```

**Solutions:**
- Change ports in `docker-compose.yml`
- Stop conflicting services
- Use different ports in `.env`

### Performance Issues

#### 1. Slow Database Queries
```bash
# Check database performance
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT * FROM pg_stat_activity;"
```

**Solutions:**
- Add database indexes
- Optimize queries
- Increase database resources

#### 2. High Memory Usage
```bash
# Check memory usage
docker stats
```

**Solutions:**
- Increase container memory limits
- Optimize application code
- Add more system RAM

### Log Analysis

#### Application Logs
```bash
# View recent logs
docker-compose logs --tail=100 api

# Follow logs in real-time
docker-compose logs -f api
```

#### Database Logs
```bash
# View database logs
docker-compose logs --tail=100 db

# Check slow queries
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Recovery Procedures

#### 1. Database Recovery
```bash
# Stop application
docker-compose down

# Restore from backup
docker-compose exec db psql -U postgres vehicle_tracker < backup.sql

# Restart application
docker-compose up -d
```

#### 2. File Recovery
```bash
# Restore uploaded files
tar -xzf uploads_backup.tar.gz

# Restart application
docker-compose restart api
```

## 📞 Support

### Getting Help

#### Documentation
- Check this README for common issues
- Review API documentation
- Check Docker logs for errors

#### Community Support
- Create an issue on GitHub
- Check existing issues for solutions
- Contact the development team

#### Professional Support
- For enterprise deployments
- Custom feature development
- Training and consultation

### Reporting Issues

When reporting issues, please include:
1. **Environment**: OS, Docker version, Node.js version
2. **Steps to Reproduce**: Detailed steps to recreate the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Logs**: Relevant error logs and screenshots
6. **Configuration**: Your `.env` file (remove sensitive data)

### Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, Node.js, and PostgreSQL
- Containerized with Docker
- UI components from Material-UI
- Icons from Material Icons

---

**Vehicle Installation Tracker** - Comprehensive job tracking with legal audit trails for vehicle installations, repairs, and maintenance.