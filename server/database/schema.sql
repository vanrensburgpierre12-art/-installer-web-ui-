-- Database schema for Vehicle Installation Tracker

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('installer', 'manager', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sites table
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    make VARCHAR(50),
    model VARCHAR(50),
    color VARCHAR(30),
    fleet_number VARCHAR(50),
    registration VARCHAR(20),
    km_or_hours BIGINT,
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job types enum
CREATE TYPE job_type AS ENUM ('repair', 'install', 'maintenance', 'upgrade', 'removal', 'health_check', 're_installation');

-- Product types enum
CREATE TYPE product_type AS ENUM ('tracking_device', 'rfid', 'rocket_switch', 'tablet');

-- Work types enum
CREATE TYPE work_type AS ENUM ('new_installation', 'upgrade_remove_old', 'removals', 're_installation', 'health_check', 'repair');

-- Job status enum
CREATE TYPE job_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'requires_approval', 'approved');

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_card_number VARCHAR(20) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    job_type job_type NOT NULL,
    work_type work_type NOT NULL,
    product_type product_type,
    status job_status DEFAULT 'pending',
    
    -- Job details
    description TEXT,
    device_serial_imei VARCHAR(50),
    device_sim_number VARCHAR(20),
    tablet_serial_imei VARCHAR(50),
    tablet_sim_number VARCHAR(20),
    
    -- Timing
    scheduled_date DATE,
    scheduled_time TIME,
    start_time TIMESTAMP,
    finish_time TIMESTAMP,
    
    -- Travel details
    travel_km_1 INTEGER,
    travel_time_1 TIME,
    travel_date_1 DATE,
    travel_km_2 INTEGER,
    travel_time_2 TIME,
    travel_date_2 DATE,
    travel_km_3 INTEGER,
    travel_time_3 TIME,
    travel_date_3 DATE,
    
    -- Audit fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle pre-inspection table
CREATE TABLE vehicle_pre_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    windscreen_cracked BOOLEAN,
    windscreen_chipped BOOLEAN,
    windscreen_other BOOLEAN,
    windscreen_other_notes TEXT,
    
    -- Pre-inspection functions
    interior_dash_panels_fault BOOLEAN,
    interior_dash_panels_no_fault BOOLEAN,
    interior_dash_panels_na BOOLEAN,
    
    ignition_cluster_faults_fault BOOLEAN,
    ignition_cluster_faults_no_fault BOOLEAN,
    ignition_cluster_faults_na BOOLEAN,
    
    vehicle_starting_fault BOOLEAN,
    vehicle_starting_no_fault BOOLEAN,
    vehicle_starting_na BOOLEAN,
    
    flat_battery_fault BOOLEAN,
    flat_battery_no_fault BOOLEAN,
    flat_battery_na BOOLEAN,
    
    radio_fault BOOLEAN,
    radio_no_fault BOOLEAN,
    radio_na BOOLEAN,
    
    interior_lights_fault BOOLEAN,
    interior_lights_no_fault BOOLEAN,
    interior_lights_na BOOLEAN,
    
    external_lights_fault BOOLEAN,
    external_lights_no_fault BOOLEAN,
    external_lights_na BOOLEAN,
    
    electric_windows_fault BOOLEAN,
    electric_windows_no_fault BOOLEAN,
    electric_windows_na BOOLEAN,
    
    other_fault BOOLEAN,
    other_no_fault BOOLEAN,
    other_na BOOLEAN,
    other_notes TEXT,
    
    inspected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle post-inspection table
CREATE TABLE vehicle_post_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    bucket_switch_configured BOOLEAN,
    bucket_switch_working BOOLEAN,
    
    -- Similar structure to pre-inspection
    interior_dash_panels_fault BOOLEAN,
    interior_dash_panels_no_fault BOOLEAN,
    interior_dash_panels_na BOOLEAN,
    
    ignition_cluster_faults_fault BOOLEAN,
    ignition_cluster_faults_no_fault BOOLEAN,
    ignition_cluster_faults_na BOOLEAN,
    
    vehicle_starting_fault BOOLEAN,
    vehicle_starting_no_fault BOOLEAN,
    vehicle_starting_na BOOLEAN,
    
    flat_battery_fault BOOLEAN,
    flat_battery_no_fault BOOLEAN,
    flat_battery_na BOOLEAN,
    
    radio_fault BOOLEAN,
    radio_no_fault BOOLEAN,
    radio_na BOOLEAN,
    
    interior_lights_fault BOOLEAN,
    interior_lights_no_fault BOOLEAN,
    interior_lights_na BOOLEAN,
    
    external_lights_fault BOOLEAN,
    external_lights_no_fault BOOLEAN,
    external_lights_na BOOLEAN,
    
    electric_windows_fault BOOLEAN,
    electric_windows_no_fault BOOLEAN,
    electric_windows_na BOOLEAN,
    
    other_fault BOOLEAN,
    other_no_fault BOOLEAN,
    other_na BOOLEAN,
    other_notes TEXT,
    
    inspected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images table for job photos
CREATE TABLE job_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    image_type VARCHAR(50) NOT NULL, -- 'device_serial', 'tablet_serial', 'connection_1', 'connection_2', 'connection_3'
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job tasks table
CREATE TABLE job_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sign-offs table
CREATE TABLE job_sign_offs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    sign_off_type VARCHAR(50) NOT NULL, -- 'technician', 'construction_manager', 'project_manager'
    signer_name VARCHAR(100) NOT NULL,
    signer_surname VARCHAR(100) NOT NULL,
    signature_data TEXT, -- Base64 encoded signature
    job_completed BOOLEAN,
    terms_accepted BOOLEAN,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Audit trail table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_vehicle_id ON jobs(vehicle_id);
CREATE INDEX idx_jobs_assigned_technician_id ON jobs(assigned_technician_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_audit_logs_job_id ON audit_logs(job_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();