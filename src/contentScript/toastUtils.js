/**
 * Toast Notification Utilities
 * Shared toast notification system for content scripts
 */

import logger from '../logger.js';

// Global toast timeout management
let toastTimeout = null;

/**
 * Create and show a toast notification
 * @param {number} count - Number of items affected
 * @param {string} itemType - Type of items (e.g., 'video', 'Shorts section')
 * @param {string} action - Action taken (e.g., 'hidden', 'deleted', 'removed')
 * @param {string} [toastId] - Optional unique ID for the toast (defaults to 'conscious-youtube-toast')
 */
export function showToast(count, itemType, action, toastId = 'conscious-youtube-toast') {
  // Remove existing toast if any
  const existingToast = document.getElementById(toastId);
  if (existingToast) {
    existingToast.remove();
  }
  
  // Clear existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.innerHTML = `
    <div class="conscious-youtube-toast-content">
      <div class="conscious-youtube-toast-icon">🎬</div>
      <div class="conscious-youtube-toast-message">
        <div class="conscious-youtube-toast-title">YouTube Watch Guard</div>
        <div class="conscious-youtube-toast-text">${count} ${itemType}${count > 1 ? 's' : ''} ${action}</div>
      </div>
    </div>
  `;
  
  // Add styles
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    pointer-events: none;
  `;
  
  // Add content styles
  const style = document.createElement('style');
  style.textContent = `
    .conscious-youtube-toast-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .conscious-youtube-toast-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
    .conscious-youtube-toast-message {
      flex: 1;
    }
    .conscious-youtube-toast-title {
      font-weight: 600;
      margin-bottom: 2px;
      color: #fff;
    }
    .conscious-youtube-toast-text {
      font-size: 13px;
      color: #e0e0e0;
    }
  `;
  
  // Add styles to head if not already added
  if (!document.getElementById('conscious-youtube-toast-styles')) {
    style.id = 'conscious-youtube-toast-styles';
    document.head.appendChild(style);
  }
  
  // Add to page
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  
  // Auto-hide after 3 seconds
  toastTimeout = setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
  
  logger.info(`Toast shown: ${count} ${itemType}${count > 1 ? 's' : ''} ${action}`);
}

/**
 * Show a toast notification for video processing
 * @param {number} count - Number of videos affected
 * @param {string} action - Action taken ('hidden' or 'deleted')
 */
export function showVideoToast(count, action) {
  showToast(count, 'video', action, 'conscious-youtube-video-toast');
}

/**
 * Show a toast notification for Shorts section processing
 * @param {number} count - Number of Shorts sections affected
 */
export function showShortsToast(count) {
  showToast(count, 'Shorts section', 'removed', 'conscious-youtube-shorts-toast');
}

/**
 * Clear any existing toast notifications
 */
export function clearToast() {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  
  // Remove all possible toast elements
  const toastIds = [
    'conscious-youtube-toast',
    'conscious-youtube-video-toast', 
    'conscious-youtube-shorts-toast'
  ];
  
  toastIds.forEach(id => {
    const toast = document.getElementById(id);
    if (toast) {
      toast.remove();
    }
  });
}
