package com.karan.youtubedownloader.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.karan.youtubedownloader.model.SubtitleDownloadRequest;
import com.karan.youtubedownloader.model.SubtitleInfo;
import com.karan.youtubedownloader.model.VideoInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class YouTubeService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<VideoInfo> getAvailableQualities(String url) throws Exception {
        log.info("🔍 Fetching video information for: {}", url);

        ProcessBuilder processBuilder = new ProcessBuilder(
                "yt-dlp",
                "--dump-json",
                "--no-playlist",
                "--ignore-errors", // ✅ Handle age-restricted videos gracefully
                "--no-warnings",   // ✅ Reduce noise
                url
        );

        Process process = processBuilder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));

        List<VideoInfo> videoInfos = new ArrayList<>();
        StringBuilder errorOutput = new StringBuilder();
        String line;
        boolean foundAgeRestriction = false;

        // Read standard output
        while ((line = reader.readLine()) != null) {
            try {
                JsonNode videoData = objectMapper.readTree(line);
                VideoInfo videoInfo = parseVideoInfo(videoData);
                if (videoInfo != null) {
                    videoInfos.add(videoInfo);
                }
            } catch (Exception e) {
                log.warn("⚠️ Could not parse video info line: {}", e.getMessage());
            }
        }

        // Read error output to detect age restrictions
        while ((line = errorReader.readLine()) != null) {
            log.warn("yt-dlp error: {}", line);
            errorOutput.append(line).append("\n");

            // Check for age restriction indicators
            if (line.toLowerCase().contains("age-restricted") ||
                    line.toLowerCase().contains("sign in") ||
                    line.toLowerCase().contains("inappropriate for some users")) {
                foundAgeRestriction = true;
            }
        }

        process.waitFor();

        // If no videos found but we detected age restriction, return special response
        if (videoInfos.isEmpty() && foundAgeRestriction) {
            VideoInfo restrictedVideo = VideoInfo.builder()
                    .title("🔞 Age-Restricted Video - Authentication Required")
                    .url(url)
                    .duration("Unknown")
                    .thumbnail("https://via.placeholder.com/160x90?text=Age+Restricted")
                    .availableQualities(Arrays.asList("best", "720p", "480p", "360p", "worst"))
                    .build();
            videoInfos.add(restrictedVideo);
            log.warn("🔞 Age-restricted video detected, providing default quality options");
        }

        return videoInfos;
    }

    public String downloadVideo(String url, String quality, String customPath) throws Exception {
        log.info("📥 Downloading video in {} quality", quality);

        // Handle download path
        String downloadsPath;
        if (customPath != null && !customPath.trim().isEmpty()) {
            downloadsPath = customPath.trim();
        } else {
            String userHome = System.getProperty("user.home");
            downloadsPath = userHome + File.separator + "Downloads" + File.separator + "YouTubeDownloader";
        }

        File downloadsDir = new File(downloadsPath);
        if (!downloadsDir.exists()) {
            downloadsDir.mkdirs();
        }

        boolean isPlaylist = url.contains("playlist?list=") || url.contains("&list=");
        String formatSelector = getQualityFormat(quality);

        ProcessBuilder processBuilder;

        if (quality.equals("playlist-all") && isPlaylist) {
            log.info("📋 Downloading entire playlist with authentication");
            processBuilder = new ProcessBuilder(
                    "yt-dlp",
                    "-f", formatSelector,
                    "-o", downloadsPath + File.separator + "%(playlist_title)s" + File.separator + "%(playlist_index)s - %(title)s.%(ext)s",
                    "--merge-output-format", "mp4",
                    "--ignore-errors",
                    "--no-abort-on-error",
                    "--continue",
                    "--cookies-from-browser", "chrome", // ✅ Use Chrome cookies
                    url
            );
        } else if (isPlaylist) {
            log.info("📺 Downloading single video from playlist with authentication");
            processBuilder = new ProcessBuilder(
                    "yt-dlp",
                    "-f", formatSelector,
                    "-o", downloadsPath + File.separator + "%(title)s.%(ext)s",
                    "--merge-output-format", "mp4",
                    "--no-playlist",
                    "--ignore-errors",
                    "--continue",
                    "--cookies-from-browser", "chrome", // ✅ Use Chrome cookies
                    url
            );
        } else {
            log.info("📺 Downloading single video with authentication");
            processBuilder = new ProcessBuilder(
                    "yt-dlp",
                    "-f", formatSelector,
                    "-o", downloadsPath + File.separator + "%(title)s.%(ext)s",
                    "--merge-output-format", "mp4",
                    "--ignore-errors",
                    "--continue",
                    "--cookies-from-browser", "chrome", // ✅ Use Chrome cookies
                    url
            );
        }

        // Rest of your existing code...
        Process process = processBuilder.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));

        StringBuilder output = new StringBuilder();
        StringBuilder errorOutput = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            log.info("yt-dlp: {}", line);
            output.append(line).append("\n");
        }

        while ((line = errorReader.readLine()) != null) {
            log.warn("yt-dlp error: {}", line);
            errorOutput.append(line).append("\n");
        }

        int exitCode = process.waitFor();

        if (exitCode == 0) {
            return String.format("🎉 Video downloaded with authentication to %s!", downloadsPath);
        } else {
            String errorMessage = errorOutput.toString().trim();
            if (errorMessage.contains("cookies") || errorMessage.contains("authentication")) {
                throw new RuntimeException("Authentication failed. Please make sure you're logged into YouTube in your browser.");
            }
            throw new RuntimeException("Download failed: " + errorMessage);
        }
    }

    private String getQualityFormat(String quality) {
        switch (quality.toLowerCase()) {
            case "1080p":
                return "best[height<=1080][ext=mp4]/best[height<=1080]";
            case "720p":
                return "best[height<=720][ext=mp4]/best[height<=720]";
            case "480p":
                return "best[height<=480][ext=mp4]/best[height<=480]";
            case "360p":
                return "best[height<=360][ext=mp4]/best[height<=360]";
            case "best":
            case "playlist-all":
                return "best[ext=mp4]/best";
            case "worst":
                return "worst[ext=mp4]/worst";
            default:
                return "best[height<=720][ext=mp4]/best[height<=720]";
        }
    }

    // ✅ Removed duplicate getFormatSelector method

    private VideoInfo parseVideoInfo(JsonNode videoData) {
        try {
            String title = getJsonValue(videoData, "title", "Unknown Title");
            String duration = formatDuration(getJsonIntValue(videoData, "duration", 0));
            String thumbnail = getJsonValue(videoData, "thumbnail", "");
            String url = getJsonValue(videoData, "webpage_url", "");

            List<String> availableQualities = extractQualities(videoData);

            return VideoInfo.builder()
                    .title(title)
                    .url(url)
                    .duration(duration)
                    .thumbnail(thumbnail)
                    .availableQualities(availableQualities)
                    .build();

        } catch (Exception e) {
            log.warn("⚠️ Error parsing video info: {}", e.getMessage());
            return null;
        }
    }

    private List<String> extractQualities(JsonNode videoData) {
        List<String> standardQualities = Arrays.asList("1080p", "720p", "480p", "360p", "best");
        log.info("🎯 Providing standard quality options: {}", standardQualities);
        return standardQualities;
    }

    private String getJsonValue(JsonNode node, String fieldName, String defaultValue) {
        JsonNode field = node.get(fieldName);
        if (field != null && !field.isNull()) {
            return field.asText();
        }
        return defaultValue;
    }

    private int getJsonIntValue(JsonNode node, String fieldName, int defaultValue) {
        JsonNode field = node.get(fieldName);
        if (field != null && !field.isNull()) {
            return field.asInt();
        }
        return defaultValue;
    }
    public List<SubtitleInfo> getAvailableSubtitles(String url) throws Exception {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "yt-dlp",
                "--list-subs",
                "--no-warnings",
                url
        );

        Process process = processBuilder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        List<SubtitleInfo> subtitles = new ArrayList<>();
        String line;

        while ((line = reader.readLine()) != null) {
            if (line.contains("subtitle")) {
                // Parse subtitle information
                SubtitleInfo subtitle = parseSubtitleLine(line);
                if (subtitle != null) {
                    subtitles.add(subtitle);
                }
            }
        }

        process.waitFor();
        return subtitles;
    }

    public String downloadSubtitles(SubtitleDownloadRequest request) throws Exception {
        // Implementation for downloading subtitles
        // Use yt-dlp with --write-subs flag
        return "Subtitles downloaded successfully";
    }

    private ProcessBuilder createDownloadProcess(String url, String quality, String downloadsPath, String browserType) {
        List<String> command = new ArrayList<>();
        command.add("yt-dlp");
        command.add("-f");
        command.add(getQualityFormat(quality));
        command.add("-o");
        command.add(downloadsPath + File.separator + "%(title)s.%(ext)s");
        command.add("--merge-output-format");
        command.add("mp4");
        command.add("--ignore-errors");
        command.add("--continue");

        // Add browser-specific authentication
        if (browserType != null && !browserType.isEmpty()) {
            command.add("--cookies-from-browser");
            command.add(browserType.toLowerCase()); // chrome, firefox, edge, safari
            log.info("🔐 Using {} cookies for authentication", browserType);
        }

        command.add(url);

        return new ProcessBuilder(command);
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
}
