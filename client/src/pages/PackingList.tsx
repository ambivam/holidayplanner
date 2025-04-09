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
  Checkbox,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface PackingItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  packed: boolean;
  notes: string;
}

const categories = [
  'Clothing',
  'Electronics',
  'Toiletries',
  'Documents',
  'Accessories',
  'Other',
];

const PackingList: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<PackingItem | null>(null);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    category: '',
    quantity: '1',
    notes: '',
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPackingList();
  }, [tripId]);

  const fetchPackingList = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/trips/${tripId}/packing-list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching packing list:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const method = editItem ? 'PUT' : 'POST';
      const url = editItem 
        ? `http://localhost:5000/api/trips/${tripId}/packing-list/${editItem.id}`
        : `http://localhost:5000/api/trips/${tripId}/packing-list`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...currentItem,
          quantity: parseInt(currentItem.quantity),
          packed: editItem ? editItem.packed : false,
        }),
      });

      if (response.ok) {
        fetchPackingList();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving packing item:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/trips/${tripId}/packing-list/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        fetchPackingList();
      }
    } catch (error) {
      console.error('Error deleting packing item:', error);
    }
  };

  const handleTogglePacked = async (id: number, packed: boolean) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/trips/${tripId}/packing-list/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ packed: !packed }),
        }
      );

      if (response.ok) {
        fetchPackingList();
      }
    } catch (error) {
      console.error('Error updating packing item:', error);
    }
  };

  const handleOpenDialog = (item?: PackingItem) => {
    if (item) {
      setEditItem(item);
      setCurrentItem({
        name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        notes: item.notes,
      });
    } else {
      setEditItem(null);
      setCurrentItem({
        name: '',
        category: '',
        quantity: '1',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditItem(null);
    setCurrentItem({
      name: '',
      category: '',
      quantity: '1',
      notes: '',
    });
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'packed') return item.packed;
    if (filter === 'unpacked') return !item.packed;
    return true;
  });

  const progress = items.length > 0
    ? (items.filter(item => item.packed).length / items.length) * 100
    : 0;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>Packing Progress</Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">
            {items.filter(item => item.packed).length} of {items.length} items packed
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', mr: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {progress.toFixed(0)}%
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Packing List</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All Items</MenuItem>
              <MenuItem value="packed">Packed</MenuItem>
              <MenuItem value="unpacked">Unpacked</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <Paper>
        <List>
          {filteredItems.map((item) => (
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
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={item.packed}
                  onChange={() => handleTogglePacked(item.id, item.packed)}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      textDecoration: item.packed ? 'line-through' : 'none',
                      color: item.packed ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {item.name} ({item.quantity})
                  </Typography>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      Category: {item.category}
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
          {filteredItems.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  filter === 'all'
                    ? "No items in your packing list"
                    : filter === 'packed'
                    ? "No packed items"
                    : "No unpacked items"
                }
                secondary={
                  filter === 'all'
                    ? "Click 'Add Item' to start your packing list"
                    : "Adjust the filter to see other items"
                }
              />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editItem ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={currentItem.category}
                  label="Category"
                  onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
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
  );
};

export default PackingList;
