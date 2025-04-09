import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  AccountBalance as BudgetIcon,
  FormatListBulleted as PackingIcon,
} from '@mui/icons-material';

const TripNavigation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes('/itinerary')) return 1;
    if (location.pathname.includes('/budget')) return 2;
    if (location.pathname.includes('/packing')) return 3;
    return 0;
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (!id) return;

    switch (newValue) {
      case 0:
        navigate(`/trips/${id}`);
        break;
      case 1:
        navigate(`/trips/${id}/itinerary`);
        break;
      case 2:
        navigate(`/trips/${id}/budget`);
        break;
      case 3:
        navigate(`/trips/${id}/packing`);
        break;
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Paper>
        <Tabs
          value={getActiveTab()}
          onChange={handleChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<InfoIcon />} label="Details" />
          <Tab icon={<ScheduleIcon />} label="Itinerary" />
          <Tab icon={<BudgetIcon />} label="Budget" />
          <Tab icon={<PackingIcon />} label="Packing List" />
        </Tabs>
      </Paper>
    </Box>
  );
};

export default TripNavigation;
