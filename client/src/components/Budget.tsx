import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format } from 'date-fns';

interface BudgetItem {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  isPaid: boolean;
  notes?: string;
}

interface BudgetSummary {
  total: number;
  totalPaid: number;
  remaining: number;
}

interface BudgetProps {
  tripId: string;
  totalBudget: number;
}

const categories = [
  'accommodation',
  'transportation',
  'food',
  'activities',
  'shopping',
  'other',
];

const Budget: React.FC<BudgetProps> = ({ tripId, totalBudget }) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({
    total: 0,
    totalPaid: 0,
    remaining: totalBudget,
  });
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBudget = async () => {
    try {
      const response = await axios.get(`/api/trips/${tripId}/budget`);
      setItems(response.data.items);
      setSummary(response.data.summary);
      setLoading(false);
    } catch (err) {
      setError('Failed to load budget');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [tripId]);

  const handleSave = async (formData: Partial<BudgetItem>) => {
    try {
      if (editItem?.id) {
        await axios.put(`/api/trips/${tripId}/budget/${editItem.id}`, formData);
      } else {
        await axios.post(`/api/trips/${tripId}/budget`, formData);
      }
      fetchBudget();
      setOpen(false);
      setEditItem(null);
    } catch (err) {
      setError('Failed to save budget item');
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await axios.delete(`/api/trips/${tripId}/budget/${itemId}`);
      fetchBudget();
    } catch (err) {
      setError('Failed to delete budget item');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const budgetProgress = (summary.total / totalBudget) * 100;

  return (
    <div>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Total Budget
                </Typography>
                <Typography variant="h6">${totalBudget}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Spent
                </Typography>
                <Typography variant="h6">${summary.total}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Remaining
                </Typography>
                <Typography
                  variant="h6"
                  color={summary.remaining < 0 ? 'error' : 'inherit'}
                >
                  ${summary.remaining}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budgetProgress, 100)}
                  color={budgetProgress > 100 ? 'error' : 'primary'}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Expenses</Typography>
            <Button
              variant="contained"
              onClick={() => {
                setEditItem(null);
                setOpen(true);
              }}
            >
              Add Expense
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {item.category.charAt(0).toUpperCase() +
                        item.category.slice(1)}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">${item.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.isPaid ? 'Paid' : 'Unpaid'}
                        color={item.isPaid ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditItem(item);
                          setOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <BudgetDialog
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

interface BudgetDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<BudgetItem>) => void;
  item: BudgetItem | null;
}

const BudgetDialog: React.FC<BudgetDialogProps> = ({
  open,
  onClose,
  onSave,
  item,
}) => {
  const [formData, setFormData] = useState<Partial<BudgetItem>>(
    item || {
      category: 'other',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      isPaid: false,
      notes: '',
    }
  );

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        category: 'other',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        isPaid: false,
        notes: '',
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {item ? 'Edit Expense' : 'Add Expense'}
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
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Amount"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={formData.date ? new Date(formData.date) : null}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      date: date ? date.toISOString().split('T')[0] : '',
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Status"
                  value={formData.isPaid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPaid: e.target.value === 'true',
                    })
                  }
                >
                  <MenuItem value="false">Unpaid</MenuItem>
                  <MenuItem value="true">Paid</MenuItem>
                </TextField>
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

export default Budget;
