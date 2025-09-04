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
  Grid,
  Card,
  CardContent,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Client {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  site_count: number;
  created_at: string;
  updated_at: string;
}

const Clients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchClients();
  }, [page, searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/clients', {
        params: {
          page,
          limit,
          search: searchTerm || undefined,
        },
      });
      setClients(response.data.clients);
      setTotalCount(response.data.pagination.total);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.response?.data?.error || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, clientId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedClientId(clientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClientId(null);
  };

  const handleView = () => {
    if (selectedClientId) {
      navigate(`/clients/${selectedClientId}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        setFormData({
          name: client.name,
          contact_person: client.contact_person || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
        });
        setEditDialogOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedClientId && window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`/api/clients/${selectedClientId}`);
        fetchClients();
        handleMenuClose();
      } catch (err: any) {
        console.error('Error deleting client:', err);
        setError(err.response?.data?.error || 'Failed to delete client');
      }
    }
  };

  const handleCreateClient = async () => {
    try {
      await axios.post('/api/clients', formData);
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      });
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create client');
    }
  };

  const handleUpdateClient = async () => {
    try {
      await axios.put(`/api/clients/${selectedClientId}`, formData);
      setEditDialogOpen(false);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      });
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update client');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Clients</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Client
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            label="Search Clients"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, contact person, or email..."
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Sites</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {client.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{client.contact_person || 'N/A'}</TableCell>
                  <TableCell>{client.email || 'N/A'}</TableCell>
                  <TableCell>{client.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {client.site_count} site{client.site_count !== 1 ? 's' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="more"
                      aria-controls={`client-menu-${client.id}`}
                      aria-haspopup="true"
                      onClick={(e) => handleMenuClick(e, client.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      id={`client-menu-${client.id}`}
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl) && selectedClientId === client.id}
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

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(totalCount / limit)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* Create Client Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Client Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contact_person"
                label="Contact Person"
                fullWidth
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                multiline
                rows={3}
                fullWidth
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateClient} variant="contained">
            Create Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Client Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contact_person"
                label="Contact Person"
                fullWidth
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                multiline
                rows={3}
                fullWidth
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateClient} variant="contained">
            Update Client
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clients;