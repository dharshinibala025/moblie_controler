export const mockData = {
  student: {
    name: 'Rohit Sharma',
    registerNumber: '21CS084',
    department: 'CSE Department',
    fullDepartment: 'Computer Science & Engineering',
    year: '3rd Year',
    section: 'Section A',
    email: 'rohit.sharma@college.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    initials: 'RS',
  },

  restrictionStatus: {
    isActive: true,
    statusTitle: 'Restrictions Active',
    schedule: '09:00 AM – 04:00 PM',
    controlledBy: 'Department Admin (HOD)',
    remainingTime: '02:15:00',
    noticeText: 'Remotely controlled by Department Admin (HOD) during active class hours.',
  },

  blockedApps: [
    { id: '1', name: 'Instagram', category: 'Social Media', icon: 'instagram', blocked: true },
    { id: '2', name: 'WhatsApp', category: 'Messaging', icon: 'whatsapp', blocked: true },
    { id: '3', name: 'Facebook', category: 'Social Media', icon: 'facebook', blocked: true },
    { id: '4', name: 'YouTube', category: 'Video Streaming', icon: 'youtube', blocked: true },
    { id: '5', name: 'Telegram', category: 'Messaging', icon: 'telegram', blocked: true },
    { id: '6', name: 'Snapchat', category: 'Social Media', icon: 'snapchat', blocked: true },
    { id: '7', name: 'X (Twitter)', category: 'Social Media', icon: 'twitter', blocked: true },
    { id: '8', name: 'Games', category: 'Gaming', icon: 'gamepad', blocked: true },
  ],

  recentActivity: [
    {
      id: 'a1',
      time: '09:00 AM',
      type: 'blocked',
      title: 'Restrictions Enabled',
      details: 'Applications restricted for morning academic session.',
    },
    {
      id: 'a2',
      time: '04:00 PM',
      type: 'unblocked',
      title: 'Restrictions Disabled',
      details: 'All applications unblocked for the day.',
    },
  ],

  notifications: [
    {
      id: 'n1',
      message: 'Mobile restrictions active until 4:00 PM.',
      time: '09:00 AM',
      read: false,
    },
    {
      id: 'n2',
      message: 'All restrictions will lift automatically at 04:00 PM.',
      time: '12:00 PM',
      read: false,
    },
  ],
};

export default mockData;
