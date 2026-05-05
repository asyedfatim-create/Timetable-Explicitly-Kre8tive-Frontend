/* ═══════════════════════════════════════════════════════════════
   IBIT TAS — admin-init.js
   Admin-specific initialization and functionality
   ═══════════════════════════════════════════════════════════════ */

// Admin-specific data and state
const ADMIN_STATE = {
  stats: {
    totalSlots: 142,
    conductedClasses: 118,
    cancellations: 11,
    pendingRequests: 5
  },
  recentActivity: [],
  pendingApprovals: [],
  notifications: []
};

// Initialize admin dashboard
function initializeAdminDashboard() {
  console.log('Initializing Admin Dashboard...');
  
  // Check authentication
  if (!checkAdminAuth()) {
    window.location.href = 'login.html';
    return;
  }
  
  // Set current date
  setCurrentDate();
  
  // Load admin data
  loadAdminData();
  
  // Initialize charts
  initializeAdminCharts();
  
  // Start real-time updates
  startAdminUpdates();
  
  console.log('Admin Dashboard initialized successfully');
}

// Check admin authentication
function checkAdminAuth() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const userRole = sessionStorage.getItem('userRole');
  
  return isLoggedIn === 'true' && userRole === 'admin';
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

// Load admin data
async function loadAdminData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Load statistics from API
    const stats = await APIService.getAdminStats();
    ADMIN_STATE.stats = { ...ADMIN_STATE.stats, ...stats };
    updateAdminStats();
    
    // Load recent activity from API
    await loadRecentActivity();
    
    // Load pending approvals from API
    await loadPendingApprovals();
    
    // Load notifications from API
    await loadAdminNotifications();
    
    // Update badges
    updateAdminBadges();
    
    hideLoadingState();
    
  } catch (error) {
    console.error('Error loading admin data:', error);
    showToast('Error loading admin data', 'error');
    hideLoadingState();
  }
}

// Update admin statistics
function updateAdminStats() {
  const stats = ADMIN_STATE.stats;
  
  // Update stat cards
  updateElement('totalSlots', stats.totalSlots);
  updateElement('conductedClasses', stats.conductedClasses);
  updateElement('cancellations', stats.cancellations);
  updateElement('pendingRequests', stats.pendingRequests);
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const activities = await APIService.getRecentActivity();
    
    const activityContainer = document.getElementById('recentActivity');
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
    
    ADMIN_STATE.recentActivity = activities;
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

// Load pending approvals
async function loadPendingApprovals() {
  try {
    const pendingRequests = await APIService.getPendingRequests();
    
    const pendingContainer = document.getElementById('pendingApprovals');
    if (pendingContainer) {
      if (pendingRequests.length === 0) {
        pendingContainer.innerHTML = '<div class="empty-state">No pending requests</div>';
      } else {
        pendingContainer.innerHTML = pendingRequests.map(request => `
          <div class="req-item">
            <div class="req-type">${request.type}</div>
            <div class="req-details">
              <div class="req-title">${request.teacher} - ${request.course}</div>
              <div class="req-desc">${request.detail}</div>
              <div class="req-meta">${request.time} · ${request.priority}</div>
            </div>
            <div class="req-actions">
              <button class="btn btn-teal btn-sm" onclick="approveRequest(${request.id})">Approve</button>
              <button class="btn btn-coral btn-sm" onclick="rejectRequest(${request.id})">Reject</button>
            </div>
          </div>
        `).join('');
      }
    }
    
    ADMIN_STATE.pendingApprovals = pendingRequests;
  } catch (error) {
    console.error('Error loading pending approvals:', error);
  }
}

// Load admin notifications
async function loadAdminNotifications() {
  try {
    const notifications = await APIService.getAdminNotifications();
    ADMIN_STATE.notifications = notifications;
  } catch (error) {
    console.error('Error loading admin notifications:', error);
  }
}

// Update admin badges
function updateAdminBadges() {
  const actualPendingCount = ADMIN_STATE.pendingApprovals.length;
  
  updateElement('clashCount', ADMIN_STATE.stats.cancellations);
  updateElement('reqCount', actualPendingCount);
  updateElement('notifCount', ADMIN_STATE.notifications.filter(n => n.unread).length);
  updateElement('pendingCount', `${actualPendingCount} waiting`);
  
  // Update the stats to match actual data
  ADMIN_STATE.stats.pendingRequests = actualPendingCount;
}

// Initialize admin charts
function initializeAdminCharts() {
  // Weekly activity chart
  const weeklyChart = document.getElementById('weeklyChart');
  if (weeklyChart) {
    weeklyChart.innerHTML = generateWeeklyChartBars();
  }
}

// Generate weekly chart bars
function generateWeeklyChartBars() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const scheduledData = [60, 72, 55, 80, 48];
  const conductedData = [60, 65, 50, 72, 40];
  const cancelledData = [10, 14, 8, 12, 18];
  
  return days.map((day, index) => `
    <div class="bar-wrap">
      <div class="bar" style="height:${scheduledData[index]}%;background:var(--gold-lt)"></div>
      <div class="bar" style="height:${conductedData[index]}%;background:var(--teal);opacity:.85"></div>
      <div class="bar" style="height:${cancelledData[index]}%;background:var(--coral)"></div>
      <div class="bar-label">${day}</div>
    </div>
  `).join('');
}

// Admin action handlers
async function approveRequest(requestId) {
  try {
    showLoadingState();
    
    await APIService.approveRequest(requestId);
    
    // Remove request from pending list
    ADMIN_STATE.pendingApprovals = ADMIN_STATE.pendingApprovals.filter(req => req.id !== requestId);
    
    // Update UI immediately
    loadPendingApprovals();
    updateAdminBadges();
    
    // Show success message
    showToast('Request approved successfully', 'success');
    
    // Add to recent activity
    addRecentActivity({
      type: 'approval',
      title: `Approved request - ID: ${requestId}`,
      time: 'Just now',
      color: 'var(--teal)'
    });
    
    hideLoadingState();
  } catch (error) {
    console.error('Error approving request:', error);
    showToast('Error approving request', 'error');
    hideLoadingState();
  }
}

async function rejectRequest(requestId) {
  try {
    showLoadingState();
    
    await APIService.rejectRequest(requestId);
    
    // Remove request from pending list
    ADMIN_STATE.pendingApprovals = ADMIN_STATE.pendingApprovals.filter(req => req.id !== requestId);
    
    // Update UI immediately
    loadPendingApprovals();
    updateAdminBadges();
    
    // Show warning message
    showToast('Request rejected', 'warning');
    
    // Add to recent activity
    addRecentActivity({
      type: 'rejection',
      title: `Rejected request - ID: ${requestId}`,
      time: 'Just now',
      color: 'var(--coral)'
    });
    
    hideLoadingState();
  } catch (error) {
    console.error('Error rejecting request:', error);
    showToast('Error rejecting request', 'error');
    hideLoadingState();
  }
}

// Helper function to add recent activity
function addRecentActivity(activity) {
  ADMIN_STATE.recentActivity.unshift(activity);
  if (ADMIN_STATE.recentActivity.length > 10) {
    ADMIN_STATE.recentActivity = ADMIN_STATE.recentActivity.slice(0, 10);
  }
  loadRecentActivity();
}

// Start real-time updates
function startAdminUpdates() {
  // Update every 30 seconds
  setInterval(() => {
    loadAdminData();
  }, 30000);
}

// Export functions
function exportPDF() {
  console.log('Exporting admin PDF...');
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
    background: var(--gold-lt);
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeAdminDashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    loadAdminData(); // Refresh data when page becomes visible
  }
});
