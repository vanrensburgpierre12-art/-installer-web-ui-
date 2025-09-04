# 🐳 Docker Installation Guide

A comprehensive guide for installing and deploying the Vehicle Installation Tracker using Docker. This guide covers everything from quick start to production deployment.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Docker Installation](#-docker-installation)
- [Application Deployment](#-application-deployment)
- [Configuration](#-configuration)
- [Production Deployment](#-production-deployment)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Troubleshooting](#-troubleshooting)
- [Security Best Practices](#-security-best-practices)

## 🚀 Quick Start

### One-Command Deployment

For a quick start with default settings:

```bash
# Clone the repository
git clone <repository-url>
cd vehicle-installation-tracker

# Start the application (development mode)
docker-compose -f docker-compose.dev.yml up --build -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Production Quick Start

```bash
# Clone and configure
git clone <repository-url>
cd vehicle-installation-tracker

# Copy and edit environment file
cp .env.example .env
nano .env  # Edit with your settings

# Start production services
docker-compose up --build -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## ✅ Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores (2.0 GHz)
- **RAM**: 4GB
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows with Docker support
- **Network**: Internet connection

#### Recommended Requirements
- **CPU**: 4 cores (2.5 GHz+)
- **RAM**: 8GB
- **Storage**: 20GB free space (SSD)
- **OS**: Linux (Ubuntu 20.04+)
- **Network**: Stable internet connection

### Required Software

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository
- **curl/wget**: For downloading files

## 🐳 Docker Installation

### Linux (Ubuntu/Debian)

#### Automated Installation
```bash
# Download and run Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

#### Manual Installation
```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Add Docker's GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Linux (CentOS/RHEL/Rocky Linux)

```bash
# Install required packages
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### macOS

#### Using Homebrew (Recommended)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop from Applications folder
```

#### Manual Installation
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Enable Kubernetes if needed

### Windows

#### Using WSL 2 (Recommended)
```powershell
# Enable WSL 2
wsl --install

# Install Docker Desktop for Windows
# Download from: https://www.docker.com/products/docker-desktop
```

#### Using PowerShell
```powershell
# Install Docker using Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

choco install docker-desktop
```

### Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Test Docker installation
docker run hello-world

# Check if Docker daemon is running
docker info
```

## 🚀 Application Deployment

### 1. Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd vehicle-installation-tracker

# Verify files
ls -la
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

#### Essential Environment Variables

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

### 3. Development Deployment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or run in background
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 4. Production Deployment

```bash
# Start production environment
docker-compose up --build

# Or run in background
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### 5. Verify Deployment

```bash
# Check running containers
docker-compose ps

# Check application health
curl http://localhost:5000/health

# Check database connection
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT version();"
```

### 6. Create Admin User

```bash
# Create admin user via API
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

## ⚙️ Configuration

### Environment Variables Reference

#### Database Settings
```env
DB_NAME=vehicle_tracker          # Database name
DB_USER=postgres                 # Database user
DB_PASSWORD=secure_password      # Database password
DB_HOST=db                       # Database host (container name)
DB_PORT=5432                     # Database port
```

#### Security Settings
```env
JWT_SECRET=your_jwt_secret       # JWT signing secret (32+ chars)
JWT_EXPIRES_IN=24h               # Token expiration time
CORS_ORIGIN=http://localhost:3000 # Allowed CORS origins
```

#### Application Settings
```env
NODE_ENV=production              # Environment mode
PORT=5000                        # Application port
UPLOAD_DIR=/app/uploads          # Upload directory
MAX_FILE_SIZE=10485760           # Max file size (10MB)
```

#### Optional Settings
```env
TZ=UTC                           # Timezone
LOG_LEVEL=info                   # Log level
SSL_CERT_PATH=/path/to/cert.pem  # SSL certificate path
SSL_KEY_PATH=/path/to/key.pem    # SSL private key path
```

### Docker Compose Profiles

#### Development Profile
```bash
# Uses development Dockerfile with hot reload
docker-compose -f docker-compose.dev.yml up
```

#### Production Profile
```bash
# Uses production Dockerfile with optimizations
docker-compose up
```

#### Production with Nginx
```bash
# Includes Nginx reverse proxy
docker-compose --profile production up
```

### Volume Management

#### List Volumes
```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect vehicle-installation-tracker_postgres_data
```

#### Backup Volumes
```bash
# Backup database volume
docker run --rm -v vehicle-installation-tracker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Backup uploads volume
docker run --rm -v vehicle-installation-tracker_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .
```

#### Restore Volumes
```bash
# Restore database volume
docker run --rm -v vehicle-installation-tracker_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data

# Restore uploads volume
docker run --rm -v vehicle-installation-tracker_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup.tar.gz -C /data
```

## 🚀 Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL Configuration

#### Using Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt-get install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf with SSL paths
# SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
# SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### Using Self-Signed Certificate
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update environment variables
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### 3. Production Environment Setup

```bash
# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
CORS_ORIGIN=https://yourdomain.com
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
EOF

# Start production services
docker-compose --env-file .env.production up -d
```

### 4. Nginx Configuration

```bash
# Update nginx.conf for your domain
sudo nano nginx.conf

# Start with Nginx
docker-compose --profile production up -d
```

### 5. Systemd Service (Optional)

```bash
# Create systemd service file
sudo tee /etc/systemd/system/vehicle-tracker.service > /dev/null << EOF
[Unit]
Description=Vehicle Installation Tracker
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/vehicle-installation-tracker
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable vehicle-tracker.service
sudo systemctl start vehicle-tracker.service
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check container status
docker-compose ps

# Check application health
curl http://localhost:5000/health

# Check database health
docker-compose exec db pg_isready -U postgres

# Check resource usage
docker stats
```

### Log Management

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api
docker-compose logs db
docker-compose logs nginx

# Follow logs in real-time
docker-compose logs -f api

# View logs with timestamps
docker-compose logs -t api
```

### Backup Strategy

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh - Automated backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/vehicle-tracker"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T db pg_dump -U postgres vehicle_tracker > $BACKUP_DIR/db_backup_$DATE.sql

# Uploads backup
docker run --rm -v vehicle-installation-tracker_uploads_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_backup_$DATE.tar.gz -C /data .

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

#### Schedule Backups
```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/backup.sh
```

### Updates and Maintenance

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up --build -d

# Clean up old images
docker image prune -f
```

#### Database Maintenance
```bash
# Connect to database
docker-compose exec db psql -U postgres -d vehicle_tracker

# Run maintenance commands
VACUUM ANALYZE;
REINDEX DATABASE vehicle_tracker;
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check container logs
docker-compose logs container_name

# Check container status
docker-compose ps

# Restart specific container
docker-compose restart container_name
```

**Common Causes:**
- Port conflicts
- Insufficient memory
- Invalid environment variables
- Database connection issues

#### 2. Database Connection Issues

```bash
# Check database container
docker-compose ps db

# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec db psql -U postgres -c "SELECT 1;"

# Check database health
docker-compose exec db pg_isready -U postgres
```

**Solutions:**
- Verify database credentials in `.env`
- Check if database container is healthy
- Restart database: `docker-compose restart db`
- Check available disk space

#### 3. File Upload Issues

```bash
# Check upload directory permissions
docker-compose exec api ls -la uploads/

# Check disk space
docker-compose exec api df -h

# Check file size limits
grep MAX_FILE_SIZE .env
```

**Solutions:**
- Check `MAX_FILE_SIZE` setting
- Verify upload directory permissions
- Ensure sufficient disk space
- Check file type restrictions

#### 4. Memory Issues

```bash
# Check memory usage
docker stats

# Check system memory
free -h

# Check Docker memory limits
docker-compose config
```

**Solutions:**
- Increase container memory limits
- Add more system RAM
- Optimize application code
- Use swap space

#### 5. Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
netstat -tulpn | grep :5432

# Check Docker port mappings
docker-compose ps
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

# Check slow queries
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

**Solutions:**
- Add database indexes
- Optimize queries
- Increase database resources
- Enable query caching

#### 2. High CPU Usage

```bash
# Check CPU usage
docker stats

# Check system load
top
htop
```

**Solutions:**
- Increase CPU limits
- Optimize application code
- Add more CPU cores
- Use load balancing

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
docker run --rm -v vehicle-installation-tracker_uploads_data:/data -v $(pwd):/backup alpine tar xzf uploads_backup.tar.gz -C /data

# Restart application
docker-compose restart api
```

#### 3. Complete System Recovery

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v
docker system prune -a

# Restore from backup
# Restore database
# Restore files
# Restart services
docker-compose up --build -d
```

## 🔒 Security Best Practices

### 1. Environment Security

```bash
# Secure environment file
chmod 600 .env

# Use strong passwords
openssl rand -base64 32

# Rotate secrets regularly
# Update JWT_SECRET and DB_PASSWORD monthly
```

### 2. Container Security

```bash
# Run containers as non-root user
# (Already configured in Dockerfile)

# Use read-only filesystems
# (Already configured in docker-compose.yml)

# Limit container resources
# (Already configured with memory/CPU limits)
```

### 3. Network Security

```bash
# Use internal networks
# (Already configured with custom network)

# Restrict port exposure
# Only expose necessary ports

# Use reverse proxy
# (Nginx configuration provided)
```

### 4. Data Security

```bash
# Encrypt sensitive data
# Use strong database passwords
# Regular backups
# Secure file uploads
```

### 5. Monitoring Security

```bash
# Monitor logs for suspicious activity
docker-compose logs | grep -i error
docker-compose logs | grep -i failed

# Set up log rotation
# Monitor resource usage
# Regular security updates
```

## 📞 Support

### Getting Help

1. **Check Logs**: Always check container logs first
2. **Review Documentation**: Check this guide and README.md
3. **Search Issues**: Look for similar issues online
4. **Create Issue**: Report bugs with detailed information

### Reporting Issues

When reporting issues, include:
- OS and Docker version
- Complete error logs
- Steps to reproduce
- Environment configuration (without secrets)
- System resources (CPU, RAM, disk)

### Community Support

- GitHub Issues
- Docker Community Forums
- Stack Overflow
- Project Documentation

---

**Vehicle Installation Tracker** - Deploy with confidence using Docker! 🐳

For more information, see the main [README.md](README.md) file.