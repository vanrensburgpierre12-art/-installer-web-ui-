#!/bin/bash

# Vehicle Installation Tracker - Quick Install Script
# This script automates the installation process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        exit 1
    fi
    
    # Check available memory
    if command_exists free; then
        MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
        if [ "$MEMORY_GB" -lt 4 ]; then
            print_warning "System has less than 4GB RAM. Recommended: 8GB+"
        fi
    fi
    
    # Check available disk space
    DISK_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -lt 10 ]; then
        print_warning "Less than 10GB free disk space available. Recommended: 20GB+"
    fi
    
    print_success "System requirements check completed"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    if command_exists docker; then
        print_success "Docker is already installed"
        return
    fi
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            print_status "Installing Docker on Ubuntu/Debian..."
            sudo apt-get update
            sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        elif command_exists yum; then
            # CentOS/RHEL
            print_status "Installing Docker on CentOS/RHEL..."
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            sudo systemctl start docker
            sudo systemctl enable docker
        else
            print_error "Unsupported Linux distribution. Please install Docker manually."
            exit 1
        fi
        
        # Add user to docker group
        sudo usermod -aG docker $USER
        print_warning "User added to docker group. You may need to log out and back in."
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            print_status "Installing Docker on macOS using Homebrew..."
            brew install --cask docker
        else
            print_error "Homebrew not found. Please install Docker Desktop manually from https://www.docker.com/products/docker-desktop"
            exit 1
        fi
    else
        print_error "Unsupported operating system. Please install Docker manually."
        exit 1
    fi
    
    print_success "Docker installation completed"
}

# Function to verify Docker installation
verify_docker() {
    print_status "Verifying Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker command not found. Please restart your terminal or log out and back in."
        exit 1
    fi
    
    if ! docker --version >/dev/null 2>&1; then
        print_error "Docker is not working properly. Please check your installation."
        exit 1
    fi
    
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not working properly. Please check your installation."
        exit 1
    fi
    
    print_success "Docker installation verified"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Environment file created from template"
    else
        print_warning "Environment file already exists, skipping creation"
    fi
    
    # Generate secure passwords if not set
    if ! grep -q "DB_PASSWORD=your_secure_password_here" .env; then
        print_status "Environment file already configured"
    else
        print_status "Generating secure passwords..."
        
        # Generate database password
        DB_PASSWORD=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        sed -i.bak "s/DB_PASSWORD=your_secure_password_here/DB_PASSWORD=$DB_PASSWORD/" .env
        
        # Generate JWT secret
        JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64)
        sed -i.bak "s/JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long/JWT_SECRET=$JWT_SECRET/" .env
        
        # Clean up backup files
        rm -f .env.bak
        
        print_success "Secure passwords generated and configured"
    fi
}

# Function to start application
start_application() {
    print_status "Starting Vehicle Installation Tracker..."
    
    # Ask user for installation mode
    echo ""
    echo "Choose installation mode:"
    echo "1) Development mode (recommended for first-time setup)"
    echo "2) Production mode"
    echo ""
    read -p "Enter your choice (1 or 2): " choice
    
    case $choice in
        1)
            print_status "Starting in development mode..."
            docker-compose -f docker-compose.dev.yml up --build -d
            ;;
        2)
            print_status "Starting in production mode..."
            docker-compose up --build -d
            ;;
        *)
            print_error "Invalid choice. Starting in development mode..."
            docker-compose -f docker-compose.dev.yml up --build -d
            ;;
    esac
    
    print_success "Application started successfully"
}

# Function to wait for services
wait_for_services() {
    print_status "Waiting for services to start..."
    
    # Wait for database
    print_status "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
            print_success "Database is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "Database failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for API
    print_status "Waiting for API to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:5000/health >/dev/null 2>&1; then
            print_success "API is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "API failed to start within 60 seconds"
        exit 1
    fi
}

# Function to create admin user
create_admin_user() {
    print_status "Creating admin user..."
    
    # Wait a bit more for the API to be fully ready
    sleep 5
    
    # Create admin user
    response=$(curl -s -X POST http://localhost:5000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "email": "admin@example.com",
            "password": "admin123",
            "firstName": "Admin",
            "lastName": "User",
            "role": "admin"
        }' 2>/dev/null || echo "error")
    
    if echo "$response" | grep -q "User created successfully"; then
        print_success "Admin user created successfully"
    elif echo "$response" | grep -q "Username or email already exists"; then
        print_warning "Admin user already exists"
    else
        print_warning "Failed to create admin user automatically. You can create it manually later."
    fi
}

# Function to display final information
display_final_info() {
    echo ""
    echo "=========================================="
    print_success "Installation completed successfully!"
    echo "=========================================="
    echo ""
    echo "Application URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:5000"
    echo "  Database: localhost:5432"
    echo ""
    echo "Default Login Credentials:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "Important:"
    echo "  - Change the default password after first login"
    echo "  - Review the .env file for security settings"
    echo "  - Check the README.md for detailed usage instructions"
    echo ""
    echo "Useful Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop app: docker-compose down"
    echo "  Start app: docker-compose up -d"
    echo "  Restart app: docker-compose restart"
    echo ""
    print_status "Opening application in your default browser..."
    
    # Try to open browser (works on most systems)
    if command_exists xdg-open; then
        xdg-open http://localhost:3000
    elif command_exists open; then
        open http://localhost:3000
    elif command_exists start; then
        start http://localhost:3000
    else
        echo "Please open http://localhost:3000 in your browser"
    fi
}

# Main installation function
main() {
    echo "=========================================="
    echo "Vehicle Installation Tracker - Installer"
    echo "=========================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Run installation steps
    check_requirements
    install_docker
    verify_docker
    setup_environment
    start_application
    wait_for_services
    create_admin_user
    display_final_info
}

# Run main function
main "$@"