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
  Chip,
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
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

interface Job {
  id: string;
  job_card_number: string;
  job_type: string;
  work_type: string;
  status: string;
  client_name: string;
  site_name: string;
  vehicle_make: string;
  vehicle_model: string;
  fleet_number: string;
  scheduled_date: string;
  start_time: string;
  finish_time: string;
  technician_first_name: string;
  technician_last_name: string;
}

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    jobType: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [pagination.page, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.jobType && { jobType: filters.jobType }),
      });

      const response = await axios.get(`/api/jobs?${params}`);
      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, job: Job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleViewJob = () => {
    if (selectedJob) {
      navigate(`/jobs/${selectedJob.id}`);
    }
    handleMenuClose();
  };

  const handleStartJob = async () => {
    if (selectedJob) {
      try {
        await axios.post(`/api/jobs/${selectedJob.id}/start`);
        fetchJobs();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to start job');
      }
    }
    handleMenuClose();
  };

  const handleCompleteJob = async () => {
    if (selectedJob) {
      try {
        await axios.post(`/api/jobs/${selectedJob.id}/complete`);
        fetchJobs();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to complete job');
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const canStartJob = (job: Job) => {
    return job.status === 'pending' && 
           user?.role === 'installer' && 
           job.technician_first_name === user?.firstName;
  };

  const canCompleteJob = (job: Job) => {
    return job.status === 'in_progress' && 
           user?.role === 'installer' && 
           job.technician_first_name === user?.firstName;
  };

  if (loading) {
    return <LoadingSpinner message="Loading jobs..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" fontWeight="700" gutterBottom>
            Jobs Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage vehicle installation jobs
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/jobs/create')}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease-in-out',
          }}
        >
          Create New Job
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by job number, client, vehicle..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="requires_approval">Requires Approval</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={filters.jobType}
                  onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                  label="Job Type"
                >
                  <MenuItem value="">All</MenuItem>
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
          </Grid>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Card #</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Scheduled Date</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {job.job_card_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {job.job_type.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.work_type.replace('_', ' ')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={job.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(job.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{job.client_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.site_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {job.vehicle_make} {job.vehicle_model}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.fleet_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(job.scheduled_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {job.technician_first_name} {job.technician_last_name}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, job)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewJob}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedJob && canStartJob(selectedJob) && (
          <MenuItem onClick={handleStartJob}>
            <StartIcon sx={{ mr: 1 }} />
            Start Job
          </MenuItem>
        )}
        {selectedJob && canCompleteJob(selectedJob) && (
          <MenuItem onClick={handleCompleteJob}>
            <CompleteIcon sx={{ mr: 1 }} />
            Complete Job
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Jobs;