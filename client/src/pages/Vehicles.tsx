import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Pagination,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

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
  site_name: string;
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

const Vehicles: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [filterClientId, setFilterClientId] = useState<string>('');
  const [filterSiteId, setFilterSiteId] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/vehicles', {
        params: {
          clientId: filterClientId || undefined,
          siteId: filterSiteId || undefined,
          page,
          limit,
        },
      });
      setVehicles(response.data.vehicles);
      setTotalCount(response.data.pagination.total);
    } catch (err: any) {
      console.error('Error fetching vehicles:', err);
      setError(err.response?.data?.error || 'Failed to fetch vehicles');
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
    fetchClientsAndSites();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [page, limit, filterClientId, filterSiteId, filterSearch]);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, vehicleId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedVehicleId(vehicleId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVehicleId(null);
  };

  const handleView = () => {
    if (selectedVehicleId) {
      navigate(`/vehicles/${selectedVehicleId}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedVehicleId) {
      navigate(`/vehicles/${selectedVehicleId}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedVehicleId && window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await axios.delete(`/api/vehicles/${selectedVehicleId}`);
        fetchVehicles();
        handleMenuClose();
      } catch (err: any) {
        console.error('Error deleting vehicle:', err);
        setError(err.response?.data?.error || 'Failed to delete vehicle');
      }
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(1);
  };

  const filteredSites = filterClientId
    ? sites.filter((site) => site.client_id === filterClientId)
    : sites;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vehicles
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search (Make, Model, Fleet No.)"
                variant="outlined"
                fullWidth
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Client</InputLabel>
                <Select
                  value={filterClientId}
                  onChange={(e) => {
                    setFilterClientId(e.target.value as string);
                    setFilterSiteId('');
                  }}
                  label="Client"
                >
                  <MenuItem value="">
                    <em>All Clients</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth variant="outlined" disabled={!filterClientId}>
                <InputLabel>Site</InputLabel>
                <Select
                  value={filterSiteId}
                  onChange={(e) => setFilterSiteId(e.target.value as string)}
                  label="Site"
                >
                  <MenuItem value="">
                    <em>All Sites</em>
                  </MenuItem>
                  {filteredSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/vehicles/create')}
                  fullWidth
                >
                  Add Vehicle
                </Button>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Make</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Fleet Number</TableCell>
                  <TableCell>Km's/Hours</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.make}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.color}</TableCell>
                      <TableCell>{vehicle.fleet_number}</TableCell>
                      <TableCell>{vehicle.km_or_hours}</TableCell>
                      <TableCell>{vehicle.client_name}</TableCell>
                      <TableCell>{vehicle.site_name}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="more"
                          aria-controls={`vehicle-menu-${vehicle.id}`}
                          aria-haspopup="true"
                          onClick={(e) => handleMenuClick(e, vehicle.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          id={`vehicle-menu-${vehicle.id}`}
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && selectedVehicleId === vehicle.id}
                          onClose={handleMenuClose}
                        >
                          <MenuItem onClick={handleView}>
                            <ViewIcon sx={{ mr: 1 }} />
                            View
                          </MenuItem>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <MenuItem onClick={handleEdit}>
                              <EditIcon sx={{ mr: 1 }} />
                              Edit
                            </MenuItem>
                          )}
                          {user?.role === 'admin' && (
                            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                              <DeleteIcon sx={{ mr: 1 }} />
                              Delete
                            </MenuItem>
                          )}
                        </Menu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Pagination
              count={Math.ceil(totalCount / limit)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
            <FormControl variant="outlined" size="small">
              <InputLabel>Items per page</InputLabel>
              <Select
                value={limit.toString()}
                onChange={(e: any) => handleLimitChange(e)}
                label="Items per page"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Vehicles;