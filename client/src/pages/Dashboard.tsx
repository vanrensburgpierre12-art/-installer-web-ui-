import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Work as WorkIcon,
  DirectionsCar as VehicleIcon,
  Business as ClientIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface DashboardStats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  totalVehicles: number;
  totalClients: number;
}

interface RecentJob {
  id: string;
  job_card_number: string;
  job_type: string;
  status: string;
  client_name: string;
  vehicle_make: string;
  vehicle_model: string;
  scheduled_date: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and recent jobs in parallel
      const [statsResponse, jobsResponse] = await Promise.all([
        axios.get('/api/jobs/stats'),
        axios.get('/api/jobs?limit=5')
      ]);

      setStats(statsResponse.data);
      setRecentJobs(jobsResponse.data.jobs);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CompletedIcon />;
      case 'pending':
        return <PendingIcon />;
      default:
        return <WorkIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WorkIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats?.totalJobs || 0}</Typography>
                  <Typography color="text.secondary">Total Jobs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CompletedIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats?.completedJobs || 0}</Typography>
                  <Typography color="text.secondary">Completed</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <VehicleIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats?.totalVehicles || 0}</Typography>
                  <Typography color="text.secondary">Vehicles</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ClientIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{stats?.totalClients || 0}</Typography>
                  <Typography color="text.secondary">Clients</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Jobs */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Jobs
            </Typography>
            <List>
              {recentJobs.map((job) => (
                <ListItem key={job.id} divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1">
                          {job.job_card_number}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(job.status)}
                          label={job.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(job.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {job.job_type.toUpperCase()} • {job.client_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {job.vehicle_make} {job.vehicle_model} • {new Date(job.scheduled_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              <ListItem button>
                <ListItemText primary="Create New Job" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Add Vehicle" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Add Client" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="View Audit Logs" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;