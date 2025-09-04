import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  fleet_number: string;
  registration: string;
  km_or_hours: number;
  year: number;
  client_name: string;
  client_contact: string;
  site_name: string;
  site_address: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
  client_id: string;
}

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const fetchVehicle = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/vehicles/${id}`);
      setVehicle(response.data);
      setFormData(response.data);
    } catch (err: any) {
      console.error('Error fetching vehicle:', err);
      setError(err.response?.data?.error || 'Failed to fetch vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsAndSites = async () => {
    try {
      const clientsRes = await axios.get('/api/clients');
      setClients(clientsRes.data.clients);

      const sitesRes = await axios.get('/api/sites');
      setSites(sitesRes.data.sites);
    } catch (err) {
      console.error('Error fetching clients or sites:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVehicle();
      fetchClientsAndSites();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.put(`/api/vehicles/${id}`, formData);
      setIsEditing(false);
      fetchVehicle();
    } catch (err: any) {
      console.error('Error updating vehicle:', err);
      setError(err.response?.data?.error || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = formData.client_id
    ? sites.filter((site) => site.client_id === formData.client_id)
    : sites;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!vehicle) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Vehicle not found.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vehicle Details: {vehicle.make} {vehicle.model} ({vehicle.fleet_number})
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {isEditing ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle Make"
                  name="make"
                  value={formData.make || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle Model"
                  name="model"
                  value={formData.model || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle Color"
                  name="color"
                  value={formData.color || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fleet Number"
                  name="fleet_number"
                  value={formData.fleet_number || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vehicle Km's/Hours"
                  name="km_or_hours"
                  type="number"
                  value={formData.km_or_hours || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Client</InputLabel>
                  <Select
                    name="client_id"
                    value={formData.client_id || ''}
                    onChange={handleInputChange}
                    label="Client"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" disabled={!formData.client_id}>
                  <InputLabel>Site</InputLabel>
                  <Select
                    name="site_id"
                    value={formData.site_id || ''}
                    onChange={handleInputChange}
                    label="Site"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {filteredSites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSave} sx={{ mr: 2 }}>
                  Save Changes
                </Button>
                <Button variant="outlined" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Make:
                </Typography>
                <Typography variant="body1">{vehicle.make}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Model:
                </Typography>
                <Typography variant="body1">{vehicle.model}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Color:
                </Typography>
                <Typography variant="body1">{vehicle.color}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Fleet Number:
                </Typography>
                <Typography variant="body1">{vehicle.fleet_number}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Km's/Hours:
                </Typography>
                <Typography variant="body1">{vehicle.km_or_hours}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Client:
                </Typography>
                <Typography variant="body1">{vehicle.client_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Site:
                </Typography>
                <Typography variant="body1">{vehicle.site_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Created At:
                </Typography>
                <Typography variant="body1">
                  {vehicle.created_at ? format(new Date(vehicle.created_at), 'PPP p') : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" color="text.secondary">
                  Last Updated:
                </Typography>
                <Typography variant="body1">
                  {vehicle.updated_at ? format(new Date(vehicle.updated_at), 'PPP p') : 'N/A'}
                </Typography>
              </Grid>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Grid item xs={12}>
                  <Button variant="contained" onClick={() => setIsEditing(true)}>
                    Edit Vehicle
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VehicleDetails;