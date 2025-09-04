import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  job_id: string;
  user_id: string;
  action: string;
  description: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  username: string;
  first_name: string;
  last_name: string;
  job_card_number: string;
}

const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await axios.get(`/api/audit?${params}`);
      setAuditLogs(response.data.auditLogs);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.error || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'JOB_CREATED':
      case 'JOB_APPROVED':
        return 'success';
      case 'JOB_UPDATED':
      case 'JOB_STARTED':
      case 'JOB_COMPLETED':
        return 'info';
      case 'JOB_REJECTED':
      case 'JOB_CANCELLED':
        return 'error';
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
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
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by action, user, or description..."
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Action"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="JOB_CREATED">Job Created</MenuItem>
                  <MenuItem value="JOB_UPDATED">Job Updated</MenuItem>
                  <MenuItem value="JOB_STARTED">Job Started</MenuItem>
                  <MenuItem value="JOB_COMPLETED">Job Completed</MenuItem>
                  <MenuItem value="JOB_APPROVED">Job Approved</MenuItem>
                  <MenuItem value="JOB_REJECTED">Job Rejected</MenuItem>
                  <MenuItem value="USER_LOGIN">User Login</MenuItem>
                  <MenuItem value="USER_LOGOUT">User Logout</MenuItem>
                  <MenuItem value="VEHICLE_CREATED">Vehicle Created</MenuItem>
                  <MenuItem value="VEHICLE_UPDATED">Vehicle Updated</MenuItem>
                  <MenuItem value="CLIENT_CREATED">Client Created</MenuItem>
                  <MenuItem value="CLIENT_UPDATED">Client Updated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Job</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(log.created_at), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action.replace('_', ' ')}
                      color={getActionColor(log.action) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.first_name} {log.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{log.username}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.job_card_number ? (
                      <Typography variant="body2" color="primary">
                        {log.job_card_number}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {log.ip_address}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={pagination.pages}
          page={pagination.page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default AuditLogs;