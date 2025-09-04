import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Add as AddIcon,
  CameraAlt as CameraIcon,
  Assignment as TaskIcon,
  Build as InspectionIcon,
  AssignmentTurnedIn as SignOffIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface JobDetails {
  id: string;
  job_card_number: string;
  job_type: string;
  work_type: string;
  product_type: string;
  status: string;
  description: string;
  device_serial_imei: string;
  device_sim_number: string;
  tablet_serial_imei: string;
  tablet_sim_number: string;
  scheduled_date: string;
  scheduled_time: string;
  start_time: string;
  finish_time: string;
  client_name: string;
  client_contact: string;
  site_name: string;
  site_address: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  fleet_number: string;
  registration: string;
  km_or_hours: number;
  technician_first_name: string;
  technician_last_name: string;
  images: any[];
  tasks: any[];
  preInspection: any;
  postInspection: any;
  signOffs: any[];
}

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [inspectionType, setInspectionType] = useState<'pre' | 'post'>('pre');
  const [inspectionData, setInspectionData] = useState<any>({});

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/jobs/${id}`);
      setJob(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async () => {
    try {
      await axios.post(`/api/jobs/${id}/start`);
      fetchJobDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start job');
    }
  };

  const handleCompleteJob = async () => {
    try {
      await axios.post(`/api/jobs/${id}/complete`);
      fetchJobDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete job');
    }
  };

  const handleAddTask = async () => {
    try {
      await axios.post(`/api/jobs/${id}/tasks`, {
        taskDescription: newTask,
      });
      setNewTask('');
      setTaskDialogOpen(false);
      fetchJobDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await axios.put(`/api/jobs/${id}/tasks/${taskId}`);
      fetchJobDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete task');
    }
  };

  const handleInspection = async () => {
    try {
      const endpoint = inspectionType === 'pre' 
        ? `/api/vehicles/${job?.id}/pre-inspection`
        : `/api/vehicles/${job?.id}/post-inspection`;
      
      await axios.post(endpoint, inspectionData);
      setInspectionDialogOpen(false);
      setInspectionData({});
      fetchJobDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save inspection');
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

  const canStartJob = () => {
    return job?.status === 'pending' && 
           user?.role === 'installer' && 
           job?.technician_first_name === user?.firstName;
  };

  const canCompleteJob = () => {
    return job?.status === 'in_progress' && 
           user?.role === 'installer' && 
           job?.technician_first_name === user?.firstName;
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
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!job) {
    return (
      <Alert severity="error">
        Job not found
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{job.job_card_number}</Typography>
        <Box>
          {canStartJob() && (
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={handleStartJob}
              sx={{ mr: 1 }}
            >
              Start Job
            </Button>
          )}
          {canCompleteJob() && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={handleCompleteJob}
            >
              Complete Job
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Job Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Job Type
                  </Typography>
                  <Typography variant="body1">
                    {job.job_type.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Work Type
                  </Typography>
                  <Typography variant="body1">
                    {job.work_type.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={job.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(job.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Product Type
                  </Typography>
                  <Typography variant="body1">
                    {job.product_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {job.description || 'No description provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Client & Vehicle Information */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client & Vehicle Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Client
                  </Typography>
                  <Typography variant="body1">{job.client_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.client_contact}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Site
                  </Typography>
                  <Typography variant="body1">{job.site_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.site_address}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle
                  </Typography>
                  <Typography variant="body1">
                    {job.vehicle_make} {job.vehicle_model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.fleet_number} • {job.registration}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Technician
                  </Typography>
                  <Typography variant="body1">
                    {job.technician_first_name} {job.technician_last_name}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Actions
              </Typography>
              <List>
                <ListItem button onClick={() => setActiveTab(1)}>
                  <TaskIcon sx={{ mr: 2 }} />
                  <ListItemText primary="Tasks" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab(2)}>
                  <CameraIcon sx={{ mr: 2 }} />
                  <ListItemText primary="Images" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab(3)}>
                  <InspectionIcon sx={{ mr: 2 }} />
                  <ListItemText primary="Inspections" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab(4)}>
                  <SignOffIcon sx={{ mr: 2 }} />
                  <ListItemText primary="Sign-offs" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Content */}
      <Box sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="Images" />
          <Tab label="Inspections" />
          <Tab label="Sign-offs" />
        </Tabs>

        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Tasks</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setTaskDialogOpen(true)}
              >
                Add Task
              </Button>
            </Box>
            <List>
              {job.tasks.map((task) => (
                <ListItem key={task.id} divider>
                  <ListItemText
                    primary={task.task_description}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(task.created_at).toLocaleString()}
                        </Typography>
                        {task.completed && (
                          <Typography variant="caption" color="success.main" sx={{ ml: 2 }}>
                            Completed: {new Date(task.completed_at).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {!task.completed && (
                    <Button
                      size="small"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      Mark Complete
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Images
            </Typography>
            <Grid container spacing={2}>
              {job.images.map((image) => (
                <Grid item xs={12} sm={6} md={3} key={image.id}>
                  <Card>
                    <CardContent>
                      <img
                        src={`/api/images/serve/${image.file_name}`}
                        alt={image.image_type}
                        style={{ width: '100%', height: 200, objectFit: 'cover' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {image.image_type.replace('_', ' ').toUpperCase()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Inspections</Typography>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setInspectionType('pre');
                    setInspectionDialogOpen(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  Pre-Inspection
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setInspectionType('post');
                    setInspectionDialogOpen(true);
                  }}
                >
                  Post-Inspection
                </Button>
              </Box>
            </Box>
            {/* Inspection content would go here */}
          </Box>
        )}

        {activeTab === 4 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sign-offs
            </Typography>
            <List>
              {job.signOffs.map((signOff) => (
                <ListItem key={signOff.id} divider>
                  <ListItemText
                    primary={`${signOff.signer_name} ${signOff.signer_surname}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {signOff.sign_off_type.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(signOff.signed_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)}>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Description"
            fullWidth
            variant="outlined"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTask} variant="contained">
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inspection Dialog */}
      <Dialog 
        open={inspectionDialogOpen} 
        onClose={() => setInspectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {inspectionType === 'pre' ? 'Pre-Inspection' : 'Post-Inspection'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Windscreen
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={inspectionData.windscreen_cracked || false}
                onChange={(e) => setInspectionData({
                  ...inspectionData,
                  windscreen_cracked: e.target.checked
                })}
              />
            }
            label="Cracked"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={inspectionData.windscreen_chipped || false}
                onChange={(e) => setInspectionData({
                  ...inspectionData,
                  windscreen_chipped: e.target.checked
                })}
              />
            }
            label="Chipped"
          />
          {/* More inspection fields would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInspectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInspection} variant="contained">
            Save Inspection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobDetails;