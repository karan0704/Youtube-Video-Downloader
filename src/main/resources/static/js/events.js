// Event Handlers and DOM Events
class EventController {
    constructor(app) {
        this.app = app;
        this.setupGlobalEvents();
    }

    setupGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Click outside modal to close
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Form submissions
        document.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Visibility change (tab switching)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    handleKeydown(e) {
        // Ctrl/Cmd + Enter to analyze
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            window.analyzeVideo();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Ctrl/Cmd + K to clear all
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            window.clearAll();
        }

        // Ctrl/Cmd + , to open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            window.openSettings();
        }
    }

    handleOutsideClick(e) {
        // Close settings modal when clicking outside
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            const modal = settingsModal.querySelector('.modal');
            if (modal && !modal.contains(e.target)) {
                window.closeSettings();
            }
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();

        // Handle URL form submission
        if (e.target.closest('.input-group')) {
            window.analyzeVideo();
        }
    }

    handleResize() {
        // Responsive adjustments
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');

        if (window.innerWidth <= 1024) {
            // Mobile layout adjustments
            if (sidebar) {
                sidebar.style.position = 'relative';
            }
        } else {
            // Desktop layout
            if (sidebar) {
                sidebar.style.position = 'sticky';
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden (user switched tab)
            console.log('Page hidden - pausing any active operations');
        } else {
            // Page is visible again
            console.log('Page visible - resuming operations');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = '';
    }

    // Quality selection with animation
    animateQualitySelection(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 100);
    }

    // URL input validation with real-time feedback
    validateUrlInput(input) {
        const url = input.value.trim();
        const isValid = this.app.isValidYouTubeUrl(url);

        if (url === '') {
            input.style.borderColor = '';
            return;
        }

        if (isValid) {
            input.style.borderColor = 'var(--success-color)';
            input.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
        } else {
            input.style.borderColor = 'var(--error-color)';
            input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        }
    }

    // Smooth scroll to element
    scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    // Add loading state to buttons
    addButtonLoading(buttonElement, loadingText = 'Loading...') {
        if (!buttonElement) return;

        const originalText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            ${loadingText}
        `;

        return () => {
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalText;
        };
    }

    // Copy to clipboard
    copyToClipboard(text, successMessage = 'Copied to clipboard!') {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.app.showNotification(successMessage, 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text, successMessage);
            });
        } else {
            this.fallbackCopyToClipboard(text, successMessage);
        }
    }

    fallbackCopyToClipboard(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.app.showNotification(successMessage, 'success');
        } catch (err) {
            this.app.showNotification('Failed to copy to clipboard', 'error');
        }

        document.body.removeChild(textArea);
    }

    // Debounce function for search/input
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Animate element entrance
    animateIn(element, animationType = 'fadeIn') {
        if (!element) return;

        element.classList.add(animationType);
        element.addEventListener('animationend', () => {
            element.classList.remove(animationType);
        }, { once: true });
    }
}

// Initialize Event Controller
window.eventController = new EventController(window.app);

// Enhanced URL input with debounced validation
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        const debouncedValidation = window.eventController.debounce(
            () => window.eventController.validateUrlInput(urlInput),
            300
        );

        urlInput.addEventListener('input', debouncedValidation);
    }
});
