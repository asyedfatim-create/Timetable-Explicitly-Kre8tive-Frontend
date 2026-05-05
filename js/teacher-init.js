/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — teacher-init.js
   Teacher-specific initialization and functionality
   ═══════════════════════════════════════════════════════════════ */

// Teacher-specific data and state
const TEACHER_STATE = {
  profile: {
    name: 'Dr. Sara',
    email: 'teacher@ibit.edu.pk',
    department: 'Computer Science',
    courses: ['Internet Programming', 'Data Structures']
  },
  stats: {
    todayClasses: 3,
    weekClasses: 16,
    cancellations: 1,
    pendingRequests: 2
  },
  schedule: [],
  requests: [],
  notifications: []
};

// Initialize teacher dashboard
function initializeTeacherDashboard() {
  console.log('Initializing Teacher Dashboard...');
  
  // Check authentication
  if (!checkTeacherAuth()) {
    window.location.href = 'login.html';
    return;
  }
  
  // Set current date
  setCurrentDate();
  
  // Load teacher data
  loadTeacherData();
  
  // Initialize charts
  initializeTeacherCharts();
  
  // Start real-time updates
  startTeacherUpdates();
  
  console.log('Teacher Dashboard initialized successfully');
}

// Check teacher authentication
function checkTeacherAuth() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const userRole = sessionStorage.getItem('userRole');
  
  return isLoggedIn === 'true' && userRole === 'teacher';
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

// Load teacher data
async function loadTeacherData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Load teacher profile from API
    const profile = await APIService.getTeacherProfile();
    TEACHER_STATE.profile = { ...TEACHER_STATE.profile, ...profile };
    
    // Load statistics from API (calculate from profile data)
    updateTeacherStats();
    
    // Load recent activity from API
    await loadTeacherRecentActivity();
    
    // Load teacher's requests from API
    await loadTeacherRequests();
    
    // Load notifications from API
    await loadTeacherNotifications();
    
    // Load today's schedule from API
    await loadTodaySchedule();
    
    // Update badges
    updateTeacherBadges();
    
    // Load request history
    loadRequestHistory();
    
    hideLoadingState();
    
  } catch (error) {
    console.error('Error loading teacher data:', error);
    showToast('Error loading teacher data', 'error');
    hideLoadingState();
  }
}

// Update teacher statistics
function updateTeacherStats() {
  const stats = TEACHER_STATE.stats;
  
  // Update stat cards
  updateElement('todayClasses', stats.todayClasses);
  updateElement('weekClasses', stats.weekClasses);
  updateElement('myCancellations', stats.cancellations);
  updateElement('myPending', stats.pendingRequests);
}

// Load teacher's recent activity
async function loadTeacherRecentActivity() {
  try {
    const activities = await APIService.getTeacherRecentActivity();
    
    const activityContainer = document.getElementById('teacherRecentActivity');
    if (activityContainer) {
      activityContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-dot" style="background:${activity.color}"></div>
          <div>
            <div class="activity-text"><strong>${activity.title}</strong></div>
            <div class="activity-time">${activity.time}</div>
          </div>
        </div>
      `).join('');
    }
    
    TEACHER_STATE.recentActivity = activities;
  } catch (error) {
    console.error('Error loading teacher recent activity:', error);
  }
}

// Load teacher's requests
async function loadTeacherRequests() {
  try {
    const requests = await APIService.getTeacherRequests();
    
    const requestContainer = document.getElementById('myRequestList');
    if (requestContainer) {
      if (requests.length === 0) {
        requestContainer.innerHTML = '<div class="empty-state">No pending requests</div>';
      } else {
        requestContainer.innerHTML = requests.map(request => `
          <div class="req-item">
            <div class="req-type">${request.type}</div>
            <div class="req-details">
              <div class="req-title">${request.course} - ${request.section}</div>
              <div class="req-desc">${request.reason}</div>
              <div class="req-meta">Status: ${request.status}</div>
            </div>
            <div class="req-actions">
              ${request.status === 'pending' ? `
                <button class="btn btn-coral btn-sm" onclick="cancelRequest(${request.id})">Cancel</button>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }
    
    TEACHER_STATE.requests = requests;
  } catch (error) {
    console.error('Error loading teacher requests:', error);
  }
}

// Load teacher notifications
async function loadTeacherNotifications() {
  try {
    const notifications = await APIService.getTeacherNotifications();
    TEACHER_STATE.notifications = notifications;
  } catch (error) {
    console.error('Error loading teacher notifications:', error);
  }
}

// Load today's schedule
async function loadTodaySchedule() {
  try {
    const schedule = await APIService.getTeacherSchedule();
    
    const scheduleContainer = document.getElementById('teacherTodaySchedule');
    if (scheduleContainer) {
      if (schedule.length === 0) {
        scheduleContainer.innerHTML = '<div class="empty-state">No classes scheduled for today</div>';
      } else {
        scheduleContainer.innerHTML = `
          <tr>
            <th>Time</th>
            <th>Course</th>
            <th>Room</th>
            <th>Section</th>
          </tr>
          ${schedule.map(cls => `
            <tr>
              <td class="tt-time">${cls.time}</td>
              <td><div class="tt-cell" style="background:${cls.color}20;border-left:3px solid ${cls.color}">${cls.course}</div></td>
              <td>${cls.room}</td>
              <td>${cls.section}</td>
            </tr>
          `).join('')}
        `;
      }
    }
    
    TEACHER_STATE.schedule = schedule;
  } catch (error) {
    console.error('Error loading today\'s schedule:', error);
  }
}

// Load request history
function loadRequestHistory() {
  const history = [
    {
      type: 'makeup',
      title: 'DS Makeup · Sec B',
      status: 'Approved',
      details: 'Mon Apr 14 · Room 305',
      color: 'var(--teal)'
    },
    {
      type: 'merge',
      title: 'IP Section Merge A+C',
      status: 'Pending',
      details: 'Admin Review',
      color: 'var(--amber)'
    },
    {
      type: 'cancel',
      title: 'OS Lecture Cancel · Sec A',
      status: 'Rejected',
      details: 'No valid alternative',
      color: 'var(--coral)'
    }
  ];
  
  const historyContainer = document.getElementById('requestHistory');
  if (historyContainer) {
    historyContainer.innerHTML = history.map(item => `
      <div class="hist-item">
        <div style="width:6px;height:6px;border-radius:50%;background:${item.color};flex-shrink:0;margin-top:5px"></div>
        <div>
          <div class="hist-title">${item.title}</div>
          <div class="hist-meta">${item.status} · ${item.details}</div>
        </div>
      </div>
    `).join('');
  }
}

// Update teacher badges
function updateTeacherBadges() {
  const actualPendingCount = TEACHER_STATE.requests.filter(r => r.status === 'pending').length;
  const actualNotifCount = TEACHER_STATE.notifications.filter(n => n.unread).length;
  const totalRequests = TEACHER_STATE.requests.length + 3; // +3 for history items
  
  updateElement('myReqCount', actualPendingCount);
  updateElement('myNotifCount', actualNotifCount);
  updateElement('myRequestCount', `${actualPendingCount} pending`);
  updateElement('historyCount', `${totalRequests} total`);
  
  // Update the stats to match actual data
  TEACHER_STATE.stats.pendingRequests = actualPendingCount;
}

// Initialize teacher charts
function initializeTeacherCharts() {
  // Weekly schedule chart
  const weeklyChart = document.getElementById('teacherWeeklyChart');
  if (weeklyChart) {
    weeklyChart.innerHTML = generateTeacherWeeklyChartBars();
  }
}

// Generate teacher weekly chart bars
function generateTeacherWeeklyChartBars() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const classData = [50, 70, 40, 60, 30];
  
  return days.map((day, index) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${classData[index]}%;background:var(--gold-lt)"></div>
      <div class="bar-label">${day}</div>
    </div>
  `).join('');
}

// Teacher request submission handlers
function submitTeacherRequest() {
  const requestType = document.querySelector('.req-tab.active').textContent.includes('Makeup') ? 'makeup' : 
                     document.querySelector('.req-tab.active').textContent.includes('Merge') ? 'merge' : 'cancel';
  
  console.log('Submitting teacher request:', requestType);
  showToast('Request submitted successfully', 'success');
  
  // Reset form
  document.querySelector('.tab-panel.active form').reset();
  
  // Reload requests
  loadTeacherRequests();
}

function submitMergeRequest() {
  console.log('Submitting merge request');
  showToast('Section merge request submitted', 'success');
  loadTeacherRequests();
}

function submitCancelRequest() {
  console.log('Submitting cancel request');
  showToast('Cancellation request submitted', 'warning');
  loadTeacherRequests();
}

async function cancelRequest(requestId) {
  try {
    showLoadingState();
    
    await APIService.cancelTeacherRequest(requestId);
    
    // Remove request from pending list
    TEACHER_STATE.requests = TEACHER_STATE.requests.filter(req => req.id !== requestId);
    
    // Update UI immediately
    loadTeacherRequests();
    updateTeacherBadges();
    
    showToast('Request cancelled', 'info');
    
    // Add to recent activity
    addTeacherActivity({
      type: 'cancel',
      title: `Cancelled request - ID: ${requestId}`,
      time: 'Just now',
      color: 'var(--coral)'
    });
    
    hideLoadingState();
  } catch (error) {
    console.error('Error cancelling request:', error);
    showToast('Error cancelling request', 'error');
    hideLoadingState();
  }
}

// Helper function to add teacher activity
function addTeacherActivity(activity) {
  TEACHER_STATE.recentActivity.unshift(activity);
  if (TEACHER_STATE.recentActivity.length > 10) {
    TEACHER_STATE.recentActivity = TEACHER_STATE.recentActivity.slice(0, 10);
  }
  loadTeacherRecentActivity();
}

// Export functions
function exportMyPDF() {
  console.log('Exporting teacher timetable PDF...');
  showToast('Exporting PDF...', 'info');
  // Implement PDF export functionality
}

// Logout function
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// Loading state functions
function showLoadingState() {
  const loadingElements = document.querySelectorAll('.stat-value, .activity-list, .req-list');
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
    background: var(--teal);
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
  const loadingElements = document.querySelectorAll('.stat-value, .activity-list, .req-list');
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

// Tab switching functionality
function switchTab(tabElement, tabId) {
  // Remove active class from all tabs
  document.querySelectorAll('.req-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Add active class to clicked tab
  tabElement.classList.add('active');
  
  // Hide all tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  // Show selected tab panel
  document.getElementById(tabId).classList.add('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeTeacherDashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    loadTeacherData(); // Refresh data when page becomes visible
  }
});
