import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Dashboard from './pages/dashboard';
import RoomExplore from './pages/RoomExplore';
import ViewRooms from './pages/ViewRooms';
import GameRoom from './pages/GameRoom'; // Import GameRoom

// Placeholder components for undefined routes
function ShopPage() {
  return <div className="min-h-screen bg-gray-900 text-white p-8">Shop Page (Placeholder)</div>;
}

function NotificationsPage() {
  return <div className="min-h-screen bg-gray-900 text-white p-8">Notifications Page (Placeholder)</div>;
}

function ProfilePage() {
  return <div className="min-h-screen bg-gray-900 text-white p-8">Profile Page (Placeholder)</div>;
}

function RoomPage() {
  return <div className="min-h-screen bg-gray-900 text-white p-8">Room Page (Placeholder)</div>;
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  console.log('PrivateRoute checking token:', token);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <PrivateRoute>
                <RoomExplore />
              </PrivateRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <PrivateRoute>
                <ViewRooms />
              </PrivateRoute>
            }
          />
          <Route
            path="/rooms/:roomId/game"
            element={
              <PrivateRoute>
                <GameRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <PrivateRoute>
                <ShopPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <PrivateRoute>
                <RoomPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;