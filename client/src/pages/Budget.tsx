import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  FormControl,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface BudgetItem {
  id: number;
  category: string;
  description: string;
  amount: string;
  date: string;
}

interface TripBudget {
  totalBudget: number;
  spent: number;
  remaining: number;
  items: BudgetItem[];
}

const categories = [
  'Accommodation',
  'Transportation',
  'Food',
  'Activities',
  'Shopping',
  'Other',
];

const Budget: React.FC = () => {
  const { id: tripId } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<TripBudget>({
    totalBudget: 0,
    spent: 0,
    remaining: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [currentItem, setCurrentItem] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setError('Trip ID is missing');
      return;
    }
    fetchBudget();
  }, [tripId]);

  const fetchBudget = async () => {
    if (!tripId) {
      setError('Trip ID is missing');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/trips/${tripId}/budget`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch budget');
      }

      setBudget({
        totalBudget: data.totalBudget || 0,
        spent: data.spent || 0,
        remaining: data.remaining || 0,
        items: data.items || [],
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      setError('Failed to fetch budget');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    try {
      if (!tripId) {
        setError('Trip ID is missing');
        return;
      }

      // Validate required fields
      if (!currentItem.category) {
        setError('Category is required');
        return;
      }
      if (!currentItem.description) {
        setError('Description is required');
        return;
      }
      if (!currentItem.amount || parseFloat(currentItem.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (!currentItem.date) {
        setError('Date is required');
        return;
      }

      const method = editItem ? 'PUT' : 'POST';
      const url = editItem 
        ? `http://localhost:5000/api/trips/${tripId}/budget/${editItem.id}`
        : `http://localhost:5000/api/trips/${tripId}/budget`;

      // Convert date to ISO string format
      setError(null);
      
      // Validate category
      if (!currentItem.category?.trim()) {
        setError('Category is required');
        return;
      }

      // Validate description
      if (!currentItem.description?.trim()) {
        setError('Description is required');
        return;
      }

      // Validate all fields
      if (!currentItem.category?.trim()) {
        setError('Category is required');
        return;
      }

      if (!currentItem.description?.trim()) {
        setError('Description is required');
        return;
      }

      if (!currentItem.date) {
        setError('Date is required');
        return;
      }

      const date = new Date(currentItem.date);
      if (isNaN(date.getTime())) {
        setError('Invalid date format');
        return;
      }

      if (!currentItem.amount) {
        setError('Amount is required');
        return;
      }

      const numericAmount = parseFloat(currentItem.amount);
      console.log('Validating amount:', {
        raw: currentItem.amount,
        parsed: numericAmount,
        isNaN: isNaN(numericAmount),
        isFinite: isFinite(numericAmount),
        isPositive: numericAmount > 0
      });

      if (isNaN(numericAmount) || !isFinite(numericAmount)) {
        setError('Amount must be a valid number');
        return;
      }

      if (numericAmount <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      if (!currentItem.date) {
        setError('Date is required');
        return;
      }

      const requestBody = {
        category: currentItem.category.trim(),
        description: currentItem.description.trim(),
        amount: numericAmount.toFixed(2), // Format to 2 decimal places
        date: new Date(currentItem.date).toISOString()
      };
      
      console.log('Submitting budget item:', {
        raw: currentItem,
        processed: requestBody,
        validation: {
          categoryValid: Boolean(currentItem.category?.trim()),
          descriptionValid: Boolean(currentItem.description?.trim()),
          amountValid: !isNaN(numericAmount) && isFinite(numericAmount) && numericAmount > 0,
          dateValid: Boolean(currentItem.date)
        }
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Server response:', { 
        status: response.status, 
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        console.error('Budget item creation failed:', { 
          status: response.status,
          statusText: response.statusText,
          data,
          errors: data.errors,
          requestBody,
          currentItem
        });

        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => {
            const field = err.field ? `${err.field.charAt(0).toUpperCase()}${err.field.slice(1)}` : '';
            return field ? `${field}: ${err.message}` : err.message;
          });
          setError(errorMessages.join('\n'));
        } else {
          const errorMessage = data.message || 'Error saving budget item';
          const fieldName = data.field ? `${data.field.charAt(0).toUpperCase()}${data.field.slice(1)}` : '';
          setError(fieldName ? `${fieldName}: ${errorMessage}` : errorMessage);
        }
        return;
      }

      // Clear error and refresh data
      setError(null);
      await fetchBudget();
      
      // Close dialog and reset form
      setOpenDialog(false);
      setCurrentItem({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving budget item:', error);
      setError('Failed to save budget item. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/trips/${tripId}/budget/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        fetchBudget();
      }
    } catch (error) {
      console.error('Error deleting budget item:', error);
    }
  };

  const handleOpenDialog = (item?: BudgetItem) => {
    if (item) {
      setEditItem(item);
      setCurrentItem({
        category: item.category,
        description: item.description,
        amount: item.amount.toString(),
        date: item.date.split('T')[0],
      });
    } else {
      setEditItem(null);
      setCurrentItem({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    // Reset form state
    setCurrentItem({
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0], // Reset to today's date
    });
    setEditItem(null);
    
    // Close the dialog
    setOpenDialog(false);
    
    console.log('Dialog closed and form reset');
  };

  const totalBudget = budget?.totalBudget || 0;
  const spent = budget?.spent || 0;
  const remaining = budget?.remaining || 0;
  const progress = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>Budget Overview</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Total Budget</Typography>
              <Typography variant="h6">${(budget?.totalBudget || 0).toFixed(2)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Spent</Typography>
              <Typography variant="h6">${(budget?.spent || 0).toFixed(2)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">Remaining</Typography>
              <Typography variant="h6" color={(budget?.remaining || 0) < 0 ? 'error' : 'inherit'}>
                ${(budget?.remaining || 0).toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(progress || 0, 100)}
            color={progress > 100 ? 'error' : 'primary'}
          />
          <Typography variant="body2" color="textSecondary" align="right" sx={{ mt: 1 }}>
            {(progress || 0).toFixed(1)}% of budget used
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Expenses</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Expense
        </Button>
      </Box>

      <Paper>
        <List>
          {budget.items.map((item) => (
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
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{item.description}</Typography>
                    <Typography>${parseFloat(item.amount).toFixed(2)}</Typography>
                  </Box>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      Category: {item.category}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2">
                      Date: {new Date(item.date).toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
          {budget.items.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No expenses recorded"
                secondary="Click 'Add Expense' to start tracking your spending"
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
        disableEscapeKeyDown={false}
        onBackdropClick={handleCloseDialog}
      >
        <DialogTitle>
          {editItem ? 'Edit Expense' : 'Add Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>  
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                label="Description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={currentItem.amount}
                onChange={(e) => setCurrentItem({ ...currentItem, amount: e.target.value })}
                InputProps={{
                  startAdornment: <Typography>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={currentItem.date}
                onChange={(e) => setCurrentItem({ ...currentItem, date: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {editItem ? 'Save Changes' : 'Add Expense'}
          </Button>
        </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Budget;
