import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ReportItem from './pages/ReportItem';
import ItemDetail from './pages/ItemDetail';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Notifications from './pages/Notifications';
import Spinner from './components/Spinner';

const PrivateRoute = ({ children }) => {
  const { user, firebaseUser, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login?step=register" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullscreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/report/:type" element={<PrivateRoute><ReportItem /></PrivateRoute>} />
      <Route path="/items/:id" element={<PrivateRoute><ItemDetail /></PrivateRoute>} />
      <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
      <Route path="/matches/:id" element={<PrivateRoute><MatchDetail /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
