const STAFF_PROFILES = {
  'rajesh.kumar@ksrce.ac.in': {
    name: 'Dr. Rajesh Kumar',
    designation: 'Professor & Head',
    id: 'KSR-STF-1024',
    department: 'Computer Science Engineering',
    email: 'rajesh.kumar@ksrce.ac.in',
    mobile: '+91 94421 78905',
    roleAssignment: 'Professor & Head (CSE Monitoring)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256',
    initials: 'RK',
    assignedClass: 'III CSE - A',
    password: 'staff@123',
  },
  'priya.nair@ksrce.ac.in': {
    name: 'Prof. Priya Nair',
    designation: 'Assistant Professor',
    id: 'KSR-STF-214',
    department: 'Computer Science Engineering',
    email: 'priya.nair@ksrce.ac.in',
    mobile: '+91 98765 43210',
    roleAssignment: 'Class Advisor - II CSE A',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
    initials: 'PN',
    assignedClass: 'II CSE - A',
    password: 'staff@123',
  },
  'anil.kumar@ksrce.ac.in': {
    name: 'Prof. Anil Kumar',
    designation: 'Associate Professor',
    id: 'KSR-STF-118',
    department: 'Computer Science Engineering',
    email: 'anil.kumar@ksrce.ac.in',
    mobile: '+91 98765 43211',
    roleAssignment: 'Class Advisor - II CSE B',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256',
    initials: 'AK',
    assignedClass: 'II CSE - B',
    password: 'staff@123',
  },
  'divya.francis@ksrce.ac.in': {
    name: 'Prof. Divya Francis',
    designation: 'Assistant Professor',
    id: 'KSR-STF-076',
    department: 'Computer Science Engineering',
    email: 'divya.francis@ksrce.ac.in',
    mobile: '+91 98765 43212',
    roleAssignment: 'Class Advisor - III CSE A',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256',
    initials: 'DF',
    assignedClass: 'III CSE - A',
    password: 'staff@123',
  },
  'ramesh.subin@ksrce.ac.in': {
    name: 'Prof. Ramesh Subin',
    designation: 'Associate Professor',
    id: 'KSR-STF-152',
    department: 'Computer Science Engineering',
    email: 'ramesh.subin@ksrce.ac.in',
    mobile: '+91 98765 43213',
    roleAssignment: 'Class Advisor - IV CSE C',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    initials: 'RS',
    assignedClass: 'IV CSE - C',
    password: 'staff@123',
  },
};

export const getStaffProfile = (email) => {
  return STAFF_PROFILES[email] || STAFF_PROFILES['rajesh.kumar@ksrce.ac.in'];
};

export const STAFF_EMAILS = Object.keys(STAFF_PROFILES);

const defaultStaff = STAFF_PROFILES['rajesh.kumar@ksrce.ac.in'];

const classMapping = {
  'III CSE - A': '3rd Year - A',
  'III CSE - B': '3rd Year - B',
  'III CSE - C': '3rd Year - C',
  'II CSE - A': '2nd Year - A',
  'II CSE - B': '2nd Year - B',
  'II CSE - C': '2nd Year - C',
  'IV CSE - A': 'Final Year - A',
  'IV CSE - B': 'Final Year - B',
  'IV CSE - C': 'Final Year - C',
};

export const getSectionKeyFromClass = (assignedClass) => {
  return classMapping[assignedClass] || assignedClass;
};

const SECTIONS = {
  '2nd Year - A': [
    { id: '2a1', name: 'Adithya K', rollNo: '22CS001', status: 'active', device: 'Samsung S23', screenTime: '1h 45m', attempts: 0 },
    { id: '2a2', name: 'Bala J', rollNo: '22CS008', status: 'blocked', device: 'OnePlus 11', screenTime: '2h 10m', attempts: 4 },
    { id: '2a3', name: 'Dharshini B', rollNo: '22CS015', status: 'active', device: 'iPhone 14 Pro', screenTime: '55m', attempts: 0 },
    { id: '2a4', name: 'Dinesh Kumar M', rollNo: '22CS018', status: 'offline', device: 'Redmi Note 12', screenTime: '0m', attempts: 0 },
    { id: '2a5', name: 'Gokul Raj S', rollNo: '22CS025', status: 'blocked', device: 'Realme GT', screenTime: '3h 05m', attempts: 7 },
    { id: '2a6', name: 'Harini V', rollNo: '22CS032', status: 'active', device: 'Vivo V27', screenTime: '1h 20m', attempts: 0 },
    { id: '2a7', name: 'Jeeva N', rollNo: '22CS040', status: 'active', device: 'Moto Edge 40', screenTime: '1h 15m', attempts: 0 },
    { id: '2a8', name: 'Karthik R', rollNo: '22CS045', status: 'blocked', device: 'Samsung A54', screenTime: '1h 50m', attempts: 3 },
  ],
  '2nd Year - B': [
    { id: '2b1', name: 'Manoj S', rollNo: '22CS052', status: 'active', device: 'OnePlus Nord 3', screenTime: '2h 00m', attempts: 0 },
    { id: '2b2', name: 'Naveen Kumar A', rollNo: '22CS060', status: 'offline', device: 'Samsung M34', screenTime: '0m', attempts: 0 },
    { id: '2b3', name: 'Pooja R', rollNo: '22CS068', status: 'active', device: 'iPhone 13', screenTime: '45m', attempts: 0 },
    { id: '2b4', name: 'Rahul G', rollNo: '22CS075', status: 'blocked', device: 'Poco F5', screenTime: '2h 40m', attempts: 6 },
    { id: '2b5', name: 'Sanjay M', rollNo: '22CS082', status: 'active', device: 'Realme Narzo', screenTime: '1h 05m', attempts: 0 },
    { id: '2b6', name: 'Sneha P', rollNo: '22CS090', status: 'blocked', device: 'Oppo Reno 10', screenTime: '1h 30m', attempts: 2 },
  ],
  '2nd Year - C': [
    { id: '2c1', name: 'Tharun K', rollNo: '22CS098', status: 'active', device: 'Samsung F54', screenTime: '1h 10m', attempts: 0 },
    { id: '2c2', name: 'Vignesh S', rollNo: '22CS105', status: 'active', device: 'OnePlus CE 3', screenTime: '1h 55m', attempts: 0 },
    { id: '2c3', name: 'Yazhini M', rollNo: '22CS112', status: 'blocked', device: 'iPhone SE', screenTime: '2h 15m', attempts: 5 },
    { id: '2c4', name: 'Abishek R', rollNo: '22CS118', status: 'offline', device: 'Moto G54', screenTime: '0m', attempts: 0 },
  ],
  '3rd Year - A': [
    { id: '3a1', name: 'Ajith Kumar R', rollNo: '21CS003', status: 'active', device: 'OnePlus 11R', screenTime: '2h 30m', attempts: 0 },
    { id: '3a2', name: 'Divya S', rollNo: '21CS014', status: 'blocked', device: 'iPhone 14', screenTime: '3h 15m', attempts: 8 },
    { id: '3a3', name: 'Hariharan B', rollNo: '21CS028', status: 'active', device: 'Samsung S22', screenTime: '1h 40m', attempts: 0 },
    { id: '3a4', name: 'Kavin M', rollNo: '21CS042', status: 'active', device: 'Pixel 7a', screenTime: '1h 10m', attempts: 0 },
    { id: '3a5', name: 'Nithya R', rollNo: '21CS063', status: 'blocked', device: 'Redmi Note 12 Pro', screenTime: '2h 20m', attempts: 3 },
    { id: '3a6', name: 'Praveen S', rollNo: '21CS074', status: 'offline', device: 'Realme 11 Pro', screenTime: '0m', attempts: 0 },
    { id: '3a7', name: 'Rohit Sharma', rollNo: '21CS084', status: 'active', device: 'Samsung A34', screenTime: '1h 50m', attempts: 0 },
  ],
  '3rd Year - B': [
    { id: '3b1', name: 'Santhosh P', rollNo: '21CS092', status: 'active', device: 'OnePlus Nord CE', screenTime: '2h 05m', attempts: 0 },
    { id: '3b2', name: 'Sowmya G', rollNo: '21CS101', status: 'blocked', device: 'iPhone 12', screenTime: '2h 50m', attempts: 5 },
    { id: '3b3', name: 'Surya Kumar A', rollNo: '21CS110', status: 'active', device: 'Samsung M54', screenTime: '1h 15m', attempts: 0 },
    { id: '3b4', name: 'Vijay R', rollNo: '21CS118', status: 'offline', device: 'Moto G84', screenTime: '0m', attempts: 0 },
  ],
  '3rd Year - C': [
    { id: '3c1', name: 'Archana M', rollNo: '21CS124', status: 'active', device: 'Oppo F23', screenTime: '1h 35m', attempts: 0 },
    { id: '3c2', name: 'Deepak K', rollNo: '21CS132', status: 'active', device: 'Realme C55', screenTime: '1h 45m', attempts: 0 },
    { id: '3c3', name: 'Keerthana S', rollNo: '21CS140', status: 'blocked', device: 'Vivo Y200', screenTime: '2h 00m', attempts: 3 },
  ],
  'Final Year - A': [
    { id: '4a1', name: 'Anand R', rollNo: '20CS005', status: 'active', device: 'Samsung S21 FE', screenTime: '1h 25m', attempts: 0 },
    { id: '4a2', name: 'Bhuvanesh S', rollNo: '20CS012', status: 'active', device: 'OnePlus 10T', screenTime: '2h 10m', attempts: 0 },
    { id: '4a3', name: 'Gayathri M', rollNo: '20CS026', status: 'blocked', device: 'iPhone 13 Pro', screenTime: '3h 30m', attempts: 10 },
    { id: '4a4', name: 'Mithun K', rollNo: '20CS048', status: 'offline', device: 'Pixel 6a', screenTime: '0m', attempts: 0 },
  ],
  'Final Year - B': [
    { id: '4b1', name: 'Pranesh V', rollNo: '20CS064', status: 'active', device: 'Realme GT Neo', screenTime: '1h 50m', attempts: 0 },
    { id: '4b2', name: 'Rithika R', rollNo: '20CS078', status: 'blocked', device: 'Vivo V29', screenTime: '2h 25m', attempts: 4 },
    { id: '4b3', name: 'Sabari S', rollNo: '20CS089', status: 'active', device: 'OnePlus Nord 2T', screenTime: '2h 15m', attempts: 0 },
  ],
  'Final Year - C': [
    { id: '4c1', name: 'Tamil Selvan M', rollNo: '20CS102', status: 'active', device: 'Samsung A73', screenTime: '2h 05m', attempts: 0 },
    { id: '4c2', name: 'Vidhya G', rollNo: '20CS115', status: 'blocked', device: 'iPhone 11', screenTime: '1h 40m', attempts: 2 },
    { id: '4c3', name: 'Yogesh R', rollNo: '20CS128', status: 'offline', device: 'Moto Edge 30', screenTime: '0m', attempts: 0 },
  ],
};

const ALL_NOTIFICATIONS = {
  '3rd Year - A': [
    { id: 'n1', studentName: 'Divya S', rollNo: '21CS014', action: 'Instagram access attempt blocked', time: '05:28 AM', read: false },
    { id: 'n2', studentName: 'Nithya R', rollNo: '21CS063', action: 'Free Fire game launch blocked', time: '05:25 AM', read: false },
    { id: 'n3', studentName: 'Ajith Kumar R', rollNo: '21CS003', action: 'YouTube streaming blocked', time: '05:18 AM', read: false },
    { id: 'n4', studentName: 'Praveen S', rollNo: '21CS074', action: 'WhatsApp Web access blocked', time: '05:10 AM', read: true },
    { id: 'n5', studentName: 'Kavin M', rollNo: '21CS042', action: 'Snapchat access attempt blocked', time: '04:55 AM', read: true },
  ],
  '2nd Year - A': [
    { id: 'n1', studentName: 'Bala J', rollNo: '22CS008', action: 'Instagram access attempt blocked', time: '05:28 AM', read: false },
    { id: 'n2', studentName: 'Gokul Raj S', rollNo: '22CS025', action: 'Free Fire game launch blocked', time: '05:25 AM', read: false },
    { id: 'n3', studentName: 'Karthik R', rollNo: '22CS045', action: 'Facebook access attempt blocked', time: '04:55 AM', read: true },
  ],
  '2nd Year - B': [
    { id: 'n1', studentName: 'Rahul G', rollNo: '22CS075', action: 'PUBG launch blocked', time: '05:20 AM', read: false },
    { id: 'n2', studentName: 'Sneha P', rollNo: '22CS090', action: 'Telegram access blocked', time: '04:45 AM', read: true },
  ],
  'IV CSE - C': [],
  default: [
    { id: 'n1', studentName: 'Bala J', rollNo: '22CS008', action: 'Instagram access attempt blocked', time: '05:28 AM', read: false },
    { id: 'n2', studentName: 'Gokul Raj S', rollNo: '22CS025', action: 'Free Fire game launch blocked', time: '05:25 AM', read: false },
    { id: 'n3', studentName: 'Divya S', rollNo: '21CS014', action: 'YouTube streaming blocked', time: '05:18 AM', read: false },
    { id: 'n4', studentName: 'Gayathri M', rollNo: '20CS026', action: 'WhatsApp Web access blocked', time: '05:10 AM', read: true },
    { id: 'n5', studentName: 'Yazhini M', rollNo: '22CS112', action: 'Facebook access attempt blocked', time: '04:55 AM', read: true },
    { id: 'n6', studentName: 'Nithya R', rollNo: '21CS063', action: 'Snapchat access attempt blocked', time: '04:42 AM', read: true },
  ],
};

export const getStudentsForClass = (assignedClass) => {
  const sectionKey = getSectionKeyFromClass(assignedClass);
  const students = SECTIONS[sectionKey] || [];
  return students.map(s => ({
    ...s,
    online: s.status !== 'offline',
    lastSync: s.status === 'offline' ? '15 min ago' : s.status === 'blocked' ? '2 min ago' : 'Just now',
  }));
};

export const getNotificationsForClass = (assignedClass) => {
  const sectionKey = getSectionKeyFromClass(assignedClass);
  return ALL_NOTIFICATIONS[sectionKey] || ALL_NOTIFICATIONS.default || [];
};

export const staffMockData = {
  staff: defaultStaff,
  sections: SECTIONS,
  notifications: ALL_NOTIFICATIONS.default,
};

export default staffMockData;
