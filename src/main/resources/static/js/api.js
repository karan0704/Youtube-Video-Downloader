// API Controller for backend communication
class APIController {
    constructor(app) {
        this.app = app;
        this.baseURL = '/api/youtube';
    }

    async analyzeVideo() {
        const urlInput = document.getElementById('urlInput');
        if (!urlInput) {
            this.app.showNotification('URL input field not found!', 'error');
            return;
        }

        const url = urlInput.value.trim();

        if (!url) {
            this.app.showNotification('Please enter a YouTube URL', 'warning');
            return;
        }

        if (!this.app.isValidYouTubeUrl(url)) {
            this.app.showNotification('Please enter a valid YouTube URL', 'error');
            return;
        }

        this.app.currentUrl = url;
        console.log('🔍 Analyzing URL:', url);

        this.app.showLoading(true, 'Analyzing video...');

        try {
            const response = await fetch(`${this.baseURL}/check-quality`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(url)
            });

            if (response.ok) {
                const videoInfos = await response.json();
                console.log('✅ Video info received:', videoInfos);

                if (videoInfos && videoInfos.length > 0) {
                    window.uiController.displayVideoInfo(videoInfos[0]);
                    await this.loadSubtitles(url);
                    this.app.showNotification('Video analyzed successfully!', 'success');
                } else {
                    throw new Error('No video information received');
                }
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to analyze video');
            }
        } catch (error) {
            console.error('❌ Analysis error:', error);
            this.app.showNotification(`Analysis failed: ${error.message}`, 'error');
        } finally {
            this.app.showLoading(false);
        }
    }

    async loadSubtitles(url) {
        try {
            const response = await fetch(`${this.baseURL}/get-subtitles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(url)
            });

            if (response.ok) {
                const subtitles = await response.json();
                window.uiController.displaySubtitles(subtitles);
            }
        } catch (error) {
            console.warn('⚠️ Could not load subtitles:', error);
        }
    }

    async downloadVideo() {
        if (!this.app.currentUrl) {
            this.app.showNotification('Please analyze a video first', 'warning');
            return;
        }

        if (!this.app.selectedQuality) {
            this.app.showNotification('Please select a quality', 'warning');
            return;
        }

        const downloadPath = document.getElementById('downloadPath')?.value || '';
        const browserChoice = document.getElementById('browserChoice')?.value || 'chrome';

        const request = {
            url: this.app.currentUrl,
            quality: this.app.selectedQuality,
            downloadPath: downloadPath,
            browserType: browserChoice
        };

        console.log('⬬ Starting download:', request);

        this.app.showLoading(true, 'Starting download...');
        this.showProgressSection();

        try {
            // Simulate progress updates
            this.simulateProgress();

            const response = await fetch(`${this.baseURL}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (response.ok) {
                const result = await response.text();
                console.log('✅ Download completed:', result);

                this.app.downloadCount++;
                localStorage.setItem('downloadCount', this.app.downloadCount.toString());

                const downloadCountElement = document.getElementById('downloadCount');
                if (downloadCountElement) {
                    downloadCountElement.textContent = this.app.downloadCount;
                }

                this.app.updateProgress(100, 'Complete');
                this.app.showNotification('Download completed successfully!', 'success');

                setTimeout(() => {
                    this.hideProgressSection();
                }, 2000);

            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Download failed');
            }
        } catch (error) {
            console.error('❌ Download error:', error);
            this.app.showNotification(`Download failed: ${error.message}`, 'error');
            this.hideProgressSection();
        } finally {
            this.app.showLoading(false);
        }
    }

    async downloadAll() {
        this.app.showNotification('Download All feature coming soon!', 'info');
    }

    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 95) {
                clearInterval(interval);
                progress = 95;
            }

            this.app.updateProgress(Math.round(progress), 'Downloading...');
        }, 500);
    }

    showProgressSection() {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.classList.remove('hidden');
            progressSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hideProgressSection() {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            setTimeout(() => {
                progressSection.classList.add('hidden');
            }, 1000);
        }
    }

    async detectBrowser() {
        try {
            const response = await fetch(`${this.baseURL}/detect-browser`);
            const browser = await response.text();
            return browser || 'chrome';
        } catch (error) {
            console.warn('Browser detection failed:', error);
            return 'chrome';
        }
    }
}

// Initialize API Controller
window.apiController = new APIController(window.app);