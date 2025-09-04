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
  Fade,
  Grow,
  Button,
  Avatar,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Work as WorkIcon,
  DirectionsCar as VehicleIcon,
  Business as ClientIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const navigate = useNavigate();

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
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats?.totalJobs || 0,
      icon: <WorkIcon />,
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Completed',
      value: stats?.completedJobs || 0,
      icon: <CompletedIcon />,
      color: 'success',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Vehicles',
      value: stats?.totalVehicles || 0,
      icon: <VehicleIcon />,
      color: 'info',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Clients',
      value: stats?.totalClients || 0,
      icon: <ClientIcon />,
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <Box>
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="700" gutterBottom>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back! Here's what's happening with your vehicle installations today.
          </Typography>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grow in timeout={600 + index * 100} key={card.title}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: '100%',
                  background: card.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        width: 56,
                        height: 56,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Chip
                      label={card.change}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 600,
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </Box>
                  <Typography variant="h3" fontWeight="700" gutterBottom>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {card.title}
                  </Typography>
                  <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, opacity: 0.1 }}>
                    {card.icon}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grow>
        ))}
      </Grid>

      {/* Recent Jobs and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Fade in timeout={800}>
            <Paper 
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="600">
                  Recent Jobs
                </Typography>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/jobs')}
                  sx={{ borderRadius: 2 }}
                >
                  View All
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {recentJobs.map((job, index) => (
                  <Fade in timeout={900 + index * 100} key={job.id}>
                    <ListItem 
                      sx={{ 
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight="600">
                              {job.job_card_number}
                            </Typography>
                            <Chip
                              icon={getStatusIcon(job.status)}
                              label={job.status.replace('_', ' ').toUpperCase()}
                              color={getStatusColor(job.status) as any}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {job.job_type.toUpperCase()} • {job.client_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {job.vehicle_make} {job.vehicle_model} • {new Date(job.scheduled_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </Fade>
                ))}
              </List>
            </Paper>
          </Fade>
        </Grid>

        <Grid item xs={12} md={4}>
          <Fade in timeout={1000}>
            <Paper 
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                height: 'fit-content',
              }}
            >
              <Typography variant="h5" fontWeight="600" gutterBottom>
                Quick Actions
              </Typography>
              <List sx={{ p: 0 }}>
                {[
                  { text: 'Create New Job', icon: <AddIcon />, path: '/jobs/create', color: 'primary' },
                  { text: 'Add Vehicle', icon: <VehicleIcon />, path: '/vehicles', color: 'info' },
                  { text: 'Add Client', icon: <ClientIcon />, path: '/clients', color: 'secondary' },
                  { text: 'View Audit Logs', icon: <AssessmentIcon />, path: '/audit', color: 'warning' },
                ].map((action, index) => (
                  <Fade in timeout={1100 + index * 100} key={action.text}>
                    <ListItem 
                      button
                      onClick={() => navigate(action.path)}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: `${action.color}.light`,
                          color: `${action.color}.contrastText`,
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {action.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={action.text}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      <ArrowForwardIcon fontSize="small" />
                    </ListItem>
                  </Fade>
                ))}
              </List>
            </Paper>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;