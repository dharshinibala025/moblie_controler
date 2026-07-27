# Walkthrough - Frontend Dashboards Created

I have created a new `frontend` folder containing three dashboard pages tailored for different user roles.

## Files Created

- [StudentDashboard.tsx](file:///D:/Mobile_Controller/frontend/StudentDashboard.tsx): Features a green theme with sections for courses and grades.
- [StaffDashboard.tsx](file:///D:/Mobile_Controller/frontend/StaffDashboard.tsx): Features a blue theme with class assignments and action buttons.
- [AdminDashboard.tsx](file:///D:/Mobile_Controller/frontend/AdminDashboard.tsx): Features a dark theme with system statistics and management menus.

## How to View the Dashboards

Since there is no navigation system yet, you can view each dashboard by temporarily modifying your [App.tsx](file:///D:/Mobile_Controller/App.tsx).

### Example: Viewing the Student Dashboard

Update your `App.tsx` like this:

```tsx
import React from 'react';
import StudentDashboard from './frontend/StudentDashboard';

function App() {
  return <StudentDashboard />;
}

export default App;
```

> [!TIP]
> To switch dashboards, just change the import and the component name in the `App` function (e.g., use `StaffDashboard` or `AdminDashboard`).

## Next Steps
- **Navigation**: You can install `@react-navigation/native` to create a login flow that navigates to the correct dashboard based on the user's role.
- **Components**: You can start adding more specific features to each dashboard file.
