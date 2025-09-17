/**
 * Shared Mutation Observer Utilities
 * Common utilities for DOM mutation observation across content script components
 */

/**
 * Create a shared mutation observer for DOM changes
 * @param {Array<string>} selectors - Array of CSS selectors to watch for
 * @param {Function} callback - Callback function to execute when matching elements are found
 * @param {number} debounceDelay - Debounce delay in milliseconds (default: 250)
 * @returns {MutationObserver} - The configured mutation observer
 */
export function createSharedMutationObserver(selectors, callback, debounceDelay = 250) {
  let timeout = null;
  
  const debouncedCallback = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(callback, debounceDelay);
  };

  const observer = new MutationObserver((mutations) => {
    let shouldTrigger = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if any added nodes match the selectors
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            for (const selector of selectors) {
              if ((node.matches && node.matches(selector)) || 
                  (node.querySelector && node.querySelector(selector))) {
                shouldTrigger = true;
                break;
              }
            }
            if (shouldTrigger) break;
          }
        }
      }
    }
    if (shouldTrigger) {
      debouncedCallback();
    }
  });

  return observer;
}
