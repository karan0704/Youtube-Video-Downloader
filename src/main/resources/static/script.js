// Wait for the page to fully load before running any code
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded successfully!');
    initializeApp();
});

// Global variables
let currentUrl = '';
let selectedQuality = '';
let selectedFormat = 'video';
let downloadCount = 0;
let isMenuVisible = false;

function initializeApp() {
    console.log('Initializing app...');
    setupEventListeners();
    detectBrowser();
    loadDownloadCount();
    setupScrollHandler();
    setupTabSwitching();
}

function setupEventListeners() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    } else {
        console.log('Menu toggle button not found');
    }

    // URL input
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('input', handleUrlInput);
    } else {
        console.log('URL input not found');
    }
}

// This is the function your button calls - MAKE SURE IT'S HERE
function analyzeVideo() {
    console.log('Analyze button clicked!');

    const urlInput = document.getElementById('urlInput');
    if (!urlInput) {
        alert('URL input field not found!');
        return;
    }

    const url = urlInput.value.trim();

    if (!url) {
        alert('Please enter a YouTube URL');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        alert('Please enter a valid YouTube URL');
        return;
    }

    currentUrl = url;
    console.log('Analyzing URL:', url);

    // Show loading
    showLoading(true);

    // Make API call to your backend
    fetch('/api/youtube/check-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(url)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to analyze video');
            }
        })
        .then(videoInfos => {
            console.log('Video info received:', videoInfos);
            displayVideoInfo(videoInfos[0]);
            showNotification('Video analyzed successfully!', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Failed to analyze video: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function handleUrlInput(event) {
    const url = event.target.value.trim();
    if (url && !isValidYouTubeUrl(url)) {
        event.target.style.borderColor = '#ef4444';
    } else {
        event.target.style.borderColor = '';
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

            selectedFormat = btn.dataset.tab;
        });
    });
}

function displayVideoInfo(videoInfo) {
    const videoSection = document.getElementById('videoSection');
    if (!videoSection) {
        console.log('Video section not found');
        return;
    }

    videoSection.innerHTML = `
        <div class="video-card">
            <img src="${videoInfo.thumbnail || ''}" alt="Thumbnail" class="video-thumbnail">
            <div class="video-details">
                <h3>${videoInfo.title || 'Video Title'}</h3>
                <p><i class="fas fa-clock"></i> ${videoInfo.duration || 'Unknown'}</p>
            </div>
        </div>
    `;

    if (videoInfo.availableQualities) {
        displayQualityOptions(videoInfo.availableQualities);
    }

    videoSection.classList.remove('hidden');

    const optionsSection = document.getElementById('optionsSection');
    if (optionsSection) {
        optionsSection.classList.remove('hidden');
    }
}

function displayQualityOptions(qualities) {
    const qualityGrid = document.getElementById('qualityGrid');
    if (!qualityGrid) return;

    qualityGrid.innerHTML = '';

    const qualityLabels = {
        '1080p': 'Full HD',
        '720p': 'HD',
        '480p': 'SD',
        '360p': 'Low',
        'best': 'Best Quality',
        'worst': 'Smallest Size'
    };

    qualities.forEach(quality => {
        const option = document.createElement('div');
        option.className = 'quality-option';
        option.onclick = () => selectQuality(quality, option);

        option.innerHTML = `
            <i class="fas fa-video"></i>
            <h4>${quality}</h4>
            <p>${qualityLabels[quality] || 'Standard'}</p>
        `;

        qualityGrid.appendChild(option);
    });
}

function selectQuality(quality, element) {
    document.querySelectorAll('.quality-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedQuality = quality;

    showNotification(`Selected quality: ${quality}`, 'info');
}

async function detectBrowser() {
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
        console.log('Browser detection failed:', error);
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingOverlay');
    if (!loading) {
        console.log('Loading overlay not found');
        return;
    }

    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
        ${message}
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    if (type === 'success') notification.style.backgroundColor = '#10b981';
    else if (type === 'error') notification.style.backgroundColor = '#ef4444';
    else notification.style.backgroundColor = '#6366f1';

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
    }, 3000);
}

function isValidYouTubeUrl(url) {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url);
}

function loadDownloadCount() {
    const saved = localStorage.getItem('downloadCount');
    if (saved) {
        downloadCount = parseInt(saved);
        const downloadCountElement = document.getElementById('downloadCount');
        if (downloadCountElement) {
            downloadCountElement.textContent = downloadCount;
        }
    }
}

function clearAll() {
    const urlInput = document.getElementById('urlInput');
    const videoSection = document.getElementById('videoSection');
    const optionsSection = document.getElementById('optionsSection');

    if (urlInput) urlInput.value = '';
    if (videoSection) videoSection.classList.add('hidden');
    if (optionsSection) optionsSection.classList.add('hidden');

    showNotification('Cleared all data', 'info');
}

function openSettings() {
    showNotification('Settings panel coming soon!', 'info');
}

// Make functions available globally for onclick events
window.analyzeVideo = analyzeVideo;
window.clearAll = clearAll;
window.openSettings = openSettings;
