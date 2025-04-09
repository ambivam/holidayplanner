import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { parseISO, isValid, format } from 'date-fns';
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
  date: string | Date;
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
    console.log('Field change:', { name, value, type: typeof value });
    
    // Ensure date is always a Date object
    if (name === 'date' && typeof value === 'string') {
      value = new Date(value);
    }

    setCurrentItem(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const fetchItinerary = async (): Promise<void> => {
    if (!id) {
      console.error('No trip ID available');
      return;
    }

    try {
      console.log('Fetching itinerary for trip:', id);
      const response = await fetch(`http://localhost:5000/api/trips/${id}/itinerary`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log('Received itinerary data:', {
        raw: data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        type: typeof data
      });

      if (!response.ok) {
        console.error('Failed to fetch itinerary:', {
          status: response.status,
          data,
          headers: Object.fromEntries(response.headers.entries())
        });
        setErrors({ submit: data.message || 'Failed to fetch itinerary' });
        return;
      }

      // Ensure data is an array and process each item
      const itemsArray = Array.isArray(data) ? data.map(item => ({
        ...item,
        date: new Date(item.date) // Convert date strings to Date objects
      })) : [];

      console.log('Processed items:', {
        count: itemsArray.length,
        items: itemsArray.map(item => ({
          id: item.id,
          date: item.date,
          activity: item.activity,
          dateValid: item.date instanceof Date && !isNaN(item.date.getTime())
        }))
      });

      setItems(itemsArray);
      console.log('Updated items state:', {
        newItems: itemsArray,
        count: itemsArray.length
      });
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setErrors({ submit: 'Failed to fetch itinerary items' });
    }
  };

  useEffect(() => {
    console.log('Itinerary component mounted or id changed:', id);
    fetchItinerary();
  }, [id]);

  // Add effect to log items state changes
  useEffect(() => {
    console.log('Items state updated:', items);
  }, [items]);

  const handleCloseDialog = () => {
    setLoading(false);
    setOpenDialog(false);
    setEditItem(null);
    setCurrentItem({
      date: new Date(),
      activity: '',
      location: '',
      notes: ''
    });
    setErrors({});

    // Refresh the list after closing dialog
    fetchItinerary();
  };

  const handleError = () => {
    setLoading(false);
    setOpenDialog(false);
    // Keep the form data but show errors
    // Refresh the list to ensure it's in sync
    fetchItinerary();
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

      // Validate required fields
      const validationErrors: { [key: string]: string } = {};
      
      if (!(currentItem.date instanceof Date) || isNaN(currentItem.date.getTime())) {
        validationErrors.date = 'Please select a valid date';
      }
      
      if (!currentItem.activity?.trim()) {
        validationErrors.activity = 'Activity is required';
      }
      
      if (!currentItem.location?.trim()) {
        validationErrors.location = 'Location is required';
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Ensure we have a valid date
      let dateToSend: Date;
      try {
        if (currentItem.date instanceof Date) {
          dateToSend = currentItem.date;
        } else {
          dateToSend = parseISO(currentItem.date as string);
        }

        if (!isValid(dateToSend)) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.error('Date validation error:', error);
        setErrors({ date: 'Please select a valid date' });
        setLoading(false);
        return;
      }

      // Format date as ISO string
      const formattedDate = format(dateToSend, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      
      console.log('Date processing:', {
        originalDate: currentItem.date,
        dateToSend,
        formattedDate,
        isValid: isValid(dateToSend),
        timestamp: dateToSend.getTime(),
        type: typeof currentItem.date,
        instanceOfDate: currentItem.date instanceof Date
      });
      
      const requestData = {
        date: formattedDate,
        activity: currentItem.activity.trim(),
        location: currentItem.location.trim(),
        notes: currentItem.notes?.trim() || '',
      };

      console.log('Sending date:', {
        original: currentItem.date,
        parsed: dateToSend,
        formatted: requestData.date
      });

      // Log request data for debugging
      console.log('Request data:', {
        ...requestData,
        rawDate: currentItem.date,
        dateValid: !isNaN(currentItem.date.getTime())
      });

      console.log('Sending request:', {
        url: apiUrl,
        method,
        requestData,
        dateType: typeof requestData.date,
        dateValid: !isNaN(new Date(requestData.date).getTime())
      });

    const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
      });

      interface ErrorResponse {
        errors?: Array<{ field: string; msg: string; value?: any; location?: string }>;
        field?: string;
        message?: string;
      }

      let parsedData: ItineraryItem | ErrorResponse | null = null;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        if (responseText) {
          parsedData = JSON.parse(responseText);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        setErrors({ submit: error instanceof Error ? error.message : 'Failed to parse server response' });
        setLoading(false);
        return;
      }

      if (!response.ok || !parsedData) {
        const errorData = parsedData as ErrorResponse;
        console.log('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData,
          headers: response.headers
        });
        
        if (errorData?.errors?.length) {
          // Handle validation errors
          const newErrors: { [key: string]: string } = {};
          errorData.errors.forEach(err => {
            if (err.field) {
              newErrors[err.field] = `${err.msg} (received: ${JSON.stringify(err.value)})`;
              console.log(`Field error for ${err.field}:`, err);
            }
          });
          setErrors(newErrors);
        } else if (errorData?.field) {
          setErrors({ [errorData.field]: errorData.message || 'Invalid field' });
        } else {
          setErrors({ submit: errorData?.message || 'Failed to save itinerary item' });
        }
        handleError();
        return;
      }
      
      // At this point, parsedData is guaranteed to be ItineraryItem
      const responseData = parsedData as ItineraryItem;
      console.log('Successfully saved item:', responseData);

      // Clear any existing errors on success
      setErrors({});

      // Close dialog first
      handleCloseDialog();

      // Then refresh the list to ensure we have the latest data
      await fetchItinerary();

      // Log the final state
      console.log('Final items state after refresh:', items);
    } catch (error) {
      console.error('Error saving itinerary item:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save itinerary item' });
      handleError();
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

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          aria-labelledby="itinerary-dialog-title"
          disablePortal={false}
          keepMounted={false}
          disableEnforceFocus
          disableRestoreFocus
        >
          <DialogTitle id="itinerary-dialog-title">
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
