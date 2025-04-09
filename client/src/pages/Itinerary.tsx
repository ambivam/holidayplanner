import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
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
  notes?: string;
}

interface CurrentItem {
  date: Date;
  activity: string;
  location: string;
  notes: string;
}

const Itinerary = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [currentItem, setCurrentItem] = useState<CurrentItem>({
    date: new Date(),
    activity: '',
    location: '',
    notes: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'activity':
        if (!value?.trim()) return 'Activity is required';
        if (value.trim().length > 255) return 'Activity must be at most 255 characters';
        break;
      case 'location':
        if (!value?.trim()) return 'Location is required';
        if (value.trim().length > 255) return 'Location must be at most 255 characters';
        break;
      case 'date':
        if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
          return 'Please select a valid date and time';
        }
        break;
      case 'notes':
        if (value?.length > 1000) return 'Notes must be at most 1000 characters';
        break;
    }
    return '';
  };

  const handleFieldChange = (name: string, value: any): void => {
    setCurrentItem(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const fetchItinerary = async (): Promise<void> => {
    if (!id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/trips/${id}/itinerary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ submit: data.message || 'Failed to fetch itinerary' });
        return;
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setErrors({ submit: 'Failed to fetch itinerary items' });
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, [id]);

  const handleCloseDialog = (): void => {
    setOpenDialog(false);
    setEditItem(null);
    setCurrentItem({
      date: new Date(),
      activity: '',
      location: '',
      notes: ''
    });
    setErrors({});
  };

  const handleSubmit = async (): Promise<void> => {
    setErrors({});
    setLoading(true);

    try {
      // Validate all fields
      const newErrors: { [key: string]: string } = {};
      Object.entries(currentItem).forEach(([key, value]) => {
        const error = validateField(key, value);
        if (error) newErrors[key] = error;
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      if (!id) {
        throw new Error('Trip ID is missing');
      }

      const method = editItem ? 'PUT' : 'POST';
      const apiUrl = editItem 
        ? `http://localhost:5000/api/trips/${id}/itinerary/${editItem.id}`
        : `http://localhost:5000/api/trips/${id}/itinerary`;

      // Prepare the request body
      const requestData = {
        tripId: parseInt(id),
        date: currentItem.date.toISOString(),
        activity: currentItem.activity.trim(),
        location: currentItem.location.trim(),
        notes: currentItem.notes?.trim() || '',
      };

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setErrors({ submit: data.message || 'Failed to save itinerary item' });
        }
        setLoading(false);
        return;
      }

      // Update local state
      if (editItem) {
        setItems(items.map(item => item.id === editItem.id ? data : item));
      } else {
        setItems([...items, data]);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving itinerary item:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save itinerary item' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: number): Promise<void> => {
    try {
      if (!id) {
        setErrors({ submit: 'Trip ID is missing' });
        return;
      }

      const response = await fetch(`http://localhost:5000/api/trips/${id}/itinerary/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ submit: data.message || 'Failed to delete itinerary item' });
        return;
      }

      // Update local state
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting itinerary item:', error);
      setErrors({ submit: 'Failed to delete itinerary item' });
    }
  };

  const handleOpenDialog = (item?: ItineraryItem): void => {
    setErrors({});
    if (item) {
      setEditItem(item);
      setCurrentItem({
        date: new Date(item.date),
        activity: item.activity,
        location: item.location,
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
            {errors.submit && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors(prev => ({ ...prev, submit: '' }))}>
                {errors.submit}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Date & Time *"
                  value={currentItem.date}
                  onChange={(newDate) => {
                    handleFieldChange('date', newDate instanceof Date ? newDate : new Date());
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      required: true,
                      error: Boolean(errors.date),
                      helperText: errors.date || 'Required'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Activity *"
                  value={currentItem.activity}
                  onChange={(e) => handleFieldChange('activity', e.target.value)}
                  error={Boolean(errors.activity)}
                  helperText={errors.activity || 'Required'}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location *"
                  value={currentItem.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  error={Boolean(errors.location)}
                  helperText={errors.location || 'Required'}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={currentItem.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  error={Boolean(errors.notes)}
                  helperText={errors.notes}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={loading || Object.values(errors).some(error => error !== '')}
            >
              {loading ? 'Saving...' : editItem ? 'Save' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Itinerary;
