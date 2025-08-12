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
public class SubtitleDownloadRequest {
    private String url;
    private List<String> languages;
    private String format; // srt, vtt, txt
    private String downloadPath;
}