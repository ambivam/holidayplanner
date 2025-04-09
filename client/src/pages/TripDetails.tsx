import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

interface Trip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  totalBudget: number;
}

const TripDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5000/api/trips/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch trip details');
        }

        const data = await response.json();
        setTrip(data);
      } catch (error) {
        console.error('Error fetching trip details:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch trip details');
        setTimeout(() => navigate('/trips'), 3000); // Redirect after 3 seconds
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading trip details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Redirecting to trips page...
        </Typography>
      </Box>
    );
  }

  if (!trip) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Trip not found</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trips')}
          sx={{ mb: 2 }}
        >
          Back to Trips
        </Button>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4" component="h1">
              {trip.title}
            </Typography>
          </Grid>
          <Grid item>
            <Chip
              label={trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              color={
                trip.status === 'planned'
                  ? 'primary'
                  : trip.status === 'ongoing'
                  ? 'success'
                  : trip.status === 'completed'
                  ? 'info'
                  : 'error'
              }
            />
          </Grid>
        </Grid>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" />
          <Tab label="Itinerary" />
          <Tab label="Budget" />
          <Tab label="Packing List" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Trip Details
              </Typography>
              <Typography paragraph>
                <strong>Dates:</strong>{' '}
                {new Date(trip.startDate).toLocaleDateString()} -{' '}
                {new Date(trip.endDate).toLocaleDateString()}
              </Typography>
              <Typography paragraph>
                <strong>Description:</strong> {trip.description}
              </Typography>
              <Typography>
                <strong>Total Budget:</strong> ${trip.totalBudget}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Weather Forecast
              </Typography>
              {/* TODO: Add weather forecast component */}
              <Typography color="textSecondary">
                Weather forecast will be displayed here
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* TODO: Add itinerary component */}
          <Typography color="textSecondary">
            Itinerary will be displayed here
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {/* TODO: Add budget component */}
          <Typography color="textSecondary">
            Budget details will be displayed here
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {/* TODO: Add packing list component */}
          <Typography color="textSecondary">
            Packing list will be displayed here
          </Typography>
        </TabPanel>
      </Paper>
    </>
  );
};

export default TripDetails;
