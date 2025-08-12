package com.karan.youtubedownloader.controller;

import com.karan.youtubedownloader.model.DownloadRequest;
import com.karan.youtubedownloader.model.SubtitleDownloadRequest;
import com.karan.youtubedownloader.model.SubtitleInfo;
import com.karan.youtubedownloader.model.VideoInfo;
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
            String downloadType = request.getDownloadType() != null ? request.getDownloadType() : "video";

            switch (downloadType.toLowerCase()) {
                case "video+subtitles":
                    return downloadVideoWithSubtitles(request);
                case "audio+subtitles":
                    return downloadAudioWithSubtitles(request);
                case "subtitles":
                    return downloadOnlySubtitles(request);
                case "audio":
                    return downloadOnlyAudio(request);
                case "video":
                default:
                    String result = youTubeService.downloadVideo(request.getUrl(), request.getQuality(), request.getDownloadPath());
                    return ResponseEntity.ok(result);
            }
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

    @PostMapping("/get-subtitles")
    public ResponseEntity<List<SubtitleInfo>> getAvailableSubtitles(@RequestBody String url) {
        try {
            log.info("🎬 Getting available subtitles for URL: {}", url);
            List<SubtitleInfo> subtitles = youTubeService.getAvailableSubtitles(url);
            return ResponseEntity.ok(subtitles);
        } catch (Exception e) {
            log.error("❌ Error getting subtitles: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


    @PostMapping("/download-subtitles")
    public ResponseEntity<String> downloadSubtitles(@RequestBody SubtitleDownloadRequest request) {
        try {
            String result = youTubeService.downloadSubtitles(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Subtitle download failed: " + e.getMessage());
        }
    }
    // Add these new methods to your YouTubeController.java

    @PostMapping("/download-video-with-subtitles")
    public ResponseEntity<String> downloadVideoWithSubtitles(@RequestBody DownloadRequest request) {
        try {
            log.info("⬇️ Starting video + subtitles download for URL: {}", request.getUrl());

            String result = youTubeService.downloadVideoWithSubtitles(
                    request.getUrl(),
                    request.getQuality(),
                    request.getSubtitleLanguages(),
                    request.getDownloadPath()
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Video + subtitles download failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Download failed: " + e.getMessage());
        }
    }

    @PostMapping("/download-audio-with-subtitles")
    public ResponseEntity<String> downloadAudioWithSubtitles(@RequestBody DownloadRequest request) {
        try {
            log.info("⬇️ Starting audio + subtitles download for URL: {}", request.getUrl());

            String result = youTubeService.downloadAudioWithSubtitles(
                    request.getUrl(),
                    request.getAudioFormat(),
                    request.getSubtitleLanguages(),
                    request.getDownloadPath()
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Audio + subtitles download failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Download failed: " + e.getMessage());
        }
    }

    @PostMapping("/download-only-subtitles")
    public ResponseEntity<String> downloadOnlySubtitles(@RequestBody DownloadRequest request) {
        try {
            log.info("⬇️ Starting subtitles-only download for URL: {}", request.getUrl());

            String result = youTubeService.downloadOnlySubtitles(
                    request.getUrl(),
                    request.getSubtitleLanguages(),
                    request.getSubtitleFormats(),
                    request.getDownloadPath()
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Subtitles download failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Download failed: " + e.getMessage());
        }
    }

    @PostMapping("/download-only-audio")
    public ResponseEntity<String> downloadOnlyAudio(@RequestBody DownloadRequest request) {
        try {
            log.info("⬇️ Starting audio-only download for URL: {}", request.getUrl());

            String result = youTubeService.downloadOnlyAudio(
                    request.getUrl(),
                    request.getAudioFormat(),
                    request.getDownloadPath()
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ Audio download failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Download failed: " + e.getMessage());
        }
    }



    @GetMapping("/detect-browser")
    public ResponseEntity<String> detectBrowser() {
        // Simple browser detection - you can enhance this
        return ResponseEntity.ok("chrome"); // Default to chrome
    }

}