import React from 'react';
import AdminPanel from '../admin_dashboard/AdminPanel';

/**
 * AdminDashboard
 * Render full Admin Panel component with student, staff, mobile restriction,
 * live monitoring, announcements and profile settings modules.
 */
const AdminDashboard = ({ user, onLogout }) => {
  return <AdminPanel onLogout={onLogout} />;
};

export default AdminDashboard;
