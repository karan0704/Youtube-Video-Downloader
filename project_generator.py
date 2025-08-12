import os

def create_complete_youtube_downloader():
    base_path = r"D:\Karan Ticket Project\Youtube VIdeo Downloader"

    # Define all file paths and their content
    files_to_create = {
        # Main Application
        f"{base_path}/src/main/java/com/karan/youtubedownloader/YoutubeVIdeoDownloaderApplication.java": get_main_app_code(),

        # Controllers
        f"{base_path}/src/main/java/com/karan/youtubedownloader/controller/YouTubeController.java": get_controller_code(),

        # Services
        f"{base_path}/src/main/java/com/karan/youtubedownloader/service/YouTubeService.java": get_service_code(),

        # Models
        f"{base_path}/src/main/java/com/karan/youtubedownloader/model/VideoInfo.java": get_video_info_model(),
        f"{base_path}/src/main/java/com/karan/youtubedownloader/model/DownloadRequest.java": get_download_request_model(),
        f"{base_path}/src/main/java/com/karan/youtubedownloader/model/DownloadHistory.java": get_download_history_model(),

        # Repository
        f"{base_path}/src/main/java/com/karan/youtubedownloader/repository/DownloadHistoryRepository.java": get_repository_code(),

        # Configuration files
        f"{base_path}/src/main/resources/application.properties": get_application_properties(),
        f"{base_path}/pom.xml": get_pom_xml(),

        # Frontend files
        f"{base_path}/src/main/resources/static/index.html": get_html_code(),
        f"{base_path}/src/main/resources/static/style.css": get_css_code(),
        f"{base_path}/src/main/resources/static/script.js": get_js_code(),
    }

    print("🚀 Starting YouTube Downloader Project Generation...")
    print("=" * 60)

    # Create all files
    for file_path, content in files_to_create.items():
        create_file(file_path, content)

    # Create additional directories
    create_directory(f"{base_path}/downloads")
    create_directory(f"{base_path}/src/main/resources/templates")

    print("\n" + "=" * 60)
    print("✅ PROJECT GENERATION COMPLETE!")
    print("🎯 Next Steps:")
    print("1. Open the project in IntelliJ IDEA")
    print("2. Install Lombok plugin in IntelliJ")
    print("3. Enable annotation processing in IntelliJ settings")
    print("4. Install yt-dlp: pip install yt-dlp")
    print("5. Create MySQL database 'youtube_downloader'")
    print("6. Update MySQL credentials in application.properties")
    print("7. Run the application!")
    print("🌐 Access at: http://localhost:8080")

def create_file(file_path, content):
    try:
        directory = os.path.dirname(file_path)
        os.makedirs(directory, exist_ok=True)

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)

        print(f"✅ Created: {os.path.basename(file_path)}")

    except Exception as e:
        print(f"❌ Error creating {file_path}: {e}")

def create_directory(dir_path):
    try:
        os.makedirs(dir_path, exist_ok=True)
        print(f"📁 Created directory: {os.path.basename(dir_path)}")
    except Exception as e:
        print(f"❌ Error creating directory {dir_path}: {e}")

# ========================= JAVA FILES =========================

def get_main_app_code():
    return '''package com.karan.youtubedownloader;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Slf4j
@SpringBootApplication
public class YoutubeVIdeoDownloaderApplication {

    public static void main(String[] args) {
        log.info("🚀 Starting YouTube Video Downloader Application...");
        SpringApplication.run(YoutubeVIdeoDownloaderApplication.class, args);
        log.info("✅ YouTube Video Downloader Application started successfully!");
        log.info("🌐 Access the app at: http://localhost:8080");
    }
}'''

def get_controller_code():
    return '''package com.karan.youtubedownloader.controller;

import com.karan.youtubedownloader.model.VideoInfo;
import com.karan.youtubedownloader.model.DownloadRequest;
import com.karan.youtubedownloader.service.YouTubeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
public class YouTubeController {

    private final YouTubeService youTubeService;

    @PostMapping("/check-quality")
    public ResponseEntity<List<VideoInfo>> checkAvailableQualities(@RequestBody String url) {
        try {
            log.info("📊 Checking available qualities for URL: {}", url);
            List<VideoInfo> videoInfos = youTubeService.getAvailableQualities(url);
            log.info("✅ Found {} videos with quality options", videoInfos.size());
            return ResponseEntity.ok(videoInfos);
        } catch (Exception e) {
            log.error("❌ Error checking qualities: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/download")
    public ResponseEntity<String> downloadVideo(@RequestBody DownloadRequest request) {
        try {
            log.info("⬇️ Starting download for URL: {} in quality: {}",
                    request.getUrl(), request.getQuality());
            String result = youTubeService.downloadVideo(request.getUrl(), request.getQuality());
            log.info("✅ Download completed successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Download failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Download failed: " + e.getMessage());
        }
    }

    @GetMapping("/download-history")
    public ResponseEntity<List<?>> getDownloadHistory() {
        try {
            // TODO: Implement download history retrieval
            return ResponseEntity.ok(List.of());
        } catch (Exception e) {
            log.error("❌ Error fetching download history: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}'''

def get_service_code():
    return '''package com.karan.youtubedownloader.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.karan.youtubedownloader.model.VideoInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class YouTubeService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<VideoInfo> getAvailableQualities(String url) throws Exception {
        log.info("🔍 Fetching video information for: {}", url);

        // Command to get video info using yt-dlp
        ProcessBuilder processBuilder = new ProcessBuilder(
            "yt-dlp",
            "--dump-json",
            "--no-playlist",
            url
        );

        Process process = processBuilder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        List<VideoInfo> videoInfos = new ArrayList<>();
        String line;

        while ((line = reader.readLine()) != null) {
            try {
                JsonNode videoData = objectMapper.readTree(line);
                VideoInfo videoInfo = parseVideoInfo(videoData);
                videoInfos.add(videoInfo);
            } catch (Exception e) {
                log.warn("⚠️ Could not parse video info line: {}", e.getMessage());
            }
        }

        process.waitFor();
        return videoInfos;
    }

    public String downloadVideo(String url, String quality) throws Exception {
        log.info("📥 Downloading video in {} quality", quality);

        ProcessBuilder processBuilder = new ProcessBuilder(
            "yt-dlp",
            "-f", quality,
            "-o", "downloads/%(title)s.%(ext)s",
            url
        );

        Process process = processBuilder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        StringBuilder output = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            log.info("yt-dlp: {}", line);
            output.append(line).append("\\n");
        }

        int exitCode = process.waitFor();
        if (exitCode == 0) {
            return "Download completed successfully!";
        } else {
            throw new RuntimeException("Download failed with exit code: " + exitCode);
        }
    }

    private VideoInfo parseVideoInfo(JsonNode videoData) {
        String title = videoData.get("title").asText();
        String duration = formatDuration(videoData.get("duration").asInt());
        String thumbnail = videoData.get("thumbnail").asText();

        List<String> availableQualities = extractQualities(videoData);

        return VideoInfo.builder()
                .title(title)
                .url(videoData.get("webpage_url").asText())
                .duration(duration)
                .thumbnail(thumbnail)
                .availableQualities(availableQualities)
                .build();
    }

    private List<String> extractQualities(JsonNode videoData) {
        List<String> qualities = new ArrayList<>();
        JsonNode formats = videoData.get("formats");

        if (formats != null && formats.isArray()) {
            for (JsonNode format : formats) {
                String quality = format.get("format_note").asText();
                if (quality != null && !quality.isEmpty() && !qualities.contains(quality)) {
                    qualities.add(quality);
                }
            }
        }

        return qualities;
    }

    private String formatDuration(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        int secs = seconds % 60;

        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, secs);
        } else {
            return String.format("%d:%02d", minutes, secs);
        }
    }
}'''

def get_video_info_model():
    return '''package com.karan.youtubedownloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoInfo {
    private String title;
    private String url;
    private String duration;
    private List<String> availableQualities;
    private String thumbnail;
}'''

def get_download_request_model():
    return '''package com.karan.youtubedownloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadRequest {
    private String url;
    private String quality;
}'''

def get_download_history_model():
    return '''package com.karan.youtubedownloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "download_history")
public class DownloadHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "video_url", nullable = false)
    private String videoUrl;

    @Column(name = "video_title")
    private String videoTitle;

    @Column(name = "quality", nullable = false)
    private String quality;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "download_date", nullable = false)
    private LocalDateTime downloadDate;

    @Column(name = "file_size")
    private Long fileSize;

    @PrePersist
    public void prePersist() {
        if (downloadDate == null) {
            downloadDate = LocalDateTime.now();
        }
    }
}'''

def get_repository_code():
    return '''package com.karan.youtubedownloader.repository;

import com.karan.youtubedownloader.model.DownloadHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DownloadHistoryRepository extends JpaRepository<DownloadHistory, Long> {

    List<DownloadHistory> findByVideoTitleContainingIgnoreCase(String title);

    List<DownloadHistory> findByDownloadDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<DownloadHistory> findTop10ByOrderByDownloadDateDesc();
}'''

# ========================= CONFIG FILES =========================

def get_application_properties():
    return '''# MySQL Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/youtube_downloader?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
spring.jpa.show-sql=true

# File upload settings
spring.servlet.multipart.max-file-size=500MB
spring.servlet.multipart.max-request-size=500MB

# Server settings
server.port=8080

# Logging
logging.level.com.karan.youtubedownloader=DEBUG
logging.level.org.springframework.web=DEBUG'''

def get_pom_xml():
    return '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.14</version>
        <relativePath/>
    </parent>
    <groupId>com.karan</groupId>
    <artifactId>youtube-video-downloader</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>Youtube Video Downloader</name>
    <description>YouTube Video Downloader with Quality Selection</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- MySQL Driver -->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version>
            <scope>provided</scope>
        </dependency>

        <!-- Jackson for JSON processing -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Test dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>'''

# ========================= FRONTEND FILES =========================

def get_html_code():
    return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Video Downloader by Karan</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🎬 YouTube Video Downloader</h1>
            <p>Download YouTube videos in your preferred quality</p>
        </header>

        <div class="input-section">
            <div class="url-input">
                <textarea id="urlInput" placeholder="Paste YouTube video or playlist URL here...
Example: https://www.youtube.com/watch?v=example"></textarea>
            </div>
            <button class="check-btn" onclick="checkQualities()">
                <span>🔍 Check Available Qualities</span>
            </button>
        </div>

        <div id="videoList" class="video-list hidden">
            <!-- Videos and their qualities will appear here -->
        </div>

        <div id="downloadSection" class="download-section hidden">
            <h3>📥 Select Quality and Download:</h3>
            <div id="qualityOptions" class="quality-grid"></div>
            <button id="downloadBtn" class="download-btn" onclick="downloadVideo()">
                ⬇️ Start Download
            </button>
        </div>

        <div id="status" class="status"></div>

        <footer>
            <p>Made with ❤️ by Karan | Powered by Spring Boot & yt-dlp</p>
        </footer>
    </div>

    <script src="script.js"></script>
</body>
</html>'''

def get_css_code():
    return '''* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

header h1 {
    font-size: 2.5em;
    color: #FF6B6B;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

header p {
    font-size: 1.2em;
    color: #666;
}

.input-section {
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.url-input textarea {
    width: 100%;
    height: 120px;
    padding: 15px;
    border: 2px solid #e1e1e1;
    border-radius: 10px;
    font-size: 16px;
    resize: vertical;
    font-family: inherit;
    background: #f9f9f9;
    transition: all 0.3s ease;
}

.url-input textarea:focus {
    outline: none;
    border-color: #4ECDC4;
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.check-btn {
    width: 100%;
    padding: 15px 30px;
    background: linear-gradient(45deg, #4ECDC4, #45B7B8);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 20px;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.check-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(78, 205, 196, 0.3);
}

.video-list {
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.video-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    border-left: 5px solid #FF6B6B;
}

.video-card h3 {
    color: #333;
    margin-bottom: 10px;
    font-size: 1.3em;
}

.video-card p {
    color: #666;
    font-size: 1.1em;
}

.download-section {
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.download-section h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 1.5em;
    text-align: center;
}

.quality-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
}

.quality-btn {
    padding: 12px 20px;
    background: linear-gradient(45deg, #96CEB4, #FFEAA7);
    color: #333;
    border: 2px solid transparent;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.quality-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    border-color: #4ECDC4;
}

.quality-btn.selected {
    background: linear-gradient(45deg, #FF6B6B, #FF8E53);
    color: white;
    border-color: #FF6B6B;
    transform: scale(1.05);
}

.download-btn {
    width: 100%;
    padding: 18px 30px;
    background: linear-gradient(45deg, #FF6B6B, #FF8E53);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.download-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
}

.status {
    text-align: center;
    padding: 15px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    margin: 20px 0;
    opacity: 0;
    transition: all 0.3s ease;
}

.status.info {
    background: linear-gradient(45deg, #74b9ff, #0984e3);
    color: white;
    opacity: 1;
}

.status.success {
    background: linear-gradient(45deg, #00b894, #00a085);
    color: white;
    opacity: 1;
}

.status.error {
    background: linear-gradient(45deg, #e17055, #d63031);
    color: white;
    opacity: 1;
}

.hidden {
    display: none;
}

footer {
    text-align: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: white;
    margin-top: 30px;
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }

    header h1 {
        font-size: 2em;
    }

    .quality-grid {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
    }

    .quality-btn {
        padding: 10px 15px;
        font-size: 14px;
    }
}'''

def get_js_code():
    return '''let currentUrl = '';
let selectedQuality = '';

async function checkQualities() {
    const url = document.getElementById('urlInput').value.trim();

    if (!url) {
        showStatus('Please enter a YouTube URL', 'error');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showStatus('Please enter a valid YouTube URL', 'error');
        return;
    }

    currentUrl = url;
    showStatus('🔍 Checking available qualities...', 'info');
    hideElements(['videoList', 'downloadSection']);

    try {
        const response = await fetch('/api/youtube/check-quality', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(url)
        });

        if (response.ok) {
            const videoInfos = await response.json();
            if (videoInfos && videoInfos.length > 0) {
                displayVideoQualities(videoInfos);
            } else {
                showStatus('No video information found', 'error');
            }
        } else {
            showStatus('Error checking video qualities. Please check your URL.', 'error');
        }
    } catch (error) {
        showStatus(`Network error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

function displayVideoQualities(videoInfos) {
    const videoList = document.getElementById('videoList');
    const downloadSection = document.getElementById('downloadSection');
    const qualityOptions = document.getElementById('qualityOptions');

    // Clear previous results
    videoList.innerHTML = '';
    qualityOptions.innerHTML = '';
    selectedQuality = '';

    if (videoInfos.length > 0) {
        const video = videoInfos[0];

        // Display video info
        videoList.innerHTML = `
            <div class="video-card">
                <h3>🎬 ${escapeHtml(video.title)}</h3>
                <p><strong>⏱️ Duration:</strong> ${video.duration}</p>
                <p><strong>🔗 URL:</strong> <a href="${video.url}" target="_blank">View on YouTube</a></p>
            </div>
        `;

        // Display available qualities
        if (video.availableQualities && video.availableQualities.length > 0) {
            video.availableQualities.forEach(quality => {
                const button = document.createElement('button');
                button.textContent = `📺 ${quality}`;
                button.className = 'quality-btn';
                button.onclick = () => selectQuality(quality, button);
                qualityOptions.appendChild(button);
            });

            showElements(['videoList', 'downloadSection']);
            showStatus('✅ Select a quality to download', 'success');
        } else {
            showStatus('No download qualities available for this video', 'error');
            showElements(['videoList']);
        }
    }
}

function selectQuality(quality, buttonElement) {
    selectedQuality = quality;

    // Update button styles
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    buttonElement.classList.add('selected');

    showStatus(`📺 Selected quality: ${quality}`, 'info');
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

    showStatus('⬇️ Starting download... Please wait...', 'info');

    try {
        const requestBody = {
            url: currentUrl,
            quality: selectedQuality
        };

        const response = await fetch('/api/youtube/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const result = await response.text();
            showStatus(`✅ ${result}`, 'success');
        } else {
            const errorText = await response.text();
            showStatus(`❌ Download failed: ${errorText}`, 'error');
        }
    } catch (error) {
        showStatus(`❌ Download error: ${error.message}`, 'error');
        console.error('Download error:', error);
    }
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
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
    const youtubeRegex = /^https?:\\/\\/(www\\.)?(youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})|youtube\\.com\\/playlist\\?list=([a-zA-Z0-9_-]+)/;
    return youtubeRegex.test(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter key support for URL input
document.getElementById('urlInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        checkQualities();
    }
});

// Auto-clear status after some time
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            status.style.opacity = '0';
        }, 5000);
    }
}'''

# Run the generator
if __name__ == "__main__":
    create_complete_youtube_downloader()