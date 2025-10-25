import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import AddProduct from './pages/AddProduct';
import CreateVideo from './pages/CreateVideo';
import InProgress from './pages/InProgress';
import GeneratedVideos from './pages/GeneratedVideos';
import UploadedHistory from './pages/UploadedHistory';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/add-product" element={<AddProduct />} />
                  <Route path="/create-video" element={<CreateVideo />} />
                  <Route path="/in-progress" element={<InProgress />} />
                  <Route path="/generated-videos" element={<GeneratedVideos />} />
                  <Route path="/uploaded-videos" element={<UploadedHistory />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/" element={<Navigate to="/analytics" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}


