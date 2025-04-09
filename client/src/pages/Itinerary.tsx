import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface ItineraryItem {
  id: number;
  date: string;
  activity: string;
  location: string;
  notes: string;
}

const Itinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState({
    date: new Date(),
    activity: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchItinerary();
    }
  }, [id]);

  const fetchItinerary = async () => {
    try {
      if (!id) {
        setError('Trip ID is missing');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/trips/${id}/itinerary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
    }
  };

  const handleSubmit = async () => {
    setError(null); // Clear any previous errors

    // Validate required fields
    if (!currentItem.activity?.trim()) {
      setError('Activity is required');
      return;
    }
    if (currentItem.activity.trim().length > 255) {
      setError('Activity must be at most 255 characters');
      return;
    }

    if (!currentItem.location?.trim()) {
      setError('Location is required');
      return;
    }
    if (currentItem.location.trim().length > 255) {
      setError('Location must be at most 255 characters');
      return;
    }

    if (!currentItem.date || isNaN(currentItem.date.getTime())) {
      setError('Please select a valid date and time');
      return;
    }

    if (currentItem.notes?.length > 1000) {
      setError('Notes must be at most 1000 characters');
      return;
    }
    try {
      if (!id) {
        throw new Error('Trip ID is missing');
      }

      const method = editItem ? 'PUT' : 'POST';
      const url = editItem 
        ? `http://localhost:5000/api/trips/${id}/itinerary/${editItem.id}`
        : `http://localhost:5000/api/trips/${id}/itinerary`;

      if (!currentItem.date || !currentItem.activity || !currentItem.location) {
        throw new Error('Please fill in all required fields');
      }

      // Validate required fields first
      if (!currentItem.date || !(currentItem.date instanceof Date)) {
        throw new Error('Date is required');
      }
      if (!currentItem.activity?.trim()) {
        throw new Error('Activity is required');
      }
      if (!currentItem.location?.trim()) {
        throw new Error('Location is required');
      }

      // Prepare the request body
      const requestBody = {
        date: currentItem.date.toISOString(),
        activity: currentItem.activity.trim(),
        location: currentItem.location.trim(),
        notes: currentItem.notes?.trim() || '',
      };

      // Log request details for debugging
      console.log('Request details:', {
        url,
        method,
        body: requestBody,
        tripId: id,
        date: {
          raw: currentItem.date,
          type: typeof currentItem.date,
          isValid: currentItem.date instanceof Date,
          timestamp: currentItem.date.getTime(),
          iso: requestBody.date
        }
      });

      // Additional validation
      try {
        new Date(requestBody.date); // Validate ISO string
      } catch (error) {
        throw new Error('Invalid date format');
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Request sent:', {
        url,
        method,
        body: requestBody
      });

      const data = await response.json();
      console.log('Server response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        data
      });
      
      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          console.error('Validation errors:', data.errors);
          const formattedErrors = data.errors.map((e: any) => {
            return `${e.field}: ${e.msg} (received: ${JSON.stringify(e.value)})`;
          });
          throw new Error(formattedErrors.join('\n'));
        }
        throw new Error(data.message || 'Failed to save activity');
      }

      console.log('Successfully saved item:', data);

      await fetchItinerary();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving itinerary item:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while saving the activity'
      );
      return; // Don't close dialog on error
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      if (!id) {
        setError('Trip ID is missing');
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/trips/${id}/itinerary/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        fetchItinerary();
      }
    } catch (error) {
      console.error('Error deleting itinerary item:', error);
    }
  };

  const handleOpenDialog = (item?: ItineraryItem) => {
    setError(null); // Clear any previous errors
    if (item) {
      setEditItem(item);
      let date: Date;
      try {
        date = new Date(item.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date from item:', item.date);
          date = new Date();
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        date = new Date();
      }
      setCurrentItem({
        date,
        activity: item.activity || '',
        location: item.location || '',
        notes: item.notes || '',
      });
    } else {
      setEditItem(null);
      setCurrentItem({
        date: new Date(),
        activity: '',
        location: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
    setCurrentItem({
      date: new Date(),
      activity: '',
      location: '',
      notes: '',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Itinerary</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Activity
          </Button>
        </Box>

        <Paper>
          <List>
            {items.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Box>
                    <IconButton onClick={() => handleOpenDialog(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={item.activity}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {new Date(item.date).toLocaleString()}
                      </Typography>
                      <br />
                      <Typography component="span" variant="body2">
                        Location: {item.location}
                      </Typography>
                      {item.notes && (
                        <>
                          <br />
                          <Typography component="span" variant="body2">
                            Notes: {item.notes}
                          </Typography>
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
            {items.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No activities planned yet"
                  secondary="Click 'Add Activity' to start planning your itinerary"
                />
              </ListItem>
            )}
          </List>
        </Paper>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editItem ? 'Edit Activity' : 'Add Activity'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Date & Time *"
                  value={currentItem.date}
                  onChange={(newDate) => {
                    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
                      setCurrentItem({ ...currentItem, date: newDate });
                    } else if (newDate === null) {
                      setCurrentItem({ ...currentItem, date: new Date() });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      required: true,
                      error: Boolean(error && error.includes('date')),
                      helperText: error && error.includes('date') ? error : 'Required'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Activity"
                  value={currentItem.activity}
                  onChange={(e) => setCurrentItem({ ...currentItem, activity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={currentItem.location}
                  onChange={(e) => setCurrentItem({ ...currentItem, location: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={currentItem.notes}
                  onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editItem ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Itinerary;
