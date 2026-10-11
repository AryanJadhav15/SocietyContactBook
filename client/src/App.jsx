import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ContactDirectoryPage from './pages/ContactDirectoryPage.jsx';
import ContactFormPage from './pages/ContactFormPage.jsx';
import ContactDetailsPage from './pages/ContactDetailsPage.jsx';
import FlatsPage from './pages/FlatsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AccessDeniedPage from './pages/AccessDeniedPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="contacts" element={<ContactDirectoryPage />} />
          <Route path="contacts/new" element={<ContactFormPage />} />
          <Route path="contacts/:id" element={<ContactDetailsPage />} />
          <Route path="contacts/:id/edit" element={<ContactFormPage />} />
          <Route path="flats" element={<FlatsPage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
