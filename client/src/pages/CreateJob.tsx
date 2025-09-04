import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Client {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
  client_id: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  fleet_number: string;
  client_id: string;
  site_id: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

const CreateJob: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    siteId: '',
    vehicleId: '',
    assignedTechnicianId: '',
    jobType: '',
    workType: '',
    productType: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clientsRes, techniciansRes] = await Promise.all([
        axios.get('/api/clients'),
        axios.get('/api/users'),
      ]);

      setClients(clientsRes.data.clients);
      setTechnicians(techniciansRes.data.users || []);
    } catch (err: any) {
      setError('Failed to load initial data');
    }
  };

  const fetchSites = async (clientId: string) => {
    try {
      const response = await axios.get(`/api/clients/${clientId}`);
      setSites(response.data.sites || []);
    } catch (err: any) {
      setError('Failed to load sites');
    }
  };

  const fetchVehicles = async (clientId: string, siteId: string) => {
    try {
      const response = await axios.get(`/api/vehicles?clientId=${clientId}&siteId=${siteId}`);
      setVehicles(response.data.vehicles);
    } catch (err: any) {
      setError('Failed to load vehicles');
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({
      ...formData,
      clientId,
      siteId: '',
      vehicleId: '',
    });
    setSites([]);
    setVehicles([]);
    if (clientId) {
      fetchSites(clientId);
    }
  };

  const handleSiteChange = (siteId: string) => {
    setFormData({
      ...formData,
      siteId,
      vehicleId: '',
    });
    setVehicles([]);
    if (siteId && formData.clientId) {
      fetchVehicles(formData.clientId, siteId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/jobs', formData);
      navigate(`/jobs/${response.data.job.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Job
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Client Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    label="Client"
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Site Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Site</InputLabel>
                  <Select
                    value={formData.siteId}
                    onChange={(e) => handleSiteChange(e.target.value)}
                    label="Site"
                    disabled={!formData.clientId}
                  >
                    {sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Vehicle Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    value={formData.vehicleId}
                    onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                    label="Vehicle"
                    disabled={!formData.siteId}
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.fleet_number}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Technician Assignment */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Technician</InputLabel>
                  <Select
                    value={formData.assignedTechnicianId}
                    onChange={(e) => handleInputChange('assignedTechnicianId', e.target.value)}
                    label="Assigned Technician"
                  >
                    {technicians
                      .filter(tech => tech.role === 'installer')
                      .map((tech) => (
                        <MenuItem key={tech.id} value={tech.id}>
                          {tech.first_name} {tech.last_name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Job Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={formData.jobType}
                    onChange={(e) => handleInputChange('jobType', e.target.value)}
                    label="Job Type"
                  >
                    <MenuItem value="repair">Repair</MenuItem>
                    <MenuItem value="install">Install</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="upgrade">Upgrade</MenuItem>
                    <MenuItem value="removal">Removal</MenuItem>
                    <MenuItem value="health_check">Health Check</MenuItem>
                    <MenuItem value="re_installation">Re-Installation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Work Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Work Type</InputLabel>
                  <Select
                    value={formData.workType}
                    onChange={(e) => handleInputChange('workType', e.target.value)}
                    label="Work Type"
                  >
                    <MenuItem value="new_installation">New Installation</MenuItem>
                    <MenuItem value="upgrade_remove_old">Upgrade (Remove Old Device)</MenuItem>
                    <MenuItem value="removals">Removals</MenuItem>
                    <MenuItem value="re_installation">Re-Installation</MenuItem>
                    <MenuItem value="health_check">Health Check</MenuItem>
                    <MenuItem value="repair">Repair</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Product Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Product Type</InputLabel>
                  <Select
                    value={formData.productType}
                    onChange={(e) => handleInputChange('productType', e.target.value)}
                    label="Product Type"
                  >
                    <MenuItem value="tracking_device">Tracking Device</MenuItem>
                    <MenuItem value="rfid">RFID</MenuItem>
                    <MenuItem value="rocket_switch">Rocket Switch</MenuItem>
                    <MenuItem value="tablet">Tablet</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Scheduled Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scheduled Date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Scheduled Time */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scheduled Time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Job'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/jobs')}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateJob;