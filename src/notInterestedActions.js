// notInterestedActions.js
// Automates marking the first 10 YouTube homepage videos as 'Not interested'.
// To be triggered by UI or console for now.

/**
 * Wait for a specified number of milliseconds.
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Mark the first N videos as 'Not interested' on the YouTube homepage.
 * @param {number} count - Number of videos to process (default 10)
 */
export async function markVideosNotInterested(count = 10) {
  const videos = document.querySelectorAll('ytd-rich-item-renderer');
  let processed = 0;
  for (let i = 0; i < videos.length && processed < count; i++) {
    const video = videos[i];
    // 1. Find and click the menu button (three dots)
    const menuBtn = video.querySelector('button[aria-label*="Action menu"], button[aria-label*="More actions"]');
    if (!menuBtn) {
      console.warn(`Menu button not found for video #${i + 1}`);
      continue;
    }
    menuBtn.click();
    // 2. Wait for the menu to appear
    await wait(400 + randomBetween(0, 200));
    // 3. Find and click the 'Not interested' menu item
    // The menu is rendered at the document level, not inside the video tile
    const menuItems = document.querySelectorAll('yt-list-item-view-model');
    let found = false;
    for (const item of menuItems) {
      if (item.textContent && item.textContent.trim().toLowerCase().includes('not interested')) {
        item.click();
        found = true;
        break;
      }
    }
    if (!found) {
      console.warn(`'Not interested' menu item not found for video #${i + 1}`);
    } else {
      processed++;
    }
    // 4. Wait a random delay before next video
    await wait(randomBetween(1000, 3000));
  }
  console.info(`Processed ${processed} videos as 'Not interested'.`);
}
