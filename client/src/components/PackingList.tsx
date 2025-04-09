import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  Grid,
  Box,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

interface PackingItem {
  id: number;
  category: string;
  item: string;
  quantity: number;
  isPacked: boolean;
  notes?: string;
}

interface PackingListProps {
  tripId: string;
}

const categories = [
  'clothing',
  'toiletries',
  'electronics',
  'documents',
  'other',
];

const PackingList: React.FC<PackingListProps> = ({ tripId }) => {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, PackingItem[]>>({});
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<PackingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const fetchPackingList = async () => {
    try {
      const response = await axios.get(`/api/trips/${tripId}/packing-list`);
      setItems(response.data.items);
      setGroupedItems(response.data.groupedItems);
      setLoading(false);
    } catch (err) {
      setError('Failed to load packing list');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingList();
  }, [tripId]);

  const handleSave = async (formData: Partial<PackingItem>) => {
    try {
      if (editItem?.id) {
        await axios.put(`/api/trips/${tripId}/packing-list/${editItem.id}`, formData);
      } else {
        await axios.post(`/api/trips/${tripId}/packing-list`, formData);
      }
      fetchPackingList();
      setOpen(false);
      setEditItem(null);
    } catch (err) {
      setError('Failed to save packing item');
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await axios.delete(`/api/trips/${tripId}/packing-list/${itemId}`);
      fetchPackingList();
    } catch (err) {
      setError('Failed to delete packing item');
    }
  };

  const handleTogglePacked = async (itemId: number) => {
    try {
      await axios.patch(`/api/trips/${tripId}/packing-list/${itemId}/toggle`);
      fetchPackingList();
    } catch (err) {
      setError('Failed to update item status');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const packedCount = items.filter((item) => item.isPacked).length;
  const progress = (packedCount / items.length) * 100 || 0;

  return (
    <div>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h6">Packing List</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={() => {
                setEditItem(null);
                setOpen(true);
              }}
            >
              Add Item
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {packedCount} of {items.length} items packed
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" />
          {categories.map((category) => (
            <Tab
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
            />
          ))}
        </Tabs>
      </Paper>

      <Paper>
        <List>
          {(activeTab === 0 ? items : groupedItems[categories[activeTab - 1]] || []).map(
            (item) => (
              <ListItem key={item.id} divider>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={item.isPacked}
                    onChange={() => handleTogglePacked(item.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      style={{
                        textDecoration: item.isPacked ? 'line-through' : 'none',
                      }}
                    >
                      {item.item}
                    </Typography>
                  }
                  secondary={
                    <>
                      {item.quantity > 1 && `Quantity: ${item.quantity}`}
                      {item.notes && (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          component="div"
                        >
                          {item.notes}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
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
                </ListItemSecondaryAction>
              </ListItem>
            )
          )}
        </List>
      </Paper>

      <PackingItemDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditItem(null);
        }}
        onSave={handleSave}
        item={editItem}
      />
    </div>
  );
};

interface PackingItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<PackingItem>) => void;
  item: PackingItem | null;
}

const PackingItemDialog: React.FC<PackingItemDialogProps> = ({
  open,
  onClose,
  onSave,
  item,
}) => {
  const [formData, setFormData] = useState<Partial<PackingItem>>(
    item || {
      category: 'clothing',
      item: '',
      quantity: 1,
      isPacked: false,
      notes: '',
    }
  );

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        category: 'clothing',
        item: '',
        quantity: 1,
        isPacked: false,
        notes: '',
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {item ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                required
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Item"
                value={formData.item}
                onChange={(e) =>
                  setFormData({ ...formData, item: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="number"
                label="Quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1 }}
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
  );
};

export default PackingList;
