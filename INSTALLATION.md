# 📖 Installation Guide

This guide provides detailed step-by-step instructions for installing and setting up the Vehicle Installation Tracker application.

## 📋 Table of Contents

- [System Requirements](#-system-requirements)
- [Docker Installation](#-docker-installation)
- [Application Installation](#-application-installation)
- [Configuration](#-configuration)
- [Verification](#-verification)
- [Troubleshooting](#-troubleshooting)
- [Next Steps](#-next-steps)

## 🖥️ System Requirements

### Minimum Requirements
- **CPU**: 2 cores (2.0 GHz)
- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows with Docker support
- **Network**: Internet connection for initial setup

### Recommended Requirements
- **CPU**: 4 cores (2.5 GHz or higher)
- **RAM**: 8GB
- **Storage**: 20GB free space (SSD recommended)
- **OS**: Linux (Ubuntu 20.04 LTS or newer)
- **Network**: Stable internet connection

### Supported Operating Systems
- **Linux**: Ubuntu 20.04+, CentOS 8+, Debian 11+
- **macOS**: 10.15+ (Catalina or newer)
- **Windows**: Windows 10/11 with WSL 2

## 🐳 Docker Installation

### Linux (Ubuntu/Debian)

#### Step 1: Update System Packages
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### Step 2: Install Required Packages
```bash
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common
```

#### Step 3: Add Docker's Official GPG Key
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

#### Step 4: Add Docker Repository
```bash
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### Step 5: Install Docker
```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

#### Step 6: Add User to Docker Group
```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 7: Verify Installation
```bash
docker --version
docker compose version
```

### Linux (CentOS/RHEL)

#### Step 1: Install Required Packages
```bash
sudo yum install -y yum-utils
```

#### Step 2: Add Docker Repository
```bash
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

#### Step 3: Install Docker
```bash
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

#### Step 4: Start and Enable Docker
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

#### Step 5: Add User to Docker Group
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### macOS

#### Option 1: Using Homebrew (Recommended)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app
```

#### Option 2: Direct Download
1. Visit https://www.docker.com/products/docker-desktop
2. Download Docker Desktop for Mac
3. Install the .dmg file
4. Launch Docker Desktop from Applications

### Windows

#### Prerequisites
- Windows 10 version 2004 and higher (Build 19041 and higher) or Windows 11
- WSL 2 feature enabled
- Virtualization enabled in BIOS

#### Installation Steps
1. **Enable WSL 2**:
   ```powershell
   # Run as Administrator
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

2. **Download and Install Docker Desktop**:
   - Visit https://www.docker.com/products/docker-desktop
   - Download Docker Desktop for Windows
   - Run the installer
   - Restart your computer when prompted

3. **Configure Docker Desktop**:
   - Launch Docker Desktop
   - Enable WSL 2 integration
   - Configure resources (recommended: 4GB RAM, 2 CPUs)

## 📦 Application Installation

### Step 1: Clone Repository
```bash
# Clone the repository
git clone <repository-url>
cd vehicle-installation-tracker

# Verify files
ls -la
```

### Step 2: Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional for quick start)
nano .env
```

### Step 3: Choose Installation Mode

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

### Step 4: Wait for Services to Start
```bash
# Monitor startup process
docker-compose logs -f

# Check service status
docker-compose ps
```

## ⚙️ Configuration

### Environment Variables

The application uses environment variables for configuration. Edit the `.env` file:

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

### Security Configuration

#### Generate Secure Passwords
```bash
# Generate database password
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

#### Update .env File
```bash
# Edit environment file
nano .env

# Update with generated values
DB_PASSWORD=your_generated_database_password
JWT_SECRET=your_generated_jwt_secret
```

### Database Configuration

The database is automatically configured during first startup. The schema is created from `server/database/schema.sql`.

#### Manual Database Setup (if needed)
```bash
# Connect to database
docker-compose exec db psql -U postgres

# Create database (if not exists)
CREATE DATABASE vehicle_tracker;

# Exit psql
\q
```

## ✅ Verification

### Step 1: Check Service Status
```bash
# Check all services are running
docker-compose ps

# Expected output should show all services as "Up"
```

### Step 2: Test Application Health
```bash
# Test backend health
curl http://localhost:5000/health

# Expected response:
# {"status":"OK","timestamp":"2023-12-01T12:00:00.000Z","environment":"production"}
```

### Step 3: Test Database Connection
```bash
# Test database connection
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT version();"

# Expected output should show PostgreSQL version
```

### Step 4: Access Web Interface
1. Open web browser
2. Navigate to http://localhost:3000
3. You should see the login page

### Step 5: Create Admin User
```bash
# Create admin user
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

# Expected response:
# {"message":"User created successfully","user":{...}}
```

### Step 6: Test Login
1. Go to http://localhost:3000
2. Login with credentials:
   - Username: `admin`
   - Password: `admin123`
3. You should be redirected to the dashboard

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Docker Not Found
```bash
# Error: docker: command not found
# Solution: Docker not installed or not in PATH
```

**Solution:**
```bash
# Reinstall Docker following the installation steps above
# Or add Docker to PATH
export PATH=$PATH:/usr/bin/docker
```

#### Issue 2: Permission Denied
```bash
# Error: permission denied while trying to connect to Docker daemon
# Solution: User not in docker group
```

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended)
sudo docker-compose up --build
```

#### Issue 3: Port Already in Use
```bash
# Error: bind: address already in use
# Solution: Port 3000, 5000, or 5432 already in use
```

**Solution:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :5432

# Stop conflicting services
sudo systemctl stop <service-name>

# Or change ports in docker-compose.yml
```

#### Issue 4: Database Connection Failed
```bash
# Error: database connection failed
# Solution: Database not ready or credentials wrong
```

**Solution:**
```bash
# Check database status
docker-compose logs db

# Restart database
docker-compose restart db

# Check credentials in .env file
cat .env | grep DB_
```

#### Issue 5: Out of Disk Space
```bash
# Error: no space left on device
# Solution: Insufficient disk space
```

**Solution:**
```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -a

# Free up space
sudo apt-get clean
sudo apt-get autoremove
```

#### Issue 6: Memory Issues
```bash
# Error: container killed due to memory limit
# Solution: Insufficient memory
```

**Solution:**
```bash
# Check memory usage
free -h
docker stats

# Increase memory limits in docker-compose.yml
# Or add more RAM to the system
```

### Log Analysis

#### View Application Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api
docker-compose logs db
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f api
```

#### Common Log Messages
- `Connected to PostgreSQL database` - Database connection successful
- `Server running on port 5000` - Backend server started
- `webpack compiled successfully` - Frontend build successful
- `Database connection error` - Database connection failed

### Performance Issues

#### Slow Startup
- **Cause**: Large Docker images, slow network
- **Solution**: Use local images, faster internet

#### High Memory Usage
- **Cause**: Large database, many containers
- **Solution**: Increase system RAM, optimize queries

#### Slow Database Queries
- **Cause**: Missing indexes, large datasets
- **Solution**: Add database indexes, optimize queries

## 🚀 Next Steps

### After Successful Installation

1. **Change Default Passwords**:
   ```bash
   # Login to the application
   # Go to user profile
   # Change admin password
   ```

2. **Configure Users**:
   - Create installer accounts
   - Create manager accounts
   - Set up proper roles

3. **Add Initial Data**:
   - Add clients
   - Add sites
   - Add vehicles
   - Create first job

4. **Configure Backups**:
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

5. **Set Up Monitoring**:
   - Configure log rotation
   - Set up health checks
   - Monitor disk space

### Production Considerations

1. **Security**:
   - Use strong passwords
   - Enable HTTPS
   - Configure firewall
   - Regular security updates

2. **Backup Strategy**:
   - Daily database backups
   - File system backups
   - Test restore procedures

3. **Monitoring**:
   - Application health checks
   - Database performance monitoring
   - Log analysis

4. **Scaling**:
   - Load balancing
   - Database clustering
   - Container orchestration

## 📞 Getting Help

### Documentation
- Check this installation guide
- Review the main README.md
- Check API documentation

### Support Channels
- GitHub Issues
- Email support
- Community forums

### Reporting Issues
When reporting installation issues, include:
1. Operating system and version
2. Docker version
3. Error messages
4. Steps to reproduce
5. Log files

---

**Installation Complete!** 🎉

Your Vehicle Installation Tracker is now ready to use. Navigate to http://localhost:3000 to get started.