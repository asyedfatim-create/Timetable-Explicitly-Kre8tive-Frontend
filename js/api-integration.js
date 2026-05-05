/* ═════════════════════════════════════════════════════════════
   IBIT TAS — api-integration.js
   Backend API Integration Functions
   ═════════════════════════════════════════════════════════════ */

// API endpoints
const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  
  // Admin endpoints
  ADMIN: {
    STATS: '/admin/stats',
    REQUESTS: '/admin/requests',
    APPROVE_REQUEST: '/admin/requests/{id}/approve',
    REJECT_REQUEST: '/admin/requests/{id}/reject',
    NOTIFICATIONS: '/admin/notifications',
    RECENT_ACTIVITY: '/admin/activity'
  },
  
  // Teacher endpoints
  TEACHER: {
    PROFILE: '/teacher/profile',
    SCHEDULE: '/teacher/schedule',
    REQUESTS: '/teacher/requests',
    SUBMIT_REQUEST: '/teacher/requests',
    CANCEL_REQUEST: '/teacher/requests/{id}/cancel',
    NOTIFICATIONS: '/teacher/notifications'
  },
  
  // Student endpoints
  STUDENT: {
    PROFILE: '/student/profile',
    TIMETABLE: '/student/timetable',
    ASSIGNMENTS: '/student/assignments',
    EXAMS: '/student/exams',
    NOTIFICATIONS: '/student/notifications',
    DEADLINES: '/student/deadlines'
  },
  
  // Common endpoints
  COMMON: {
    COURSES: '/courses',
    TEACHERS: '/teachers',
    ROOMS: '/rooms',
    SECTIONS: '/sections',
    TIMETABLE: '/timetable'
  }
};

// API integration functions
class APIService {
  // Authentication
  static async login(email, password, role) {
    try {
      const response = await API.post(ENDPOINTS.AUTH.LOGIN, { email, password, role });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  static async logout() {
    try {
      await API.post(ENDPOINTS.AUTH.LOGOUT);
      API.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  
  static async getCurrentUser() {
    try {
      const response = await API.get(ENDPOINTS.AUTH.ME);
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }
  
  // Admin API calls
  static async getAdminStats() {
    try {
      const response = await API.get(ENDPOINTS.ADMIN.STATS);
      return response.data || {};
    } catch (error) {
      console.error('Get admin stats error:', error);
      return this.getMockAdminStats();
    }
  }
  
  static async getPendingRequests() {
    try {
      const response = await API.get(ENDPOINTS.ADMIN.REQUESTS, { status: 'pending' });
      return response.data || [];
    } catch (error) {
      console.error('Get pending requests error:', error);
      return this.getMockPendingRequests();
    }
  }
  
  static async approveRequest(requestId) {
    try {
      const endpoint = ENDPOINTS.ADMIN.APPROVE_REQUEST.replace('{id}', requestId);
      const response = await API.post(endpoint);
      return response;
    } catch (error) {
      console.error('Approve request error:', error);
      throw error;
    }
  }
  
  static async rejectRequest(requestId) {
    try {
      const endpoint = ENDPOINTS.ADMIN.REJECT_REQUEST.replace('{id}', requestId);
      const response = await API.post(endpoint);
      return response;
    } catch (error) {
      console.error('Reject request error:', error);
      throw error;
    }
  }
  
  static async getAdminNotifications() {
    try {
      const response = await API.get(ENDPOINTS.ADMIN.NOTIFICATIONS);
      return response.data || [];
    } catch (error) {
      console.error('Get admin notifications error:', error);
      return this.getMockAdminNotifications();
    }
  }
  
  static async getRecentActivity() {
    try {
      const response = await API.get(ENDPOINTS.ADMIN.RECENT_ACTIVITY);
      return response.data || [];
    } catch (error) {
      console.error('Get recent activity error:', error);
      return this.getMockRecentActivity();
    }
  }
  
  // Teacher API calls
  static async getTeacherProfile() {
    try {
      const response = await API.get(ENDPOINTS.TEACHER.PROFILE);
      return response.data || {};
    } catch (error) {
      console.error('Get teacher profile error:', error);
      return this.getMockTeacherProfile();
    }
  }
  
  static async getTeacherSchedule() {
    try {
      const response = await API.get(ENDPOINTS.TEACHER.SCHEDULE);
      return response.data || [];
    } catch (error) {
      console.error('Get teacher schedule error:', error);
      return this.getMockTeacherSchedule();
    }
  }
  
  static async getTeacherRequests() {
    try {
      const response = await API.get(ENDPOINTS.TEACHER.REQUESTS);
      return response.data || [];
    } catch (error) {
      console.error('Get teacher requests error:', error);
      return this.getMockTeacherRequests();
    }
  }
  
  static async submitTeacherRequest(requestData) {
    try {
      const response = await API.post(ENDPOINTS.TEACHER.SUBMIT_REQUEST, requestData);
      return response;
    } catch (error) {
      console.error('Submit teacher request error:', error);
      throw error;
    }
  }
  
  static async cancelTeacherRequest(requestId) {
    try {
      const endpoint = ENDPOINTS.TEACHER.CANCEL_REQUEST.replace('{id}', requestId);
      const response = await API.post(endpoint);
      return response;
    } catch (error) {
      console.error('Cancel teacher request error:', error);
      throw error;
    }
  }
  
  static async getTeacherNotifications() {
    try {
      const response = await API.get(ENDPOINTS.TEACHER.NOTIFICATIONS);
      return response.data || [];
    } catch (error) {
      console.error('Get teacher notifications error:', error);
      return this.getMockTeacherNotifications();
    }
  }
  
  // Student API calls
  static async getStudentProfile() {
    try {
      const response = await API.get(ENDPOINTS.STUDENT.PROFILE);
      return response.data || {};
    } catch (error) {
      console.error('Get student profile error:', error);
      return this.getMockStudentProfile();
    }
  }
  
  static async getStudentTimetable() {
    try {
      const response = await API.get(ENDPOINTS.STUDENT.TIMETABLE);
      return response.data || {};
    } catch (error) {
      console.error('Get student timetable error:', error);
      return this.getMockStudentTimetable();
    }
  }
  
  static async getStudentAssignments() {
    try {
      const response = await API.get(ENDPOINTS.STUDENT.ASSIGNMENTS);
      return response.data || { pending: [], submitted: [] };
    } catch (error) {
      console.error('Get student assignments error:', error);
      return this.getMockStudentAssignments();
    }
  }
  
  static async getStudentExams() {
    try {
      const response = await API.get(ENDPOINTS.STUDENT.EXAMS);
      return response.data || { upcoming: [], past: [] };
    } catch (error) {
      console.error('Get student exams error:', error);
      return this.getMockStudentExams();
    }
  }
  
  static async getStudentNotifications() {
    try {
      const response = await API.get(ENDPOINTS.STUDENT.NOTIFICATIONS);
      return response.data || [];
    } catch (error) {
      console.error('Get student notifications error:', error);
      return this.getMockStudentNotifications();
    }
  }
  
  static async getStudentDeadlines() {
    try {
      const response = await API.get(ENDPOINTS.STUDENT.DEADLINES);
      return response.data || [];
    } catch (error) {
      console.error('Get student deadlines error:', error);
      return this.getMockStudentDeadlines();
    }
  }
  
  // Common API calls
  static async getCourses() {
    try {
      const response = await API.get(ENDPOINTS.COMMON.COURSES);
      return response.data || [];
    } catch (error) {
      console.error('Get courses error:', error);
      return this.getMockCourses();
    }
  }
  
  static async getTeachers() {
    try {
      const response = await API.get(ENDPOINTS.COMMON.TEACHERS);
      return response.data || [];
    } catch (error) {
      console.error('Get teachers error:', error);
      return this.getMockTeachers();
    }
  }
  
  static async getRooms() {
    try {
      const response = await API.get(ENDPOINTS.COMMON.ROOMS);
      return response.data || [];
    } catch (error) {
      console.error('Get rooms error:', error);
      return this.getMockRooms();
    }
  }
  
  static async getSections() {
    try {
      const response = await API.get(ENDPOINTS.COMMON.SECTIONS);
      return response.data || [];
    } catch (error) {
      console.error('Get sections error:', error);
      return this.getMockSections();
    }
  }
  
  // Mock data functions (fallback when API is not available)
  static getMockAdminStats() {
    return {
      totalSlots: 142,
      conductedClasses: 118,
      cancellations: 11,
      pendingRequests: 0 // Will be updated dynamically
    };
  }
  
  static getMockPendingRequests() {
    return [
      {
        id: 1,
        type: 'makeup',
        teacher: 'Dr. Sara',
        course: 'Internet Programming',
        section: 'Sec A',
        detail: 'Request makeup for Monday 2 PM',
        time: '2 hours ago',
        priority: 'urgent'
      },
      {
        id: 2,
        type: 'merge',
        teacher: 'Prof. Bilal',
        course: 'Data Structures',
        sections: 'Sec A + B',
        detail: 'Merge sections for guest lecture',
        time: '4 hours ago',
        priority: 'standard'
      }
    ];
  }
  
  static getMockAdminNotifications() {
    return [
      {
        id: 1,
        type: 'cancellation',
        title: 'Lecture Cancelled — OS · Section B',
        message: 'Dr. Kamran cancelled today\'s Operating Systems lecture for Section B.',
        time: '09:15 · Apr 18, 2026',
        unread: true
      }
    ];
  }
  
  static getMockRecentActivity() {
    return [
      {
        type: 'cancellation',
        title: 'Dr. Kamran cancelled OS lecture (Sec B)',
        time: '09:15 · today',
        color: 'var(--coral)'
      }
    ];
  }
  
  static getMockTeacherProfile() {
    return {
      name: 'Dr. Sara',
      email: 'teacher@ibit.edu.pk',
      department: 'Computer Science',
      courses: ['Internet Programming', 'Data Structures']
    };
  }
  
  static getMockTeacherSchedule() {
    return [
      {
        time: '8:00-9:00',
        course: 'Internet Programming Lab',
        room: 'Lab 204',
        section: 'Sec A',
        color: 'var(--gold-lt)'
      }
    ];
  }
  
  static getMockTeacherRequests() {
    return [
      {
        id: 1,
        type: 'makeup',
        course: 'Internet Programming',
        section: 'Sec A',
        originalDate: '2026-04-16',
        originalTime: '10:00 AM',
        newDate: '2026-04-21',
        newTime: '2:00 PM',
        status: 'pending',
        reason: 'Attending conference on April 18th'
      }
    ];
  }
  
  static getMockTeacherNotifications() {
    return [
      {
        id: 1,
        type: 'makeup',
        title: 'Makeup Approved — IP Lab · Section A',
        message: 'Your makeup request is approved. New slot: Monday, April 21 at 2:00 PM.',
        time: '08:40 · Apr 18, 2026',
        unread: true
      }
    ];
  }
  
  static getMockStudentProfile() {
    return {
      name: 'Student',
      email: 'student@ibit.edu.pk',
      section: 'F23-Afternoon-A',
      batch: 'F23'
    };
  }
  
  static getMockStudentTimetable() {
    return {
      weekly: [],
      monthly: []
    };
  }
  
  static getMockStudentAssignments() {
    return {
      pending: [
        {
          id: 1,
          title: 'OS Lab Assignment 5',
          course: 'Operating Systems',
          dueDate: 'Dec 10, 2026',
          status: 'pending',
          priority: 'high'
        }
      ],
      submitted: [
        {
          id: 5,
          title: 'OS Theory Assignment 4',
          course: 'Operating Systems',
          submittedDate: 'Dec 1, 2026',
          grade: 'A-',
          status: 'graded'
        }
      ]
    };
  }
  
  static getMockStudentExams() {
    return {
      upcoming: [
        {
          id: 1,
          title: 'Operating Systems Midterm',
          course: 'Operating Systems',
          date: 'Dec 14, 2026',
          time: '10:00 AM - 12:00 PM',
          room: 'Room 101',
          type: 'midterm'
        }
      ],
      past: [
        {
          id: 4,
          title: 'Mobile App Dev Midterm',
          course: 'Mobile App Dev',
          date: 'Nov 25, 2026',
          grade: 'B+',
          type: 'midterm'
        }
      ]
    };
  }
  
  static getMockStudentNotifications() {
    return [
      {
        id: 1,
        type: 'class',
        title: 'OS Lecture',
        message: 'OS Lecture cancelled tomorrow (Wed)',
        time: 'Today · 09:15',
        unread: true,
        color: 'var(--coral)'
      }
    ];
  }
  
  static getMockStudentDeadlines() {
    return [
      {
        id: 1,
        title: 'OS Midterm Exam',
        course: 'Operating Systems',
        date: 'Dec 14, 2026',
        time: '10:00 AM',
        type: 'exam',
        daysLeft: 14,
        color: 'var(--coral)'
      }
    ];
  }
  
  static getMockCourses() {
    return [
      { id: 1, name: 'Internet Programming', code: 'IP', type: 'Core' },
      { id: 2, name: 'Operating Systems', code: 'OS', type: 'Core' },
      { id: 3, name: 'Data Structures', code: 'DS', type: 'Core' },
      { id: 4, name: 'Mobile App Dev', code: 'MAD', type: 'Core' },
      { id: 5, name: 'Discrete Mathematics', code: 'DM', type: 'Core' }
    ];
  }
  
  static getMockTeachers() {
    return [
      { id: 1, name: 'Dr. Sara', email: 'sara@ibit.edu.pk', department: 'CS' },
      { id: 2, name: 'Dr. Kamran', email: 'kamran@ibit.edu.pk', department: 'CS' },
      { id: 3, name: 'Prof. Bilal', email: 'bilal@ibit.edu.pk', department: 'SE' }
    ];
  }
  
  static getMockRooms() {
    return [
      { id: 1, name: 'Lab 204', type: 'Lab', capacity: 40, floor: '2' },
      { id: 2, name: 'Room 101', type: 'Lecture', capacity: 50, floor: '1' },
      { id: 3, name: 'Room 202', type: 'Lecture', capacity: 40, floor: '2' }
    ];
  }
  
  static getMockSections() {
    return [
      { id: 1, name: 'F23-Afternoon-A', batch: 'F23', shift: 'Afternoon', label: 'A' },
      { id: 2, name: 'F23-Afternoon-B', batch: 'F23', shift: 'Afternoon', label: 'B' },
      { id: 3, name: 'F23-Morning-A', batch: 'F23', shift: 'Morning', label: 'A' }
    ];
  }
}

// Export for use in other modules
window.APIService = APIService;
