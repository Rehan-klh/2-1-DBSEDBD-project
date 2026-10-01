export const studentNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
  { id: 'room', label: 'My Room', icon: 'RM' },
  { id: 'mess', label: 'Mess Menu', icon: 'MS' },
  { id: 'complaints', label: 'Complaints', icon: 'CP' },
  { id: 'leave', label: 'Leave Requests', icon: 'LV' },
  { id: 'fees', label: 'Fees', icon: 'FE' },
  { id: 'profile', label: 'Profile', icon: 'PR' },
]

export const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
  { id: 'students', label: 'Students', icon: 'ST' },
  { id: 'rooms', label: 'Rooms', icon: 'RM' },
  { id: 'complaints', label: 'Complaints', icon: 'CP' },
  { id: 'leave', label: 'Leave Requests', icon: 'LV' },
  { id: 'mess', label: 'Mess', icon: 'MS' },
  { id: 'fees', label: 'Fees', icon: 'FE' },
]

export const student = {
  name: 'Aarav Sharma',
  id: 'KLH22CS048',
  email: 'aarav.sharma@klh.edu.in',
  phone: '+91 98765 43012',
  course: 'B.Tech Computer Science',
  semester: '4th Semester',
  guardian: 'Rajesh Sharma',
  avatar: 'AS',
  room: {
    block: 'Block B',
    roomNo: 'B-214',
    type: '3 Sharing',
    floor: '2nd Floor',
    bed: 'Bed 2',
    warden: 'Dr. Nandini Rao',
    roommates: ['Rohan Mehta', 'Vikram Joshi'],
  },
}

export const messMenu = [
  {
    meal: 'Breakfast',
    time: '7:30 AM - 9:00 AM',
    items: 'Idli, sambar, coconut chutney, boiled eggs, tea',
    status: 'Serving',
  },
  {
    meal: 'Lunch',
    time: '12:30 PM - 2:00 PM',
    items: 'Rice, dal tadka, mixed veg curry, curd, salad',
    status: 'Upcoming',
  },
  {
    meal: 'Snacks',
    time: '5:00 PM - 6:00 PM',
    items: 'Veg puff, banana, lemon tea',
    status: 'Upcoming',
  },
  {
    meal: 'Dinner',
    time: '7:30 PM - 9:00 PM',
    items: 'Chapati, paneer curry, jeera rice, rasam, fruit custard',
    status: 'Upcoming',
  },
]

export const weeklyMenu = [
  { day: 'Monday', breakfast: 'Dosa', lunch: 'Veg pulao', dinner: 'Dal fry' },
  { day: 'Tuesday', breakfast: 'Poha', lunch: 'Rajma rice', dinner: 'Chapati and curry' },
  { day: 'Wednesday', breakfast: 'Upma', lunch: 'Sambar rice', dinner: 'Egg curry' },
  { day: 'Thursday', breakfast: 'Paratha', lunch: 'Chole rice', dinner: 'Paneer masala' },
  { day: 'Friday', breakfast: 'Idli', lunch: 'Dal tadka', dinner: 'Veg biryani' },
  { day: 'Saturday', breakfast: 'Poori', lunch: 'Curd rice', dinner: 'Noodles' },
]

export const complaints = [
  {
    id: 'CMP-1042',
    category: 'Maintenance',
    subject: 'Ceiling fan speed issue',
    date: '10 Sep 2026',
    status: 'In Progress',
    priority: 'Medium',
  },
  {
    id: 'CMP-1034',
    category: 'Housekeeping',
    subject: 'Washroom cleaning request',
    date: '7 Sep 2026',
    status: 'Resolved',
    priority: 'Low',
  },
  {
    id: 'CMP-1028',
    category: 'Electrical',
    subject: 'Study table plug point not working',
    date: '2 Sep 2026',
    status: 'Pending',
    priority: 'High',
  },
]

export const leaveRequests = [
  {
    id: 'LR-221',
    destination: 'Hyderabad',
    from: '13 Sep 2026',
    to: '15 Sep 2026',
    reason: 'Family function',
    status: 'Pending',
  },
  {
    id: 'LR-207',
    destination: 'Vijayawada',
    from: '28 Aug 2026',
    to: '30 Aug 2026',
    reason: 'Medical appointment',
    status: 'Approved',
  },
]

export const fees = {
  hostel: { amount: 'Rs. 42,000', status: 'Paid', dueDate: 'Paid on 4 Aug 2026' },
  mess: { amount: 'Rs. 8,500', status: 'Due', dueDate: 'Due by 18 Sep 2026' },
  deposit: { amount: 'Rs. 5,000', status: 'Paid', dueDate: 'Paid on 10 Jul 2026' },
}

export const notifications = [
  'Mess committee meeting scheduled for Friday at 4 PM.',
  'Water supply maintenance in Block B from 2 PM to 4 PM.',
  'September mess fee payment window is open.',
  'Room inspection starts next Monday.',
]

export const students = [
  { id: 'KLH22CS048', name: 'Aarav Sharma', room: 'B-214', course: 'CSE', fee: 'Mess Due', status: 'Active' },
  { id: 'KLH22EC031', name: 'Meera Iyer', room: 'A-108', course: 'ECE', fee: 'Paid', status: 'Active' },
  { id: 'KLH22ME017', name: 'Kiran Reddy', room: 'C-302', course: 'ME', fee: 'Paid', status: 'On Leave' },
  { id: 'KLH23CS122', name: 'Nisha Khan', room: 'A-207', course: 'CSE', fee: 'Hostel Due', status: 'Active' },
]

export const rooms = [
  { block: 'A', total: 120, occupied: 112, vacant: 8, warden: 'Prof. Kavitha Menon' },
  { block: 'B', total: 140, occupied: 131, vacant: 9, warden: 'Dr. Nandini Rao' },
  { block: 'C', total: 96, occupied: 88, vacant: 8, warden: 'Mr. Suresh Kumar' },
]

export const adminComplaints = [
  { id: 'CMP-1047', student: 'Nisha Khan', category: 'Plumbing', room: 'A-207', status: 'Pending', priority: 'High' },
  { id: 'CMP-1042', student: 'Aarav Sharma', category: 'Maintenance', room: 'B-214', status: 'In Progress', priority: 'Medium' },
  { id: 'CMP-1039', student: 'Kiran Reddy', category: 'Internet', room: 'C-302', status: 'Pending', priority: 'Medium' },
]

export const adminLeaveRequests = [
  { id: 'LR-221', student: 'Aarav Sharma', dates: '13 Sep - 15 Sep', destination: 'Hyderabad', status: 'Pending' },
  { id: 'LR-219', student: 'Meera Iyer', dates: '12 Sep - 13 Sep', destination: 'Guntur', status: 'Pending' },
  { id: 'LR-207', student: 'Kiran Reddy', dates: '28 Aug - 30 Aug', destination: 'Vijayawada', status: 'Approved' },
]

export const recentActivity = [
  'Room B-218 allocated to Pranav Desai.',
  'Complaint CMP-1034 marked resolved by housekeeping.',
  'Mess menu updated for Saturday dinner.',
  'Two leave requests awaiting warden approval.',
]

export const feeRows = [
  { category: 'Hostel Fee', collected: 'Rs. 42.6L', pending: 'Rs. 3.8L', students: 18 },
  { category: 'Mess Fee', collected: 'Rs. 9.2L', pending: 'Rs. 1.4L', students: 31 },
  { category: 'Security Deposit', collected: 'Rs. 16.8L', pending: 'Rs. 60K', students: 12 },
]
