import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface Trip {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
}

const TripList: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Using token:', token);

        const response = await fetch('http://localhost:5000/api/trips', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
          throw new Error(`Failed to fetch trips: ${response.status} ${responseText}`);
        }

        const data = JSON.parse(responseText);
        setTrips(data);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchTrips();
  }, []);

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'planned':
        return 'primary';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Trips
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/trips/new')}
        >
          New Trip
        </Button>
      </Box>

      <Grid container spacing={3}>
        {trips.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" align="center">
                  No trips planned yet. Start by creating a new trip!
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          trips.map((trip) => (
            <Grid item xs={12} sm={6} md={4} key={trip.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {trip.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {new Date(trip.startDate).toLocaleDateString()} -{' '}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    color={getStatusColor(trip.status)}
                    size="small"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </>
  );
};

export default TripList;
