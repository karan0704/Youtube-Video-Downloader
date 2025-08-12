// Global variables
let currentUrl = '';
let selectedQuality = '';
let downloadCount = 0;
let isMenuVisible = false;
let selectedSubtitleLanguages = [];
let selectedSubtitleFormats = ['srt'];
let downloadType = 'video'; // Default
let selectedAudioFormat = 'mp3';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ YouTube Downloader Pro initialized!');
    setupEventListeners();
    detectBrowser();
    updateDefaultPath();
    setupScrollHandler();
    setupTabSwitching();
    setupDownloadTypeSelector();
    loadSettings();
});

function setupEventListeners() {
    const menuToggle = document.getElementById('menuToggle');
    const urlInput = document.getElementById('urlInput');

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    if (urlInput) {
        urlInput.addEventListener('input', handleUrlInput);
    }

    // Quality option clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('.quality-option')) {
            const option = e.target.closest('.quality-option');
            selectQuality(option);
        }
    });
}

// ✅ Setup download type selector
function setupDownloadTypeSelector() {
    const typeBtns = document.querySelectorAll('.download-type-btn');

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            downloadType = btn.dataset.type;
            updateUIForDownloadType(downloadType);
            showNotification(`Selected: ${getDownloadTypeLabel(downloadType)}`, 'info');
        });
    });
}

function getDownloadTypeLabel(type) {
    const labels = {
        'video': 'Video Only',
        'audio': 'Audio Only',
        'subtitles': 'Subtitles Only',
        'video+subtitles': 'Video + Subtitles',
        'audio+subtitles': 'Audio + Subtitles'
    };
    return labels[type] || 'Unknown';
}

function updateUIForDownloadType(type) {
    const subtitlesTab = document.querySelector('[data-tab="subtitles"]');
    const videoTab = document.querySelector('[data-tab="video"]');
    const audioTab = document.querySelector('[data-tab="audio"]');

    // Show/hide tabs based on download type
    if (type.includes('subtitles')) {
        subtitlesTab.style.display = 'flex';
    }

    // Auto-switch to relevant tab
    if (type === 'audio' || type === 'audio+subtitles') {
        switchToTab('audio');
    } else if (type === 'subtitles') {
        switchToTab('subtitles');
    } else {
        switchToTab('video');
    }
}

function switchToTab(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`${tabName}-tab`);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
}

// ✅ Select audio format
function selectAudioFormat(format, element) {
    document.querySelectorAll('.format-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedAudioFormat = format;
}

// ✅ MAIN ANALYZE FUNCTION
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

    // Call your Spring Boot backend
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
                loadSubtitles(url);
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

function displayVideoInfo(videoInfo) {
    const videoSection = document.getElementById('videoSection');
    const optionsSection = document.getElementById('optionsSection');

    if (!videoSection) return;

    // Show video card
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

    // Show sections
    showSection('videoSection');
    showSection('optionsSection');

    // Scroll to video info
    videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

// ✅ Load subtitles with enhanced UI
async function loadSubtitles(url) {
    try {
        const response = await fetch('/api/youtube/get-subtitles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(url)
        });

        if (response.ok) {
            const subtitles = await response.json();
            displaySubtitlesWithSelection(subtitles);
        }
    } catch (error) {
        console.warn('⚠️ Could not load subtitles:', error);
        displaySubtitlesWithSelection([]);
    }
}

// ✅ Enhanced subtitle display with multiple selection
function displaySubtitlesWithSelection(subtitles) {
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

    subtitleOptions.innerHTML = `
        <div class="subtitle-controls">
            <h4><i class="fas fa-check-square"></i> Select Subtitle Languages:</h4>
            <div class="subtitle-actions">
                <button class="btn-select-all" onclick="selectAllSubtitles()">
                    <i class="fas fa-check-double"></i> Select All
                </button>
                <button class="btn-clear-all" onclick="clearAllSubtitles()">
                    <i class="fas fa-times"></i> Clear All
                </button>
                <span class="subtitle-counter" id="subtitleCounter">0 selected</span>
                <button class="btn-download-subs" onclick="downloadOnlySubtitles()">
                    <i class="fas fa-download"></i> Download Selected
                </button>
            </div>
        </div>
        <div class="subtitle-grid" id="subtitleGrid"></div>
    `;

    const subtitleGrid = document.getElementById('subtitleGrid');

    subtitles.forEach(subtitle => {
        const option = document.createElement('div');
        option.className = 'subtitle-option';
        option.dataset.language = subtitle.languageCode;
        option.onclick = () => toggleSubtitleLanguage(subtitle.languageCode);

        const autoGenText = subtitle.autoGenerated ? ' (Auto-generated)' : '';

        option.innerHTML = `
            <div class="subtitle-info">
                <i class="fas fa-closed-captioning"></i>
                <div class="subtitle-details">
                    <h4>${subtitle.language}${autoGenText}</h4>
                    <p>${subtitle.languageCode} • ${subtitle.format.toUpperCase()}</p>
                </div>
                <div class="subtitle-checkbox">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `;

        subtitleGrid.appendChild(option);
    });
}

// ✅ Subtitle selection functions
function toggleSubtitleLanguage(languageCode) {
    const index = selectedSubtitleLanguages.indexOf(languageCode);
    if (index > -1) {
        selectedSubtitleLanguages.splice(index, 1);
    } else {
        selectedSubtitleLanguages.push(languageCode);
    }

    updateSubtitleSelectionUI();
    updateSubtitleCounter();
}

function updateSubtitleSelectionUI() {
    document.querySelectorAll('.subtitle-option').forEach(option => {
        const languageCode = option.dataset.language;
        if (selectedSubtitleLanguages.includes(languageCode)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

function updateSubtitleCounter() {
    const counter = document.getElementById('subtitleCounter');
    if (counter) {
        counter.textContent = `${selectedSubtitleLanguages.length} selected`;
    }
}

function selectAllSubtitles() {
    const subtitleOptions = document.querySelectorAll('.subtitle-option');
    selectedSubtitleLanguages = [];

    subtitleOptions.forEach(option => {
        const languageCode = option.dataset.language;
        selectedSubtitleLanguages.push(languageCode);
    });

    updateSubtitleSelectionUI();
    updateSubtitleCounter();
    showNotification(`Selected all ${selectedSubtitleLanguages.length} subtitle languages`, 'success');
}

function clearAllSubtitles() {
    selectedSubtitleLanguages = [];
    updateSubtitleSelectionUI();
    updateSubtitleCounter();
    showNotification('Cleared all subtitle selections', 'info');
}

// ✅ Get selected subtitle formats from checkboxes
function getSelectedSubtitleFormats() {
    const checkboxes = document.querySelectorAll('.format-checkbox input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// ✅ DOWNLOAD FUNCTIONS - Enhanced for multiple subtitle selection

function downloadVideo(quality) {
    if (!currentUrl) {
        showNotification('No video URL available', 'error');
        return;
    }

    const action = downloadType === 'video+subtitles' ? 'video with subtitles' : 'video';

    if (downloadType === 'video+subtitles' && selectedSubtitleLanguages.length === 0) {
        showNotification('Please select at least one subtitle language', 'warning');
        return;
    }

    showNotification(`Starting ${action} download...`, 'info');
    showProgressSection();
    simulateProgress();

    const downloadRequest = {
        url: currentUrl,
        quality: quality,
        downloadPath: document.getElementById('downloadPath')?.value || '',
        browserType: document.getElementById('browserChoice')?.value || 'chrome',
        downloadType: downloadType,
        subtitleLanguages: downloadType.includes('subtitles') ? selectedSubtitleLanguages : [],
        subtitleFormats: getSelectedSubtitleFormats()
    };

    const endpoint = downloadType === 'video+subtitles' ?
        '/api/youtube/download-video-with-subtitles' : '/api/youtube/download';

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadRequest)
    })
        .then(handleDownloadResponse)
        .catch(handleDownloadError);
}

function downloadAudioOnly(format) {
    if (!currentUrl) {
        showNotification('No video URL available', 'error');
        return;
    }

    const action = downloadType === 'audio+subtitles' ? 'audio with subtitles' : 'audio';

    if (downloadType === 'audio+subtitles' && selectedSubtitleLanguages.length === 0) {
        showNotification('Please select at least one subtitle language', 'warning');
        return;
    }

    showNotification(`Starting ${action} download...`, 'info');
    showProgressSection();
    simulateProgress();

    const downloadRequest = {
        url: currentUrl,
        audioFormat: format,
        downloadPath: document.getElementById('downloadPath')?.value || '',
        downloadType: downloadType,
        subtitleLanguages: downloadType.includes('subtitles') ? selectedSubtitleLanguages : [],
        subtitleFormats: getSelectedSubtitleFormats()
    };

    const endpoint = downloadType === 'audio+subtitles' ?
        '/api/youtube/download-audio-with-subtitles' : '/api/youtube/download-only-audio';

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadRequest)
    })
        .then(handleDownloadResponse)
        .catch(handleDownloadError);
}

function downloadOnlySubtitles() {
    if (!currentUrl) {
        showNotification('No video URL available', 'error');
        return;
    }

    if (selectedSubtitleLanguages.length === 0) {
        showNotification('Please select at least one subtitle language', 'warning');
        return;
    }

    showNotification(`Starting ${selectedSubtitleLanguages.length} subtitle downloads...`, 'info');
    showProgressSection();
    simulateProgress();

    const downloadRequest = {
        url: currentUrl,
        downloadPath: document.getElementById('downloadPath')?.value || '',
        downloadType: 'subtitles',
        subtitleLanguages: selectedSubtitleLanguages,
        subtitleFormats: getSelectedSubtitleFormats()
    };

    fetch('/api/youtube/download-only-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadRequest)
    })
        .then(handleDownloadResponse)
        .catch(handleDownloadError);
}

// Helper functions for download responses
function handleDownloadResponse(response) {
    if (!response.ok) {
        return response.text().then(text => {
            throw new Error(text || 'Download failed');
        });
    }
    return response.text().then(result => {
        console.log('✅ Download completed:', result);
        updateProgress(100, 'Complete');
        showNotification('🎉 Download completed!', 'success');
        updateDownloadCount();

        setTimeout(() => hideProgressSection(), 2000);
    });
}

function handleDownloadError(error) {
    console.error('❌ Download failed:', error);
    showNotification('❌ Download failed: ' + error.message, 'error');
    hideProgressSection();
}

// ✅ Rest of your existing functions (keeping them the same)
function updateDefaultPath() {
    const pathElement = document.getElementById('currentPath');
    if (pathElement) {
        pathElement.textContent = 'Downloads/YTDownloader';
        console.log('✅ Default path updated successfully');
    } else {
        console.warn('⚠️ currentPath element not found');
    }
}

function handleUrlInput(event) {
    const url = event.target.value.trim();
    if (url && !isValidYouTubeUrl(url)) {
        event.target.style.borderColor = '#ef4444';
    } else {
        event.target.style.borderColor = '';
    }
}

function selectQuality(element) {
    if (!element) return;

    document.querySelectorAll('.quality-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');

    const quality = element.dataset.quality;
    selectedQuality = quality;

    showNotification(`Selected: ${quality}`, 'info');
}

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

function updateProgress(percent, status = '') {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}%`;
    if (progressStatus && status) progressStatus.textContent = status;
}

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

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in');
    }
}

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

function loadSettings() {
    const savedCount = localStorage.getItem('downloadCount');
    if (savedCount) {
        downloadCount = parseInt(savedCount);
        const downloadCountElement = document.getElementById('downloadCount');
        if (downloadCountElement) {
            downloadCountElement.textContent = downloadCount;
        }
    }
}

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

    setTimeout(() => notification.style.transform = 'translateX(0)', 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function isValidYouTubeUrl(url) {
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
        /youtube\.com\/watch\?v=/,
        /youtube\.com\/playlist\?list=/,
        /youtu\.be\//
    ];
    return patterns.some(pattern => pattern.test(url));
}

function updateDownloadCount() {
    downloadCount++;
    const element = document.getElementById('downloadCount');
    if (element) {
        element.textContent = downloadCount;
    }
    localStorage.setItem('downloadCount', downloadCount);
}

// Global functions for onclick events
function clearAll() {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) urlInput.value = '';

    ['videoSection', 'optionsSection', 'progressSection'].forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('hidden');
    });

    document.querySelectorAll('.quality-option.selected, .format-option.selected')
        .forEach(opt => opt.classList.remove('selected'));

    currentUrl = '';
    selectedQuality = '';
    selectedSubtitleLanguages = [];
    updateSubtitleCounter();

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

function downloadSelected() {
    if (downloadType === 'video' || downloadType === 'video+subtitles') {
        if (selectedQuality) {
            downloadVideo(selectedQuality);
        } else {
            showNotification('Please select a video quality first', 'warning');
        }
    } else if (downloadType === 'audio' || downloadType === 'audio+subtitles') {
        downloadAudioOnly(selectedAudioFormat);
    } else if (downloadType === 'subtitles') {
        downloadOnlySubtitles();
    }
}

function downloadAll() {
    showNotification('Download All feature coming soon!', 'info');
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

console.log('🚀 YouTube Downloader Pro script loaded successfully!');