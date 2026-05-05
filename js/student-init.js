/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — student-init.js
   Student-specific initialization and functionality
   ═══════════════════════════════════════════════════════════════ */

// Student-specific data and state
const STUDENT_STATE = {
  profile: {
    name: 'Student',
    email: 'student@ibit.edu.pk',
    section: 'F23-Afternoon-A',
    batch: 'F23'
  },
  stats: {
    todayClasses: 4,
    upcomingTests: 1,
    weeklyAttendance: 87,
    notifications: 3
  },
  schedule: [],
  notifications: [],
  assignments: [],
  exams: [],
  deadlines: []
};

// Initialize student dashboard
function initializeStudentDashboard() {
  console.log('Initializing Student Dashboard...');
  
  // Check authentication
  if (!checkStudentAuth()) {
    window.location.href = 'login.html';
    return;
  }
  
  // Set current date
  setCurrentDate();
  
  // Load student data
  loadStudentData();
  
  // Initialize charts
  initializeStudentCharts();
  
  // Start real-time updates
  startStudentUpdates();
  
  console.log('Student Dashboard initialized successfully');
}

// Check student authentication
function checkStudentAuth() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const userRole = sessionStorage.getItem('userRole');
  
  return isLoggedIn === 'true' && userRole === 'student';
}

// Set current date
function setCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
  }
}

// Load student data
async function loadStudentData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Load student profile from API
    const profile = await APIService.getStudentProfile();
    STUDENT_STATE.profile = { ...STUDENT_STATE.profile, ...profile };
    
    // Load statistics from API (calculate from profile data)
    updateStudentStats();
    
    // Load recent notifications from API
    await loadStudentNotifications();
    
    // Load today's schedule from API
    await loadStudentTodaySchedule();
    
    // Load upcoming deadlines from API
    await loadUpcomingDeadlines();
    
    // Load assignments from API
    await loadStudentAssignments();
    
    // Load exam schedule from API
    await loadExamSchedule();
    
    // Update badges
    updateStudentBadges();
    
    // Load timetable
    await loadStudentTimetable();
    
    hideLoadingState();
    
  } catch (error) {
    console.error('Error loading student data:', error);
    showToast('Error loading student data', 'error');
    hideLoadingState();
  }
}

// Update student statistics
function updateStudentStats() {
  const stats = STUDENT_STATE.stats;
  
  // Update stat cards
  updateElement('studentTodayClasses', stats.todayClasses);
  updateElement('upcomingTests', stats.upcomingTests);
  updateElement('weeklyAttendance', `${stats.weeklyAttendance}%`);
  updateElement('studentNotifications', stats.notifications);
}

// Load student notifications
async function loadStudentNotifications() {
  try {
    const notifications = await APIService.getStudentNotifications();
    
    const notificationContainer = document.getElementById('studentNotifications');
    if (notificationContainer) {
      notificationContainer.innerHTML = notifications.slice(0, 3).map(notification => `
        <div class="activity-item">
          <div class="activity-dot" style="background:${notification.color}"></div>
          <div>
            <div class="activity-text"><strong>${notification.title}</strong> ${notification.message}</div>
            <div class="activity-time">${notification.time}</div>
          </div>
        </div>
      `).join('');
    }
    
    STUDENT_STATE.notifications = notifications;
  } catch (error) {
    console.error('Error loading student notifications:', error);
  }
}

// Load student's today's schedule
async function loadStudentTodaySchedule() {
  try {
    const schedule = await APIService.getStudentTimetable();
    const todaySchedule = schedule.today || [];
    
    const scheduleContainer = document.getElementById('studentTodaySchedule');
    if (scheduleContainer) {
      if (todaySchedule.length === 0) {
        scheduleContainer.innerHTML = '<div class="empty-state">No classes scheduled for today</div>';
      } else {
        scheduleContainer.innerHTML = `
          <tr>
            <th>Time</th>
            <th>Course</th>
            <th>Room</th>
          </tr>
          ${todaySchedule.map(cls => `
            <tr>
              <td class="tt-time">${cls.time}</td>
              <td><div class="tt-cell" style="background:${cls.color}20;border-left:3px solid ${cls.color}">${cls.course}</div></td>
              <td>${cls.room}</td>
            </tr>
          `).join('')}
        `;
      }
    }
    
    STUDENT_STATE.schedule = todaySchedule;
  } catch (error) {
    console.error('Error loading student today schedule:', error);
  }
}

// Load upcoming deadlines
async function loadUpcomingDeadlines() {
  try {
    const deadlines = await APIService.getStudentDeadlines();
    
    const deadlineContainer = document.getElementById('upcomingDeadlines');
    if (deadlineContainer) {
      if (deadlines.length === 0) {
        deadlineContainer.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
      } else {
        deadlineContainer.innerHTML = deadlines.map(deadline => `
          <div class="activity-item">
            <div class="activity-dot" style="background:${deadline.color}"></div>
            <div>
              <div class="activity-text"><strong>${deadline.title}</strong> – ${deadline.course}</div>
              <div class="activity-time">${deadline.date} · ${deadline.time}</div>
            </div>
          </div>
        `).join('');
      }
    }
    
    STUDENT_STATE.deadlines = deadlines;
  } catch (error) {
    console.error('Error loading upcoming deadlines:', error);
  }
}

// Load student assignments
async function loadStudentAssignments() {
  try {
    const assignments = await APIService.getStudentAssignments();
    
    // Load pending assignments
    const pendingContainer = document.getElementById('pendingAssignments');
    if (pendingContainer) {
      if (assignments.pending.length === 0) {
        pendingContainer.innerHTML = '<div class="empty-state">No pending assignments</div>';
      } else {
        pendingContainer.innerHTML = assignments.pending.map(assignment => `
          <div class="assignment-item">
            <div class="assignment-title">${assignment.title}</div>
            <div class="assignment-course">${assignment.course}</div>
            <div class="assignment-due">Due: ${assignment.dueDate}</div>
            <div class="assignment-priority ${assignment.priority}">${assignment.priority}</div>
          </div>
        `).join('');
      }
    }
    
    // Load submitted assignments
    const submittedContainer = document.getElementById('submittedAssignments');
    if (submittedContainer) {
      if (assignments.submitted.length === 0) {
        submittedContainer.innerHTML = '<div class="empty-state">No submitted assignments</div>';
      } else {
        submittedContainer.innerHTML = assignments.submitted.map(assignment => `
          <div class="assignment-item">
            <div class="assignment-title">${assignment.title}</div>
            <div class="assignment-course">${assignment.course}</div>
            <div class="assignment-submitted">Submitted: ${assignment.submittedDate}</div>
            <div class="assignment-grade">Grade: ${assignment.grade}</div>
          </div>
        `).join('');
      }
    }
    
    STUDENT_STATE.assignments = assignments;
  } catch (error) {
    console.error('Error loading student assignments:', error);
  }
}

// Load exam schedule
async function loadExamSchedule() {
  try {
    const exams = await APIService.getStudentExams();
    
    // Load upcoming exams
    const upcomingContainer = document.getElementById('upcomingExams');
    if (upcomingContainer) {
      if (exams.upcoming.length === 0) {
        upcomingContainer.innerHTML = '<div class="empty-state">No upcoming exams</div>';
      } else {
        upcomingContainer.innerHTML = exams.upcoming.map(exam => `
          <div class="exam-item">
            <div class="exam-title">${exam.title}</div>
            <div class="exam-course">${exam.course}</div>
            <div class="exam-date">${exam.date}</div>
            <div class="exam-time">${exam.time}</div>
            <div class="exam-room">Room: ${exam.room}</div>
            <div class="exam-type">${exam.type}</div>
          </div>
        `).join('');
      }
    }
    
    // Load past exams
    const pastContainer = document.getElementById('pastExams');
    if (pastContainer) {
      if (exams.past.length === 0) {
        pastContainer.innerHTML = '<div class="empty-state">No past exams</div>';
      } else {
        pastContainer.innerHTML = exams.past.map(exam => `
          <div class="exam-item">
            <div class="exam-title">${exam.title}</div>
            <div class="exam-course">${exam.course}</div>
            <div class="exam-date">${exam.date}</div>
            <div class="exam-grade">Grade: ${exam.grade}</div>
            <div class="exam-type">${exam.type}</div>
          </div>
        `).join('');
      }
    }
    
    STUDENT_STATE.exams = exams;
  } catch (error) {
    console.error('Error loading exam schedule:', error);
  }
}

// Load student timetable
function loadStudentTimetable() {
  // This would load the student's specific timetable
  // For now, we'll use the existing timetable structure
  console.log('Loading student timetable...');
}

// Update student badges
function updateStudentBadges() {
  updateElement('studentNotifCount', STUDENT_STATE.notifications.filter(n => n.unread).length);
  updateElement('deadlineCount', `${STUDENT_STATE.deadlines.length} upcoming`);
  updateElement('pendingAssignCount', `${STUDENT_STATE.assignments.pending.length} pending`);
  updateElement('submittedAssignCount', `${STUDENT_STATE.assignments.submitted.length} submitted`);
  updateElement('upcomingExamCount', `${STUDENT_STATE.exams.upcoming.length} upcoming`);
  updateElement('pastExamCount', `${STUDENT_STATE.exams.past.length} completed`);
  updateElement('unreadCount', STUDENT_STATE.notifications.filter(n => n.unread).length);
  updateElement('todayCount', STUDENT_STATE.notifications.filter(n => n.time.includes('Today')).length);
  updateElement('weekCount', STUDENT_STATE.notifications.length);
}

// Initialize student charts
function initializeStudentCharts() {
  // Weekly class load chart
  const weeklyChart = document.getElementById('studentWeeklyChart');
  if (weeklyChart) {
    weeklyChart.innerHTML = generateStudentWeeklyChartBars();
  }
}

// Generate student weekly chart bars
function generateStudentWeeklyChartBars() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const classData = [60, 75, 50, 70, 40];
  
  return days.map((day, index) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${classData[index]}%;background:var(--gold-lt)"></div>
      <div class="bar-label">${day}</div>
    </div>
  `).join('');
}

// Export functions
function exportMyTimetable() {
  console.log('Exporting student timetable PDF...');
  showToast('Exporting PDF...', 'info');
  // Implement PDF export functionality
}

function exportAssignments() {
  console.log('Exporting assignments list...');
  showToast('Exporting assignments...', 'info');
  // Implement assignment export functionality
}

function exportExamSchedule() {
  console.log('Exporting exam schedule...');
  showToast('Exporting exam schedule...', 'info');
  // Implement exam schedule export functionality
}

function syncCalendar() {
  console.log('Syncing to calendar...');
  showToast('Syncing to calendar...', 'info');
  // Implement calendar sync functionality
}

function addExamToCalendar() {
  console.log('Adding exams to calendar...');
  showToast('Adding to calendar...', 'success');
  // Implement calendar addition functionality
}

// Notification functions
function markAllRead() {
  STUDENT_STATE.notifications.forEach(n => n.unread = false);
  updateStudentBadges();
  showToast('All notifications marked as read', 'success');
}

function filterNotifications(type) {
  console.log('Filtering notifications by type:', type);
  // Implement notification filtering
}

// Timetable functions
function previousWeek() {
  console.log('Navigating to previous week...');
  // Implement week navigation
}

function nextWeek() {
  console.log('Navigating to next week...');
  // Implement week navigation
}

function switchTTView(view) {
  console.log('Switching timetable view:', view);
  // Implement view switching
}

function filterTimetable() {
  console.log('Filtering timetable...');
  // Implement timetable filtering
}

// Logout function
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// Loading state functions
function showLoadingState() {
  const loadingElements = document.querySelectorAll('.stat-value, .activity-list, .assignment-list, .exam-list');
  loadingElements.forEach(el => {
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';
  });
  
  // Show loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'globalLoading';
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = 'Loading...';
  loadingIndicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--amber);
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  document.body.appendChild(loadingIndicator);
}

function hideLoadingState() {
  const loadingElements = document.querySelectorAll('.stat-value, .activity-list, .assignment-list, .exam-list');
  loadingElements.forEach(el => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });
  
  // Remove loading indicator
  const loadingIndicator = document.getElementById('globalLoading');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// Helper function to update elements
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeStudentDashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    loadStudentData(); // Refresh data when page becomes visible
  }
});
