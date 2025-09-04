# Vehicle Installation Tracker

A comprehensive web application for tracking vehicle installations, repairs, and maintenance with full audit trails, image management, and multi-level approval workflows.

## Features

- **Job Management**: Create, track, and manage vehicle installation jobs
- **Vehicle Management**: Track vehicle details and pre/post inspection forms
- **Image Upload**: Upload up to 4 pictures per installation
- **Audit Trail**: Comprehensive logging of all actions and changes
- **Multi-level Approval**: Manager sign-off and approval workflow
- **User Management**: Role-based access control (Installer, Manager, Admin)
- **Client Management**: Track clients, sites, and vehicles
- **Real-time Updates**: Live job status updates and notifications

## Technology Stack

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Multer for file uploads
- Comprehensive audit logging

### Frontend
- React with TypeScript
- Material-UI components
- React Router for navigation
- Axios for API calls
- Responsive design

### Infrastructure
- Docker containerization
- Docker Compose for orchestration
- Nginx reverse proxy (production)
- PostgreSQL in container

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vehicle-installation-tracker
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment variables
nano .env
```

### 3. Start the Application

#### Development Mode
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

## Environment Variables

Create a `.env` file in the root directory with the following variables:

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
```

## Default Login

After starting the application, you'll need to create an admin user. You can do this by:

1. Using the API directly:
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

2. Or modify the database initialization script to include a default admin user.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `POST /api/jobs/:id/start` - Start job
- `POST /api/jobs/:id/complete` - Complete job

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `POST /api/vehicles/:id/pre-inspection` - Pre-inspection
- `POST /api/vehicles/:id/post-inspection` - Post-inspection

### Images
- `POST /api/images/job/:jobId` - Upload job images
- `GET /api/images/job/:jobId` - Get job images
- `DELETE /api/images/:imageId` - Delete image

### Audit Logs
- `GET /api/audit` - Get all audit logs
- `GET /api/audit/job/:jobId` - Get job audit logs
- `GET /api/audit/stats` - Get audit statistics

## User Roles

### Installer
- View assigned jobs
- Start/complete jobs
- Upload images
- Complete inspections
- Add tasks

### Manager
- All installer permissions
- Create/edit jobs
- Create/edit vehicles and clients
- Approve/reject jobs
- View all jobs and audit logs

### Admin
- All manager permissions
- User management
- System configuration
- Full audit access

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and roles
- `clients` - Client companies
- `sites` - Client sites/locations
- `vehicles` - Vehicle information
- `jobs` - Installation jobs
- `vehicle_pre_inspections` - Pre-installation inspections
- `vehicle_post_inspections` - Post-installation inspections
- `job_images` - Uploaded images
- `job_tasks` - Job tasks and progress
- `job_sign_offs` - Digital sign-offs
- `audit_logs` - Comprehensive audit trail

## Development

### Running Locally (without Docker)

1. **Backend Setup**:
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database settings
npm run dev
```

2. **Frontend Setup**:
```bash
cd client
npm install
npm start
```

3. **Database Setup**:
```bash
# Install PostgreSQL locally
# Create database and run schema.sql
psql -U postgres -d vehicle_tracker -f database/schema.sql
```

### Database Migrations

The database schema is automatically created when the PostgreSQL container starts using the `schema.sql` file.

## Production Deployment

### Using Docker Compose

1. Set up your production environment variables
2. Use the production docker-compose.yml
3. Consider using a reverse proxy like Nginx (included)
4. Set up SSL certificates for HTTPS
5. Configure proper backup strategies for PostgreSQL

### Security Considerations

- Change default passwords
- Use strong JWT secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Set up database backups
- Monitor audit logs regularly

## Monitoring and Maintenance

- Check application health: `GET /health`
- Monitor audit logs for suspicious activity
- Regular database backups
- Monitor disk space for uploaded images
- Review and rotate JWT secrets periodically

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check if PostgreSQL container is running
   - Verify database credentials in .env
   - Check network connectivity between containers

2. **File Upload Issues**:
   - Check upload directory permissions
   - Verify MAX_FILE_SIZE setting
   - Check available disk space

3. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Clear browser storage if needed

### Logs

View container logs:
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs db
docker-compose logs frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.