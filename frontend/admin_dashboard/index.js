/**
 * admin_dashboard module entry point.
 *
 * Default export: AdminPanel -- a fully self-contained Admin Panel with
 * its own bottom tab navigation (Dashboard | Students | Staff | Devices |
 * Settings). Drop it into any screen slot in the host app's existing
 * navigation to get the whole panel at once.
 *
 * Named exports: each individual screen, in case the host app prefers to
 * register them separately with its own navigator (e.g. React Navigation)
 * instead of using the built-in BottomTabBar.
 *
 * Example (whole panel):
 *   import AdminPanel from './frontend/admin_dashboard';
 *
 * Example (individual screens):
 *   import { DashboardScreen, StudentsScreen } from './frontend/admin_dashboard';
 */

import AdminPanel from './AdminPanel';
import DashboardScreen from './screens/DashboardScreen';
import StudentsScreen from './screens/StudentsScreen';
import StaffScreen from './screens/StaffScreen';
import DevicesScreen from './screens/DevicesScreen';
import SettingsScreen from './screens/SettingsScreen';

export {
  AdminPanel,
  DashboardScreen,
  StudentsScreen,
  StaffScreen,
  DevicesScreen,
  SettingsScreen,
};

export default AdminPanel;
