import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Itinerary from './pages/Itinerary';
import Budget from './pages/Budget';
import PackingList from './pages/PackingList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TripList from './pages/TripList';
import TripDetails from './pages/TripDetails';
import NewTrip from './pages/NewTrip';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<Layout />}>
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/trips" element={
                <PrivateRoute>
                  <TripList />
                </PrivateRoute>
              } />
              <Route path="/trips/new" element={
                <PrivateRoute>
                  <NewTrip />
                </PrivateRoute>
              } />
              <Route path="/trips/:id" element={
                <PrivateRoute>
                  <TripDetails />
                </PrivateRoute>
              } />
              <Route path="/trips/:id/itinerary" element={
                <PrivateRoute>
                  <Itinerary />
                </PrivateRoute>
              } />
              <Route path="/trips/:id/budget" element={
                <PrivateRoute>
                  <Budget />
                </PrivateRoute>
              } />
              <Route path="/trips/:id/packing" element={
                <PrivateRoute>
                  <PackingList />
                </PrivateRoute>
              } />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
