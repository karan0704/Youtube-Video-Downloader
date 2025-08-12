package com.karan.youtubedownloader.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadRequest {
    private String url;
    private String quality;
    private String downloadPath;
    private String browserType;
    private String downloadType; // "video", "audio", "subtitles", "video+subtitles", "audio+subtitles"
    private String audioFormat; // "mp3", "m4a", "wav"
    private List<String> subtitleLanguages; // ["en", "es", "fr"]
    private List<String> subtitleFormats; // ["srt", "vtt", "ass"]
}