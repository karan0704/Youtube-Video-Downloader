// Global variables
let currentUrl = '';
let selectedQuality = '';
let selectedPath = 'default';
let downloadInProgress = false;
let downloadCount = 0;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set default download path
    updateDefaultPath();

    // Add event listeners for path selection
    setupPathSelection();

    // Focus on URL input
    document.getElementById('urlInput').focus();

    // Add keyboard shortcuts
    setupKeyboardShortcuts();
}

function updateDefaultPath() {
    const defaultPathElement = document.getElementById('defaultPath');
    const userHome = 'C:\\Users\\' + (localStorage.getItem('username') || 'YourName');
    const defaultPath = userHome + '\\Downloads\\YouTubeDownloader';
    defaultPathElement.textContent = defaultPath;
}

function setupPathSelection() {
    const pathOptions = document.querySelectorAll('.path-option');
    const customPathInput = document.getElementById('customPathInput');

    pathOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            pathOptions.forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            this.classList.add('active');

            // Update selected path
            selectedPath = this.dataset.path;

            // Show/hide custom path input
            if (selectedPath === 'custom') {
                customPathInput.classList.remove('hidden');
            } else {
                customPathInput.classList.add('hidden');
            }

            // Update radio button
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Enter to analyze video
        if (e.key === 'Enter' && e.ctrlKey && !downloadInProgress) {
            checkQualities();
        }

        // Escape to close modal
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // URL input enter key
    document.getElementById('urlInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!downloadInProgress) {
                checkQualities();
            }
        }
    });
}

async function checkQualities() {
    const url = document.getElementById('urlInput').value.trim();

    if (!url) {
        showStatus('⚠️ Please enter a YouTube URL', 'error');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showStatus('❌ Please enter a valid YouTube URL', 'error');
        return;
    }

    currentUrl = url;
    showLoading(true);
    hideElements(['videoSection', 'qualitySection', 'progressSection']);

    try {
        showStatus('🔍 Analyzing video...', 'info');

        const response = await fetch('/api/youtube/check-quality', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(url)
        });

        showLoading(false);

        if (response.ok) {
            const videoInfos = await response.json();
            if (videoInfos && videoInfos.length > 0) {
                displayVideoInformation(videoInfos);
                showStatus('✅ Video analysis complete', 'success');
            } else {
                showStatus('❌ No video information found', 'error');
            }
        } else {
            showStatus('❌ Error analyzing video. Please check your URL.', 'error');
        }
    } catch (error) {
        showLoading(false);
        showStatus(`❌ Network error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

function displayVideoInformation(videoInfos) {
    const videoInfo = videoInfos[0];

    // Check if it's an age-restricted video
    const isAgeRestricted = videoInfo.title.includes("Age-Restricted");

    // Update video information section
    const videoInfoElement = document.getElementById('videoInfo');
    videoInfoElement.innerHTML = `
        <div class="video-card ${isAgeRestricted ? 'age-restricted' : ''}">
            <img src="${videoInfo.thumbnail || 'https://via.placeholder.com/160x90?text=Age+Restricted'}" 
                 alt="Video thumbnail" class="video-thumbnail">
            <div class="video-details">
                <h4 class="video-title">${escapeHtml(videoInfo.title)}</h4>
                ${isAgeRestricted ?
        '<div class="age-warning">🔞 <strong>This video is age-restricted.</strong> Download may require YouTube cookies for authentication.</div>' :
        ''
    }
                <div class="video-meta">
                    <div class="video-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${videoInfo.duration}</span>
                    </div>
                    <div class="video-meta-item">
                        <i class="fas fa-link"></i>
                        <a href="${videoInfo.url}" target="_blank" rel="noopener">View on YouTube</a>
                    </div>
                    ${isAgeRestricted ?
        '<div class="video-meta-item"><i class="fas fa-exclamation-triangle"></i><span>Age verification may be required</span></div>' :
        '<div class="video-meta-item"><i class="fas fa-list"></i><span>' + (videoInfo.availableQualities ? videoInfo.availableQualities.length : 0) + ' quality options</span></div>'
    }
                </div>
            </div>
        </div>
    `;

    // Display quality options
    displayQualityOptions(videoInfo.availableQualities);

    // Show sections
    showElements(['videoSection', 'qualitySection']);

    // Show appropriate status message
    if (isAgeRestricted) {
        showStatus('🔞 Age-restricted video detected. Download may require additional authentication.', 'info');
    } else {
        showStatus('✅ Video analysis complete', 'success');
    }
}

function displayQualityOptions(qualities) {
    const qualityGrid = document.getElementById('qualityGrid');
    qualityGrid.innerHTML = '';

    const qualityDescriptions = {
        '1080p': 'Full HD',
        '720p': 'HD Ready',
        '480p': 'Standard',
        '360p': 'Low Quality',
        'best': 'Best Available',
        'worst': 'Smallest Size'
    };

    const qualityIcons = {
        '1080p': 'fas fa-star',
        '720p': 'fas fa-hd-video',
        '480p': 'fas fa-video',
        '360p': 'fas fa-mobile-alt',
        'best': 'fas fa-crown',
        'worst': 'fas fa-compress'
    };

    qualities.forEach(quality => {
        const qualityOption = document.createElement('div');
        qualityOption.className = 'quality-option';
        qualityOption.onclick = () => selectQuality(quality, qualityOption);

        qualityOption.innerHTML = `
            <i class="${qualityIcons[quality] || 'fas fa-video'}"></i>
            <div class="quality-label">${quality}</div>
            <div class="quality-description">${qualityDescriptions[quality] || 'Video Quality'}</div>
        `;

        qualityGrid.appendChild(qualityOption);
    });

    // Reset selection
    selectedQuality = '';
    updateDownloadButton();
}

function selectQuality(quality, element) {
    selectedQuality = quality;

    // Update UI
    document.querySelectorAll('.quality-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');

    updateDownloadButton();
    showStatus(`📺 Selected quality: ${quality}`, 'info');
}

function updateDownloadButton() {
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = !selectedQuality || downloadInProgress;

    if (selectedQuality && !downloadInProgress) {
        downloadBtn.innerHTML = `
            <i class="fas fa-cloud-download-alt"></i>
            <span>Download Video</span>
            <div class="btn-shine"></div>
        `;
    } else if (downloadInProgress) {
        downloadBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Downloading...</span>
        `;
    } else {
        downloadBtn.innerHTML = `
            <i class="fas fa-hand-pointer"></i>
            <span>Select Quality First</span>
        `;
    }
}

async function downloadVideo() {
    if (!selectedQuality) {
        showStatus('⚠️ Please select a quality first', 'error');
        return;
    }

    if (!currentUrl) {
        showStatus('⚠️ No video URL found', 'error');
        return;
    }

    if (downloadInProgress) {
        return;
    }

    // Get download path
    let downloadPath = getSelectedPath();
    if (!downloadPath) {
        showStatus('⚠️ Please select a download location', 'error');
        return;
    }

    downloadInProgress = true;
    updateDownloadButton();
    showDownloadProgress(true);

    try {
        const requestBody = {
            url: currentUrl,
            quality: selectedQuality,
            downloadPath: downloadPath  // Send path to backend
        };

        showStatus('⬇️ Starting download...', 'info');

        const response = await fetch('/api/youtube/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const result = await response.text();

            // Update download count
            downloadCount++;
            updateDownloadCount();

            showSuccessModal(result, downloadPath);
            showStatus('✅ Download completed successfully!', 'success');

            // Auto-hide progress after success
            setTimeout(() => {
                showDownloadProgress(false);
            }, 2000);

        } else {
            const errorText = await response.text();
            showStatus(`❌ Download failed: ${errorText}`, 'error');
            showDownloadProgress(false);
        }
    } catch (error) {
        showStatus(`❌ Download error: ${error.message}`, 'error');
        console.error('Download error:', error);
        showDownloadProgress(false);
    } finally {
        downloadInProgress = false;
        updateDownloadButton();
    }
}

function getSelectedPath() {
    if (selectedPath === 'default') {
        const userHome = 'C:\\Users\\' + (localStorage.getItem('username') || 'YourName');
        return userHome + '\\Downloads\\YouTubeDownloader';
    } else if (selectedPath === 'custom') {
        const customPath = document.getElementById('customPath').value.trim();
        if (!customPath) {
            return null;
        }
        return customPath;
    }
    return null;
}

function browseFolder() {
    // In a real web app, you'd need a file picker API or electron integration
    // For now, show instruction to user
    showStatus('💡 Enter your folder path manually in the text field', 'info');
    document.getElementById('customPath').focus();
}

function showLoading(show) {
    const loadingSection = document.getElementById('loadingSection');
    if (show) {
        loadingSection.classList.remove('hidden');
    } else {
        loadingSection.classList.add('hidden');
    }
}

function showDownloadProgress(show) {
    const progressSection = document.getElementById('progressSection');
    if (show) {
        progressSection.classList.remove('hidden');
        updateProgress(0, 'Preparing download...', 'Initializing download process');
        simulateProgress();
    } else {
        progressSection.classList.add('hidden');
    }
}

function updateProgress(percentage, title, status) {
    // Update circular progress
    const progressCircle = document.getElementById('progressCircle');
    const progressPercent = document.getElementById('progressPercent');
    const circumference = 2 * Math.PI * 15.9155;
    const offset = circumference - (percentage / 100) * circumference;

    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
    progressPercent.textContent = Math.round(percentage) + '%';

    // Update linear progress
    document.getElementById('progressFill').style.width = percentage + '%';

    // Update text
    document.getElementById('progressTitle').textContent = title;
    document.getElementById('progressStatus').textContent = status;
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;

        let title, status;
        if (progress < 20) {
            title = 'Connecting to server...';
            status = 'Establishing connection with YouTube servers';
        } else if (progress < 40) {
            title = 'Processing video...';
            status = 'Analyzing video format and quality options';
        } else if (progress < 80) {
            title = 'Downloading video...';
            status = 'Downloading video content in selected quality';
        } else {
            title = 'Finalizing download...';
            status = 'Processing and saving video file';
        }

        updateProgress(progress, title, status);

        if (!downloadInProgress) {
            clearInterval(interval);
            if (downloadInProgress === false && progress < 100) {
                // Download completed successfully
                updateProgress(100, 'Download Complete!', 'Video saved successfully');
            }
        }
    }, 500);
}

function updateDownloadCount() {
    document.getElementById('downloadCount').textContent = downloadCount;

    // Store in localStorage
    localStorage.setItem('downloadCount', downloadCount);
}

function showSuccessModal(message, path) {
    const modal = document.getElementById('successModal');
    const messageElement = document.getElementById('downloadSuccessMessage');

    messageElement.innerHTML = `
        <strong>${message}</strong><br>
        <small style="opacity: 0.8;">Saved to: ${path}</small>
    `;

    modal.classList.remove('hidden');

    // Auto-close after 5 seconds
    setTimeout(() => {
        closeModal();
    }, 5000);
}

function closeModal() {
    document.getElementById('successModal').classList.add('hidden');
}

function showStatus(message, type) {
    const statusContainer = document.getElementById('statusContainer');

    // Create status message element
    const statusElement = document.createElement('div');
    statusElement.className = `status-message ${type}`;

    // Add appropriate icon
    let icon = '';
    switch(type) {
        case 'info': icon = '<i class="fas fa-info-circle"></i>'; break;
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
        default: icon = '<i class="fas fa-bell"></i>'; break;
    }

    statusElement.innerHTML = `${icon}<span>${message}</span>`;

    // Add to container
    statusContainer.appendChild(statusElement);

    // Show with animation
    setTimeout(() => {
        statusElement.classList.add('show');
    }, 100);

    // Auto-remove after delay
    const delay = type === 'error' ? 6000 : 4000;
    setTimeout(() => {
        statusElement.classList.remove('show');
        setTimeout(() => {
            if (statusContainer.contains(statusElement)) {
                statusContainer.removeChild(statusElement);
            }
        }, 300);
    }, delay);
}

function hideElements(elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

function showElements(elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('hidden');
        }
    });
}

function isValidYouTubeUrl(url) {
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})|youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/;
    return youtubeRegex.test(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load download count from localStorage on startup
document.addEventListener('DOMContentLoaded', function() {
    const savedCount = localStorage.getItem('downloadCount');
    if (savedCount) {
        downloadCount = parseInt(savedCount);
        updateDownloadCount();
    }
});
function isPlaylistUrl(url) {
    return url.includes('playlist?list=') || url.includes('&list=');
}

function displayVideoInformation(videoInfos) {
    const videoInfo = videoInfos[0];

    // Check if it's age-restricted
    const isAgeRestricted = videoInfo.title.includes("Age-Restricted");

    const videoInfoElement = document.getElementById('videoInfo');
    videoInfoElement.innerHTML = `
        <div class="video-card ${isAgeRestricted ? 'age-restricted' : ''}">
            <img src="${videoInfo.thumbnail}" alt="Video thumbnail" class="video-thumbnail">
            <div class="video-details">
                <h4 class="video-title">${escapeHtml(videoInfo.title)}</h4>
                ${isAgeRestricted ?
        '<div class="age-warning">🔞 <strong>This video is age-restricted.</strong> Download may work but requires YouTube authentication for full access.</div>' :
        ''
    }
                <div class="video-meta">
                    <div class="video-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${videoInfo.duration}</span>
                    </div>
                    <div class="video-meta-item">
                        <i class="fas fa-link"></i>
                        <a href="${videoInfo.url}" target="_blank">View on YouTube</a>
                    </div>
                    ${isAgeRestricted ?
        '<div class="video-meta-item"><i class="fas fa-exclamation-triangle"></i><span>May require browser cookies for download</span></div>' :
        '<div class="video-meta-item"><i class="fas fa-list"></i><span>' + videoInfo.availableQualities.length + ' quality options</span></div>'
    }
                </div>
            </div>
        </div>
    `;

    // Show quality options (even for age-restricted videos)
    displayQualityOptions(videoInfo.availableQualities);
    showElements(['videoSection', 'qualitySection']);

    if (isAgeRestricted) {
        showStatus('🔞 Age-restricted video detected. Download may still work with "best" quality.', 'info');
    } else {
        showStatus('✅ Video analysis complete', 'success');
    }
}
// Add playlist download option
function displayQualityOptions(qualities) {
    const qualityGrid = document.getElementById('qualityGrid');
    qualityGrid.innerHTML = '';

    // Add playlist option if it's a playlist URL
    if (isPlaylistUrl(currentUrl)) {
        const playlistOption = document.createElement('div');
        playlistOption.className = 'quality-option playlist-option';
        playlistOption.onclick = () => selectQuality('playlist-all', playlistOption);

        playlistOption.innerHTML = `
            <i class="fas fa-list"></i>
            <div class="quality-label">Full Playlist</div>
            <div class="quality-description">Download all videos</div>
        `;

        qualityGrid.appendChild(playlistOption);
    }

    // Rest of your existing quality options...
    qualities.forEach(quality => {
        // Your existing code
    });
}
// Add browser selection setup
function setupBrowserSelection() {
    const browserOptions = document.querySelectorAll('.browser-option');

    browserOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            browserOptions.forEach(opt => opt.classList.remove('active'));

            // Add active class to clicked option
            this.classList.add('active');

            // Update radio button
            this.querySelector('input[type="radio"]').checked = true;

            const browser = this.dataset.browser;
            showStatus(`🔐 Selected ${browser} for authentication`, 'info');
        });
    });
}

// Update download function to include browser type
async function downloadVideo() {
    if (!selectedQuality) {
        showStatus('⚠️ Please select a quality first', 'error');
        return;
    }

    if (!currentUrl) {
        showStatus('⚠️ No video URL found', 'error');
        return;
    }

    if (downloadInProgress) {
        return;
    }

    // Get selected browser for authentication
    const selectedBrowser = document.querySelector('input[name="browserType"]:checked').value;
    let downloadPath = getSelectedPath();

    downloadInProgress = true;
    updateDownloadButton();
    showDownloadProgress(true);

    try {
        const requestBody = {
            url: currentUrl,
            quality: selectedQuality,
            downloadPath: downloadPath,
            browserType: selectedBrowser  // ✅ Send browser type
        };

        showStatus(`⬇️ Starting download with ${selectedBrowser} authentication...`, 'info');

        const response = await fetch('/api/youtube/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const result = await response.text();
            downloadCount++;
            updateDownloadCount();
            showSuccessModal(result, downloadPath);
            showStatus('✅ Download completed with authentication!', 'success');
            setTimeout(() => showDownloadProgress(false), 2000);
        } else {
            const errorText = await response.text();
            if (errorText.includes('authentication') || errorText.includes('cookies')) {
                showStatus('🔐 Authentication failed. Please make sure you\'re logged into YouTube in your browser.', 'error');
            } else {
                showStatus(`❌ Download failed: ${errorText}`, 'error');
            }
            showDownloadProgress(false);
        }
    } catch (error) {
        showStatus(`❌ Download error: ${error.message}`, 'error');
        showDownloadProgress(false);
    } finally {
        downloadInProgress = false;
        updateDownloadButton();
    }
}

// Update initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupBrowserSelection(); // ✅ Add browser selection setup
});
