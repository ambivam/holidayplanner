import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { format } from 'date-fns';

interface ItineraryItem {
  id: number;
  day: number;
  date: string;
  activity: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
}

interface ItineraryProps {
  tripId: string;
  startDate: string;
  endDate: string;
}

const Itinerary: React.FC<ItineraryProps> = ({ tripId, startDate, endDate }) => {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItinerary = async () => {
    try {
      const response = await axios.get(`/api/trips/${tripId}/itinerary`);
      setItems(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load itinerary');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, [tripId]);

  const handleSave = async (formData: Partial<ItineraryItem>) => {
    try {
      if (editItem?.id) {
        await axios.put(`/api/trips/${tripId}/itinerary/${editItem.id}`, formData);
      } else {
        await axios.post(`/api/trips/${tripId}/itinerary`, formData);
      }
      fetchItinerary();
      setOpen(false);
      setEditItem(null);
    } catch (err) {
      setError('Failed to save itinerary item');
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await axios.delete(`/api/trips/${tripId}/itinerary/${itemId}`);
      fetchItinerary();
    } catch (err) {
      setError('Failed to delete itinerary item');
    }
  };

  const groupByDay = (items: ItineraryItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = [];
      }
      acc[item.day].push(item);
      return acc;
    }, {} as Record<number, ItineraryItem[]>);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const groupedItems = groupByDay(items);

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Trip Itinerary</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditItem(null);
            setOpen(true);
          }}
        >
          Add Activity
        </Button>
      </Box>

      {Object.entries(groupedItems).map(([day, dayItems]) => (
        <Paper key={day} sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Day {day} - {format(new Date(dayItems[0].date), 'MMMM d, yyyy')}
          </Typography>
          <List>
            {dayItems.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => {
                        setEditItem(item);
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={item.activity}
                  secondary={
                    <>
                      {item.startTime && `${item.startTime}`}
                      {item.endTime && ` - ${item.endTime}`}
                      {item.location && ` | ${item.location}`}
                      {item.notes && <br />}
                      {item.notes}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}

      <ItineraryDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        item={editItem}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
};

interface ItineraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<ItineraryItem>) => void;
  item: ItineraryItem | null;
  startDate: string;
  endDate: string;
}

const ItineraryDialog: React.FC<ItineraryDialogProps> = ({
  open,
  onClose,
  onSave,
  item,
  startDate,
  endDate,
}) => {
  const [formData, setFormData] = useState<Partial<ItineraryItem>>(
    item || {
      day: 1,
      date: startDate,
      activity: '',
      startTime: '',
      endTime: '',
      location: '',
      notes: '',
    }
  );

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        day: 1,
        date: startDate,
        activity: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: '',
      });
    }
  }, [item, startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {item ? 'Edit Activity' : 'Add Activity'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Activity"
                  value={formData.activity}
                  onChange={(e) =>
                    setFormData({ ...formData, activity: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TimePicker
                  label="Start Time"
                  value={formData.startTime ? new Date(`2000-01-01T${formData.startTime}`) : null}
                  onChange={(time) =>
                    setFormData({
                      ...formData,
                      startTime: time ? format(time, 'HH:mm') : undefined,
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TimePicker
                  label="End Time"
                  value={formData.endTime ? new Date(`2000-01-01T${formData.endTime}`) : null}
                  onChange={(time) =>
                    setFormData({
                      ...formData,
                      endTime: time ? format(time, 'HH:mm') : undefined,
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default Itinerary;
