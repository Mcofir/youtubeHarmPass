// ==UserScript==
// @name         YouTube Content Warning Auto-Clicker v3
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Automatically clicks "I understand and wish to proceed" on YouTube content warnings
// @author       mcofir
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Warning Auto-Clicker v3 - Starting...');

    let lastClickTime = 0;
    let clickAttempts = 0;
    const MAX_CLICK_ATTEMPTS = 3;
    const CLICK_COOLDOWN = 5000; // 5 seconds between click attempts

    // Enhanced click function with multiple methods
    function performClick(button) {
        console.log('Attempting to click button with multiple methods...');
        console.log('Button element:', button);
        console.log('Button tagName:', button.tagName);

        try {
            // Method 1: Look for actual clickable element inside yt-button-renderer
            if (button.tagName === 'YT-BUTTON-RENDERER') {
                const innerButton = button.querySelector('button') || button.querySelector('[role="button"]') || button.querySelector('a');
                if (innerButton) {
                    console.log('Found inner clickable element:', innerButton);
                    innerButton.click();
                    console.log('Method 1A: Inner button click attempted');
                    return true;
                }
            }

            // Method 2: Regular click
            button.click();
            console.log('Method 2: Regular click attempted');

            // Method 3: Try clicking with coordinates (center of element)
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y
            });
            button.dispatchEvent(clickEvent);
            console.log('Method 3: Coordinate click attempted at', x, y);

            // Method 4: Dispatch mouse events sequence
            const mouseEvents = ['mousedown', 'mouseup', 'click'];
            mouseEvents.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: x,
                    clientY: y
                });
                button.dispatchEvent(event);
            });
            console.log('Method 4: Mouse events sequence dispatched');

            // Method 5: Focus and Enter key
            if (button.focus) {
                button.focus();
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(enterEvent);
                console.log('Method 5: Focus and Enter key attempted');
            }

            // Method 6: Try clicking all child elements
            const clickableChildren = button.querySelectorAll('*');
            for (const child of clickableChildren) {
                if (child.click) {
                    child.click();
                    console.log('Method 6: Child element click attempted:', child);
                }
            }

            return true;
        } catch (error) {
            console.error('Error clicking button:', error);
            return false;
        }
    }

    // Function to find and click the proceed button
    function findAndClickProceedButton() {
        const currentTime = Date.now();

        // Prevent spam clicking
        if (currentTime - lastClickTime < CLICK_COOLDOWN) {
            console.log('Cooldown active, skipping click attempt');
            return false;
        }

        if (clickAttempts >= MAX_CLICK_ATTEMPTS) {
            console.log('Max click attempts reached, stopping');
            return false;
        }

        console.log('Searching for proceed button...');

        // Strategy 1: Look for the actual button element inside yt-button-renderer
        const ytButtonRenderers = document.querySelectorAll('yt-button-renderer');
        for (const renderer of ytButtonRenderers) {
            const text = (renderer.textContent || renderer.innerText || '').trim().toLowerCase();
            if (text.includes('understand') && text.includes('proceed')) {
                console.log('Found yt-button-renderer with correct text:', renderer);

                // Look for actual clickable element inside
                const actualButton = renderer.querySelector('button') ||
                                   renderer.querySelector('[role="button"]') ||
                                   renderer.querySelector('a') ||
                                   renderer.querySelector('.yt-spec-button-shape-next');

                if (actualButton) {
                    console.log('Found actual clickable element:', actualButton);
                    lastClickTime = currentTime;
                    clickAttempts++;
                    console.log(`Click attempt ${clickAttempts}/${MAX_CLICK_ATTEMPTS}`);

                    const success = performClick(actualButton);
                    if (success) {
                        setTimeout(() => {
                            if (!checkForWarning()) {
                                console.log('Warning successfully dismissed!');
                                clickAttempts = 0;
                            }
                        }, 1000);
                    }
                    return true;
                } else {
                    // Try clicking the renderer itself
                    console.log('No inner clickable found, trying renderer itself');
                    lastClickTime = currentTime;
                    clickAttempts++;
                    console.log(`Click attempt ${clickAttempts}/${MAX_CLICK_ATTEMPTS}`);

                    const success = performClick(renderer);
                    if (success) {
                        setTimeout(() => {
                            if (!checkForWarning()) {
                                console.log('Warning successfully dismissed!');
                                clickAttempts = 0;
                            }
                        }, 1000);
                    }
                    return true;
                }
            }
        }

        // Strategy 2: Look for the specific YouTube button structure from your HTML
        const specificSelectors = [
            'yt-button-renderer.style-scope.yt-player-error-message-renderer',
            'yt-button-renderer[button-renderer][button-next]',
            '.yt-player-error-message-renderer yt-button-renderer',
            'ytd-player-error-message-renderer yt-button-renderer'
        ];

        for (const selector of specificSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
                const buttonText = (button.textContent || button.innerText || '').trim().toLowerCase();
                if (buttonText.includes('understand') && buttonText.includes('proceed')) {
                    console.log('Found specific YouTube button:', button);
                    console.log('Button text:', buttonText);

                    if (button.offsetParent !== null) {
                        lastClickTime = currentTime;
                        clickAttempts++;
                        console.log(`Click attempt ${clickAttempts}/${MAX_CLICK_ATTEMPTS}`);

                        const success = performClick(button);
                        if (success) {
                            setTimeout(() => {
                                if (!checkForWarning()) {
                                    console.log('Warning successfully dismissed!');
                                    clickAttempts = 0;
                                }
                            }, 1000);
                        }
                        return true;
                    }
                }
            }
        }

        // Strategy 3: Look for any button with the right text
        const allButtons = document.querySelectorAll('button, [role="button"], .yt-spec-button-shape-next');

        for (const button of allButtons) {
            const buttonText = (button.textContent || button.innerText || '').trim().toLowerCase();
            const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();

            if ((buttonText.includes('understand') && buttonText.includes('proceed')) ||
                (ariaLabel.includes('understand') && ariaLabel.includes('proceed'))) {

                console.log('Found fallback button:', button);
                console.log('Button text:', buttonText);

                if (button.offsetParent !== null) {
                    lastClickTime = currentTime;
                    clickAttempts++;
                    console.log(`Click attempt ${clickAttempts}/${MAX_CLICK_ATTEMPTS}`);

                    const success = performClick(button);
                    if (success) {
                        setTimeout(() => {
                            if (!checkForWarning()) {
                                console.log('Warning successfully dismissed!');
                                clickAttempts = 0;
                            }
                        }, 1000);
                    }
                    return true;
                }
            }
        }

        console.log('No proceed button found');
        return false;
    }

    // Function to check if we're on a video page and if there's a warning
    function checkForWarning() {
        const currentUrl = window.location.href;
        if (!currentUrl.includes('/watch?v=')) {
            return false;
        }

        // Check for specific warning elements
        const warningElements = document.querySelectorAll([
            'yt-player-error-message-renderer',
            'ytd-player-error-message-renderer',
            '.yt-player-error-message-renderer',
            '.ytd-player-error-message-renderer'
        ].join(', '));

        for (const element of warningElements) {
            if (element.offsetParent !== null) {
                const text = element.textContent || element.innerText || '';
                if (text.toLowerCase().includes('content may contain') ||
                    text.toLowerCase().includes('suicide') ||
                    text.toLowerCase().includes('self-harm') ||
                    text.toLowerCase().includes('discretion is advised')) {
                    return true;
                }
            }
        }

        return false;
    }

    // Main execution function
    function executeAutoClick() {
        if (checkForWarning()) {
            console.log('Warning detected, attempting to click proceed button...');
            setTimeout(() => {
                findAndClickProceedButton();
            }, 300);
        } else {
            // Reset click attempts when no warning is present
            if (clickAttempts > 0) {
                console.log('No warning detected, resetting click attempts');
                clickAttempts = 0;
            }
        }
    }

    // Create observer for DOM changes
    const observer = new MutationObserver(function(mutations) {
        let shouldCheck = false;

        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = node.textContent || node.innerText || '';
                        if (text.toLowerCase().includes('content may contain') ||
                            text.toLowerCase().includes('understand and wish to proceed')) {
                            shouldCheck = true;
                            break;
                        }
                    }
                }
            }
        });

        if (shouldCheck) {
            console.log('Relevant DOM change detected');
            setTimeout(executeAutoClick, 100);
        }
    });

    // Start observing
    function startScript() {
        console.log('Starting YouTube Warning Auto-Clicker v3...');

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check
        executeAutoClick();

        // Periodic check (every 3 seconds, less aggressive)
        setInterval(executeAutoClick, 3000);
    }

    // Handle YouTube's SPA navigation
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('URL changed to:', lastUrl);
            // Reset click attempts on navigation
            clickAttempts = 0;
            setTimeout(executeAutoClick, 1000);
        }
    }, 1000);

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startScript);
    } else {
        startScript();
    }

    console.log('YouTube Warning Auto-Clicker v3 loaded successfully');
})();