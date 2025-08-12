package com.karan.youtubedownloader;

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
}
