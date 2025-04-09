# Holiday Trip Planner

A full-stack application for planning your perfect holiday trips built with React, Node.js, Express, and SQLite.

## Features

- 🔐 User Authentication (JWT-based)
- 🌍 Trip Management
  - Create, view, update, and delete trips
  - Track trip status (planned, ongoing, completed, cancelled)
  - Set trip dates and budget
- 📍 Destination Management
  - Add multiple destinations to a trip
  - Store destination details and notes
- 📅 Itinerary Planning
  - Create detailed day-by-day itineraries
  - Add activities and notes
- 💰 Budget Tracking
  - Set total trip budget
  - Track expenses by category
- ✅ Packing List
  - Create and manage packing lists
  - Check off items as they're packed
- ⛅ Weather Integration (Coming Soon)
  - View weather forecasts for destinations
  - Get packing suggestions based on weather

## Project Structure

```
holiday-planner/
├── client/                # React frontend
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   └── App.tsx      # Root component
│   ├── package.json      # Frontend dependencies
│   └── tsconfig.json     # TypeScript configuration
└── server/               # Node.js + Express backend
    ├── src/              # Source code
    │   ├── middleware/   # Express middleware
    │   ├── models/       # Sequelize models
    │   ├── routes/       # API routes
    │   └── index.js      # Server entry point
    ├── .env              # Environment variables
    └── package.json      # Backend dependencies
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- TypeScript knowledge (for frontend development)
- JavaScript knowledge (for backend development)

## Installation & Setup

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the server directory with the following content:
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   DB_PATH=./database.sqlite
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

The server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The client will run on http://localhost:3000

## Database

The application uses SQLite as the database. The database file is created at the path specified in `DB_PATH` environment variable. By default, it's `./database.sqlite` in the server directory.

Note: The database is recreated (cleaned and recreated) on each server startup for development purposes. In production, you should disable this behavior.

## API Documentation

The backend API includes the following main endpoints:

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Trips
- GET /api/trips - Get all trips
- POST /api/trips - Create new trip
- GET /api/trips/:id - Get specific trip
- PUT /api/trips/:id - Update trip
- DELETE /api/trips/:id - Delete trip

### Destinations
- GET /api/destinations - Get all destinations
- POST /api/destinations - Add new destination

### Itineraries
- GET /api/trips/:tripId/itinerary - Get trip itinerary
- POST /api/trips/:tripId/itinerary - Update trip itinerary

### Budget
- GET /api/trips/:tripId/budget - Get trip budget
- POST /api/trips/:tripId/budget - Update trip budget

### Packing Lists
- GET /api/trips/:tripId/packing-list - Get packing list
- POST /api/trips/:tripId/packing-list - Update packing list

## Deployment on Windows

1. Install Node.js:
   - Download Node.js installer from https://nodejs.org
   - Run the installer and follow the installation wizard
   - Verify installation: `node --version` and `npm --version`

2. Clone the repository:
   ```bash
   git clone <repository-url>
   cd holiday-planner
   ```

3. Deploy Backend:
   ```bash
   cd server
   npm install
   npm run build
   ```
   
   To run the server as a Windows service:
   - Install PM2: `npm install -g pm2`
   - Start server: `pm2 start dist/index.js --name holiday-planner-api`
   - Make it run on startup: `pm2 startup`
   - Save the process list: `pm2 save`

4. Deploy Frontend:
   ```bash
   cd client
   npm install
   npm run build
   ```

   To serve the frontend:
   - Install serve: `npm install -g serve`
   - Serve the build folder: `serve -s build`

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Security Notes

- Always change the JWT_SECRET in production
- Enable HTTPS in production
- Set appropriate CORS settings (currently set to allow only frontend origin)
- Use environment variables for sensitive data
- Password hashing is implemented using bcrypt
- JWT tokens expire after 24 hours
- API routes are protected with JWT authentication middleware
- Input validation is implemented for all API endpoints
- Database queries use parameterized queries to prevent SQL injection

## License

MIT License
