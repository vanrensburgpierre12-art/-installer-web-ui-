# 🚀 Setup Guide - Vehicle Installation Tracker

This guide provides multiple setup options for different environments and use cases.

## 📋 Quick Setup Options

### Option 1: Automated Installation (Recommended)

#### Linux/macOS
```bash
# Make script executable and run
chmod +x install.sh
./install.sh
```

#### Windows
```cmd
# Run the batch file
install.bat
```

### Option 2: Manual Docker Setup

#### Step 1: Clone and Setup
```bash
git clone <repository-url>
cd vehicle-installation-tracker
cp .env.example .env
```

#### Step 2: Start Application
```bash
# Development mode
docker-compose -f docker-compose.dev.yml up --build

# Production mode
docker-compose up --build
```

### Option 3: Local Development Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

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

## 🎯 Setup Scenarios

### Scenario 1: First-Time User (Recommended)

**Goal**: Get the application running quickly for evaluation

**Steps**:
1. Run automated installer: `./install.sh` or `install.bat`
2. Wait for services to start (2-3 minutes)
3. Open http://localhost:3000
4. Login with admin/admin123
5. Start exploring the application

**Time Required**: 5-10 minutes

### Scenario 2: Development Environment

**Goal**: Set up for active development

**Steps**:
1. Use development Docker setup:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```
2. Make code changes
3. Changes are automatically reflected
4. Use `docker-compose logs -f` to monitor

**Time Required**: 3-5 minutes

### Scenario 3: Production Deployment

**Goal**: Deploy to production server

**Steps**:
1. Set up production environment:
   ```bash
   export NODE_ENV=production
   cp .env.example .env
   # Edit .env with production settings
   ```
2. Generate secure passwords:
   ```bash
   openssl rand -base64 32  # For DB_PASSWORD
   openssl rand -base64 64  # For JWT_SECRET
   ```
3. Start production services:
   ```bash
   docker-compose up --build -d
   ```
4. Configure reverse proxy (optional)
5. Set up SSL certificates (optional)

**Time Required**: 15-30 minutes

### Scenario 4: Cloud Deployment

**Goal**: Deploy to cloud platform (AWS, Azure, GCP)

**Steps**:
1. Set up cloud infrastructure
2. Configure environment variables
3. Use cloud database service
4. Deploy using cloud container service
5. Configure load balancer and SSL

**Time Required**: 1-2 hours

## 🔧 Environment-Specific Setup

### Ubuntu 20.04+ Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and setup application
git clone <repository-url>
cd vehicle-installation-tracker
./install.sh
```

### CentOS 8+ Server

```bash
# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and setup application
git clone <repository-url>
cd vehicle-installation-tracker
./install.sh
```

### macOS Development

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop
open /Applications/Docker.app

# Clone and setup application
git clone <repository-url>
cd vehicle-installation-tracker
./install.sh
```

### Windows Development

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install Git from https://git-scm.com/download/win
3. Open Command Prompt or PowerShell
4. Clone and setup application:
   ```cmd
   git clone <repository-url>
   cd vehicle-installation-tracker
   install.bat
   ```

## 🐳 Docker-Specific Setup

### Custom Docker Configuration

#### Custom Ports
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  api:
    ports:
      - "8080:5000"
  frontend:
    ports:
      - "3001:3000"
  db:
    ports:
      - "5433:5432"
```

#### Custom Environment
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  api:
    environment:
      - NODE_ENV=staging
      - DB_HOST=custom-db-host
  db:
    environment:
      - POSTGRES_DB=custom_db_name
```

### Docker Swarm Setup

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml vehicle-tracker

# Check services
docker service ls
```

### Kubernetes Setup

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vehicle-tracker-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vehicle-tracker-api
  template:
    metadata:
      labels:
        app: vehicle-tracker-api
    spec:
      containers:
      - name: api
        image: vehicle-tracker:latest
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          value: "postgres-service"
```

## 🔒 Security Setup

### Production Security Checklist

- [ ] Change default passwords
- [ ] Generate secure JWT secret
- [ ] Configure HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Configure backup strategy
- [ ] Set up monitoring
- [ ] Regular security updates

### SSL/HTTPS Setup

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf with SSL configuration
# Restart nginx
sudo systemctl restart nginx
```

#### Using Self-Signed Certificates
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update docker-compose.yml to mount certificates
# Restart services
docker-compose restart nginx
```

## 📊 Monitoring Setup

### Health Checks
```bash
# Application health
curl http://localhost:5000/health

# Database health
docker-compose exec db pg_isready -U postgres

# All services status
docker-compose ps
```

### Log Monitoring
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api | grep ERROR

# Save logs to file
docker-compose logs > application.log
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Database performance
docker-compose exec db psql -U postgres -d vehicle_tracker -c "SELECT * FROM pg_stat_activity;"
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec db pg_dump -U postgres vehicle_tracker > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T db psql -U postgres vehicle_tracker < backup_20231201.sql
```

### File Backup
```bash
# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Restore files
tar -xzf uploads_backup_20231201.tar.gz
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker-compose exec -T db pg_dump -U postgres vehicle_tracker > $BACKUP_DIR/db_backup_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz uploads/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

## 🚨 Troubleshooting Setup Issues

### Common Issues

#### Docker Not Starting
```bash
# Check Docker service
sudo systemctl status docker

# Start Docker service
sudo systemctl start docker

# Check Docker daemon
sudo dockerd --debug
```

#### Port Conflicts
```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :5432

# Kill process using port
sudo kill -9 <PID>
```

#### Permission Issues
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

#### Memory Issues
```bash
# Check memory usage
free -h
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Getting Help

1. **Check Logs**: `docker-compose logs -f`
2. **Check Status**: `docker-compose ps`
3. **Restart Services**: `docker-compose restart`
4. **Clean Restart**: `docker-compose down && docker-compose up --build`
5. **Check Documentation**: README.md and INSTALLATION.md
6. **Community Support**: GitHub Issues

## 📈 Scaling Setup

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  api:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
  nginx:
    depends_on:
      - api
    ports:
      - "80:80"
```

### Load Balancing
```nginx
# nginx.conf
upstream api_backend {
    server api_1:5000;
    server api_2:5000;
    server api_3:5000;
}

server {
    location /api/ {
        proxy_pass http://api_backend;
    }
}
```

### Database Scaling
```yaml
# docker-compose.db-cluster.yml
version: '3.8'
services:
  db-master:
    image: postgres:15
    environment:
      - POSTGRES_DB=vehicle_tracker
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_master_data:/var/lib/postgresql/data
  
  db-replica:
    image: postgres:15
    environment:
      - POSTGRES_DB=vehicle_tracker
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    depends_on:
      - db-master
```

---

**Setup Complete!** 🎉

Choose the setup option that best fits your needs and follow the corresponding steps. The automated installer is recommended for most users.