// Main Application Controller
class YouTubeDownloaderApp {
    constructor() {
        this.currentUrl = '';
        this.selectedQuality = '';
        this.selectedFormat = 'video';
        this.downloadCount = 0;
        this.isMenuVisible = false;
        this.darkMode = false;

        this.init();
    }

    init() {
        console.log('🚀 Initializing YouTube Downloader Pro...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        try {
            this.setupEventListeners();
            this.loadSettings();
            this.detectBrowser();
            this.setupScrollHandler();
            this.setupTabSwitching();
            this.updateDefaultPath();

            console.log('✅ App initialized successfully!');
            this.showNotification('YouTube Downloader Pro ready!', 'success');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showNotification('Failed to initialize app', 'error');
        }
    }

    setupEventListeners() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMenu());
        }

        // URL input
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('input', (e) => this.handleUrlInput(e));
        }

        // Quality options
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quality-option')) {
                this.selectQuality(e.target.closest('.quality-option'));
            }
            if (e.target.closest('.format-option')) {
                this.selectFormat(e.target.closest('.format-option'));
            }
        });
    }

    setupScrollHandler() {
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const navbar = document.getElementById('navbar');

            if (!navbar) return;

            if (currentScroll > 100) {
                if (currentScroll > lastScroll && this.isMenuVisible) {
                    navbar.classList.remove('visible');
                    this.isMenuVisible = false;
                } else if (currentScroll < lastScroll && !this.isMenuVisible) {
                    navbar.classList.add('visible');
                    this.isMenuVisible = true;
                }
            } else {
                navbar.classList.remove('visible');
                this.isMenuVisible = false;
            }

            lastScroll = currentScroll;
        });
    }

    setupTabSwitching() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = document.getElementById(`${btn.dataset.tab}-tab`);
                if (targetTab) {
                    targetTab.classList.add('active');
                }

                this.selectedFormat = btn.dataset.tab;
            });
        });
    }

    toggleMenu() {
        const navbar = document.getElementById('navbar');
        const toggle = document.getElementById('menuToggle');

        if (!navbar || !toggle) return;

        if (this.isMenuVisible) {
            navbar.classList.remove('visible');
            toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
            this.isMenuVisible = false;
        } else {
            navbar.classList.add('visible');
            toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
            this.isMenuVisible = true;
        }
    }

    handleUrlInput(event) {
        const url = event.target.value.trim();
        if (url && !this.isValidYouTubeUrl(url)) {
            event.target.style.borderColor = 'var(--error-color)';
        } else {
            event.target.style.borderColor = '';
        }
    }

    async detectBrowser() {
        try {
            const response = await fetch('/api/youtube/detect-browser');
            const browser = await response.text();
            const detectedBrowser = document.getElementById('detectedBrowser');
            if (detectedBrowser) {
                detectedBrowser.innerHTML = `
                    <i class="fab fa-${browser}"></i> ${browser.charAt(0).toUpperCase() + browser.slice(1)} Detected
                `;
            }
        } catch (error) {
            console.warn('Browser detection failed:', error);
        }
    }

    updateDefaultPath() {
        const pathElement = document.getElementById('currentPath');
        if (pathElement) {
            const defaultPath = localStorage.getItem('downloadPath') || 'Downloads/YTDownloader';
            pathElement.textContent = defaultPath;
        }
    }

    loadSettings() {
        // Load download count
        const savedCount = localStorage.getItem('downloadCount');
        if (savedCount) {
            this.downloadCount = parseInt(savedCount);
            const downloadCountElement = document.getElementById('downloadCount');
            if (downloadCountElement) {
                downloadCountElement.textContent = this.downloadCount;
            }
        }

        // Load theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.toggleTheme();
        }
    }

    selectQuality(element) {
        if (!element) return;

        document.querySelectorAll('.quality-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        element.classList.add('selected');

        const quality = element.querySelector('h4')?.textContent || '';
        this.selectedQuality = quality;

        this.showNotification(`Selected quality: ${quality}`, 'info');
    }

    selectFormat(element) {
        if (!element) return;

        document.querySelectorAll('.format-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        element.classList.add('selected');

        const format = element.dataset.format;
        this.selectedFormat = format;

        this.showNotification(`Selected format: ${format.toUpperCase()}`, 'info');
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };

        notification.innerHTML = `
            <i class="fas fa-${iconMap[type]}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius-sm);
            color: white;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
            min-width: 250px;
            max-width: 400px;
        `;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#6366f1'
        };

        notification.style.backgroundColor = colors[type];

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    isValidYouTubeUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
            /youtube\.com\/watch\?v=/,
            /youtube\.com\/playlist\?list=/,
            /youtu\.be\//
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    // Update progress
    updateProgress(percent, status = '') {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressStatus = document.getElementById('progressStatus');

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${percent}%`;
        if (progressStatus && status) progressStatus.textContent = status;
    }

    // Show/hide loading
    showLoading(show, text = 'Loading...') {
        const loading = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');

        if (!loading) return;

        if (show) {
            loading.classList.remove('hidden');
            if (loadingText) loadingText.textContent = text;
        } else {
            loading.classList.add('hidden');
        }
    }

    // Toggle theme
    toggleTheme() {
        this.darkMode = !this.darkMode;
        document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');

        const themeBtn = document.querySelector('.sidebar-btn[onclick="toggleTheme()"] i');
        if (themeBtn) {
            themeBtn.className = this.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }

        this.showNotification(`Switched to ${this.darkMode ? 'dark' : 'light'} theme`, 'info');
    }
}

// Global functions for onclick events
window.analyzeVideo = function() {
    if (window.app) {
        window.apiController.analyzeVideo();
    }
};

window.downloadSelected = function() {
    if (window.app) {
        window.apiController.downloadVideo();
    }
};

window.downloadAll = function() {
    if (window.app) {
        window.apiController.downloadAll();
    }
};

window.clearAll = function() {
    if (window.app) {
        window.uiController.clearAll();
    }
};

window.openSettings = function() {
    if (window.app) {
        window.uiController.openSettings();
    }
};

window.closeSettings = function() {
    if (window.app) {
        window.uiController.closeSettings();
    }
};

window.toggleTheme = function() {
    if (window.app) {
        window.app.toggleTheme();
    }
};

window.browsePath = function() {
    if (window.app) {
        window.uiController.browsePath();
    }
};

// Initialize app
window.app = new YouTubeDownloaderApp();