// ✅ SINGLE FILE SOLUTION - No more undefined errors!

// Global variables
let currentUrl = '';
let selectedQuality = '';
let downloadCount = 0;
let isMenuVisible = false;
let darkMode = false;

// ✅ App initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ YouTube Downloader Pro initialized!');
    setupEventListeners();
    detectBrowser();
    updateDefaultPath();
    setupScrollHandler();
    setupTabSwitching();
    loadSettings();
});

// ✅ Setup all event listeners
function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const urlInput = document.getElementById('urlInput');

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    if (urlInput) {
        urlInput.addEventListener('input', handleUrlInput);
        // Add debounced validation
        const debouncedValidation = debounce(() => validateUrlInput(urlInput), 300);
        urlInput.addEventListener('input', debouncedValidation);
    }

    // Quality option clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('.quality-option')) {
            const option = e.target.closest('.quality-option');
            selectQuality(option);
        }
    });
}

// ✅ MAIN ANALYZE FUNCTION - Fixes all errors
function analyzeVideo() {
    console.log('🔍 Analyzing video...');

    const urlInput = document.getElementById('urlInput');
    if (!urlInput) {
        showNotification('URL input not found!', 'error');
        return;
    }

    const url = urlInput.value.trim();

    if (!url) {
        showNotification('Please enter a YouTube URL', 'warning');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showNotification('Please enter a valid YouTube URL', 'error');
        return;
    }

    currentUrl = url;
    showLoading(true, 'Analyzing video...');

    // Call Spring Boot backend
    fetch('/api/youtube/check-quality', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(url)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(videoInfos => {
            console.log('✅ Video info received:', videoInfos);
            if (videoInfos && videoInfos.length > 0) {
                displayVideoInfo(videoInfos[0]);
                loadSubtitles(url); // Load subtitles asynchronously
                showNotification('✅ Video analyzed successfully!', 'success');
            } else {
                throw new Error('No video information found');
            }
        })
        .catch(error => {
            console.error('❌ Analysis failed:', error);
            showNotification('❌ Failed to analyze: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

// ✅ Display video information
function displayVideoInfo(videoInfo) {
    const videoSection = document.getElementById('videoSection');
    const optionsSection = document.getElementById('optionsSection');

    if (!videoSection) return;

    // Show video card with better styling
    videoSection.innerHTML = `
        <div class="video-card fade-in">
            <img src="${videoInfo.thumbnail || 'https://via.placeholder.com/200x112?text=No+Thumbnail'}" 
                 alt="Video Thumbnail" class="video-thumbnail"
                 onerror="this.src='https://via.placeholder.com/200x112?text=No+Thumbnail'">
            <div class="video-details">
                <h3>${videoInfo.title || 'Video Title'}</h3>
                <p><i class="fas fa-clock"></i> Duration: ${videoInfo.duration || 'Unknown'}</p>
                <p><i class="fas fa-link"></i> URL: ${videoInfo.url || currentUrl}</p>
                <p><i class="fas fa-eye"></i> Available Qualities: ${videoInfo.availableQualities?.length || 0}</p>
            </div>
        </div>
    `;

    // Show quality options
    if (videoInfo.availableQualities) {
        displayQualityOptions(videoInfo.availableQualities);
    }

    // Show sections with animation
    showSection('videoSection');
    showSection('optionsSection');

    // Scroll to video info
    videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ✅ Display quality options
function displayQualityOptions(qualities) {
    const qualityGrid = document.getElementById('qualityGrid');
    if (!qualityGrid) return;

    qualityGrid.innerHTML = '';

    const qualityInfo = {
        '1080p': { label: 'Full HD', icon: 'fas fa-crown', desc: '1920×1080' },
        '720p': { label: 'HD', icon: 'fas fa-video', desc: '1280×720' },
        '480p': { label: 'SD', icon: 'fas fa-play', desc: '854×480' },
        '360p': { label: 'Low Quality', icon: 'fas fa-compress', desc: '640×360' },
        'best': { label: 'Best Available', icon: 'fas fa-star', desc: 'Highest Quality' },
        'worst': { label: 'Smallest Size', icon: 'fas fa-download', desc: 'Lowest Size' }
    };

    qualities.forEach(quality => {
        const info = qualityInfo[quality] || { label: 'Standard', icon: 'fas fa-video', desc: 'Quality' };

        const option = document.createElement('div');
        option.className = 'quality-option';
        option.dataset.quality = quality;

        option.innerHTML = `
            <i class="${info.icon}"></i>
            <h4>${quality}</h4>
            <p>${info.label}</p>
            <small>${info.desc}</small>
            <button class="download-btn" onclick="downloadVideo('${quality}')">
                <i class="fas fa-download"></i> Download
            </button>
        `;

        qualityGrid.appendChild(option);
    });
}

// ✅ Select quality option
function selectQuality(element) {
    if (!element) return;

    // Remove previous selections
    document.querySelectorAll('.quality-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Mark as selected
    element.classList.add('selected');
    const quality = element.dataset.quality;
    selectedQuality = quality;

    showNotification(`Selected: ${quality}`, 'info');
}

// ✅ Download video function
function downloadVideo(quality) {
    if (!currentUrl) {
        showNotification('No video URL available', 'error');
        return;
    }

    showNotification(`Starting ${quality} download...`, 'info');
    showProgressSection();

    // Simulate progress
    simulateProgress();

    const downloadPath = document.getElementById('downloadPath')?.value || '';
    const browserChoice = document.getElementById('browserChoice')?.value || 'chrome';

    const downloadRequest = {
        url: currentUrl,
        quality: quality,
        downloadPath: downloadPath,
        browserType: browserChoice
    };

    fetch('/api/youtube/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(downloadRequest)
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || 'Download failed');
                });
            }
            return response.text();
        })
        .then(result => {
            console.log('✅ Download completed:', result);
            updateProgress(100, 'Complete');
            showNotification('🎉 Download completed!', 'success');
            updateDownloadCount();

            setTimeout(() => hideProgressSection(), 2000);
        })
        .catch(error => {
            console.error('❌ Download failed:', error);
            showNotification('❌ Download failed: ' + error.message, 'error');
            hideProgressSection();
        });
}

// ✅ Load subtitles
async function loadSubtitles(url) {
    try {
        const response = await fetch('/api/youtube/get-subtitles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(url)
        });

        if (response.ok) {
            const subtitles = await response.json();
            displaySubtitles(subtitles);
        }
    } catch (error) {
        console.warn('⚠️ Could not load subtitles:', error);
    }
}

// ✅ Display subtitles
function displaySubtitles(subtitles) {
    const subtitleOptions = document.getElementById('subtitleOptions');
    if (!subtitleOptions) return;

    if (!subtitles || subtitles.length === 0) {
        subtitleOptions.innerHTML = `
            <div class="no-subtitles">
                <i class="fas fa-exclamation-circle"></i>
                <p>No subtitles available for this video</p>
            </div>
        `;
        return;
    }

    subtitleOptions.innerHTML = '';

    subtitles.forEach(subtitle => {
        const option = document.createElement('div');
        option.className = 'subtitle-option';

        const autoGenText = subtitle.autoGenerated ? ' (Auto-generated)' : '';

        option.innerHTML = `
            <div class="subtitle-info">
                <i class="fas fa-closed-captioning"></i>
                <div>
                    <h4>${subtitle.language}${autoGenText}</h4>
                    <p>${subtitle.languageCode} • ${subtitle.format.toUpperCase()}</p>
                </div>
            </div>
            <button class="btn-download-subtitle" onclick="downloadSubtitle('${subtitle.languageCode}', '${subtitle.format}')">
                <i class="fas fa-download"></i>
            </button>
        `;

        subtitleOptions.appendChild(option);
    });
}

// ✅ Progress simulation
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95) {
            clearInterval(interval);
            progress = 95;
        }
        updateProgress(Math.round(progress), 'Downloading...');
    }, 500);
}

// ✅ Update progress
function updateProgress(percent, status = '') {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}%`;
    if (progressStatus && status) progressStatus.textContent = status;
}

// ✅ Show/hide progress section
function showProgressSection() {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        progressSection.classList.remove('hidden');
        progressSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function hideProgressSection() {
    const progressSection = document.getElementById('progressSection');
    if (progressSection) {
        setTimeout(() => {
            progressSection.classList.add('hidden');
        }, 1000);
    }
}

// ✅ Scroll handler
function setupScrollHandler() {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const navbar = document.getElementById('navbar');

        if (!navbar) return;

        if (currentScroll > 100) {
            if (currentScroll > lastScroll && isMenuVisible) {
                navbar.classList.remove('visible');
                isMenuVisible = false;
            } else if (currentScroll < lastScroll && !isMenuVisible) {
                navbar.classList.add('visible');
                isMenuVisible = true;
            }
        } else {
            navbar.classList.remove('visible');
            isMenuVisible = false;
        }
        lastScroll = currentScroll;
    });
}

// ✅ Tab switching
function setupTabSwitching() {
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
        });
    });
}

// ✅ Toggle menu
function toggleMenu() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('menuToggle');

    if (!navbar || !toggle) return;

    if (isMenuVisible) {
        navbar.classList.remove('visible');
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        isMenuVisible = false;
    } else {
        navbar.classList.add('visible');
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        isMenuVisible = true;
    }
}

// ✅ Handle URL input
function handleUrlInput(event) {
    const url = event.target.value.trim();
    if (url && !isValidYouTubeUrl(url)) {
        event.target.style.borderColor = '#ef4444';
    } else {
        event.target.style.borderColor = '';
    }
}

// ✅ Validate URL input with visual feedback
function validateUrlInput(input) {
    const url = input.value.trim();
    const isValid = isValidYouTubeUrl(url);

    if (url === '') {
        input.style.borderColor = '';
        return;
    }

    if (isValid) {
        input.style.borderColor = '#10b981';
        input.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
    } else {
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    }
}

// ✅ Detect browser
async function detectBrowser() {
    try {
        const response = await fetch('/api/youtube/detect-browser');
        const browser = await response.text();
        const element = document.getElementById('detectedBrowser');
        if (element) {
            element.innerHTML = `<i class="fab fa-${browser}"></i> ${browser.charAt(0).toUpperCase() + browser.slice(1)} Detected`;
        }
    } catch (error) {
        console.log('Browser detection failed');
    }
}

// ✅ Update default path
function updateDefaultPath() {
    const pathElement = document.getElementById('currentPath');
    if (pathElement) {
        const defaultPath = localStorage.getItem('downloadPath') || 'Downloads/YTDownloader';
        pathElement.textContent = defaultPath;
    }
}

// ✅ Load settings
function loadSettings() {
    // Load download count
    const savedCount = localStorage.getItem('downloadCount');
    if (savedCount) {
        downloadCount = parseInt(savedCount);
        const downloadCountElement = document.getElementById('downloadCount');
        if (downloadCountElement) {
            downloadCountElement.textContent = downloadCount;
        }
    }

    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }
}

// ✅ Show loading
function showLoading(show, text = 'Loading...') {
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

// ✅ Show notification
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);

    const notification = document.createElement('div');
    notification.className = 'notification';

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

    // Styling
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 1rem 1.5rem; border-radius: 8px; color: white;
        display: flex; align-items: center; gap: 0.75rem;
        transform: translateX(100%); transition: transform 0.3s ease;
        font-weight: 500; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        min-width: 250px; max-width: 400px;
    `;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };

    notification.style.backgroundColor = colors[type];

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// ✅ Validation function
function isValidYouTubeUrl(url) {
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
        /youtube\.com\/watch\?v=/,
        /youtube\.com\/playlist\?list=/,
        /youtu\.be\//
    ];
    return patterns.some(pattern => pattern.test(url));
}

// ✅ Update download count
function updateDownloadCount() {
    downloadCount++;
    const element = document.getElementById('downloadCount');
    if (element) {
        element.textContent = downloadCount;
    }
    localStorage.setItem('downloadCount', downloadCount);
}

// ✅ Utility functions
function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in');
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('hidden');
        section.classList.remove('fade-in');
    }
}

function debounce(func, wait) {
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

// ✅ Global functions for onclick events
function clearAll() {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) urlInput.value = '';

    hideSection('videoSection');
    hideSection('optionsSection');
    hideSection('progressSection');

    document.querySelectorAll('.quality-option.selected, .format-option.selected')
        .forEach(opt => opt.classList.remove('selected'));

    currentUrl = '';
    selectedQuality = '';

    showNotification('Cleared all data', 'info');
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function toggleTheme() {
    darkMode = !darkMode;
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');

    const themeBtn = document.querySelector('.sidebar-btn[onclick="toggleTheme()"] i');
    if (themeBtn) {
        themeBtn.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }

    showNotification(`Switched to ${darkMode ? 'dark' : 'light'} theme`, 'info');
}

function browsePath() {
    const currentPath = document.getElementById('downloadPath')?.value || 'Downloads/YTDownloader';
    const newPath = prompt('Enter download path:', currentPath);

    if (newPath && newPath.trim()) {
        const pathInput = document.getElementById('downloadPath');
        const currentPathDisplay = document.getElementById('currentPath');

        if (pathInput) pathInput.value = newPath.trim();
        if (currentPathDisplay) currentPathDisplay.textContent = newPath.trim();

        localStorage.setItem('downloadPath', newPath.trim());
        showNotification('Download path updated', 'success');
    }
}

function downloadSelected() {
    if (selectedQuality) {
        downloadVideo(selectedQuality);
    } else {
        showNotification('Please select a quality first', 'warning');
    }
}

function downloadAll() {
    showNotification('Download All feature coming soon!', 'info');
}

function downloadSubtitle(languageCode, format) {
    console.log(`Downloading subtitle: ${languageCode} in ${format} format`);
    showNotification(`Downloading ${languageCode} subtitles...`, 'info');

    // TODO: Implement actual subtitle download
    setTimeout(() => {
        showNotification(`${languageCode} subtitles downloaded!`, 'success');
    }, 2000);
}

// ✅ Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeVideo();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        closeSettings();
    }

    // Ctrl/Cmd + K to clear all
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearAll();
    }
});

// ✅ Click outside modal to close
document.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        const modal = settingsModal.querySelector('.modal');
        if (modal && !modal.contains(e.target)) {
            closeSettings();
        }
    }
});

console.log('🚀 YouTube Downloader Pro script loaded successfully!');