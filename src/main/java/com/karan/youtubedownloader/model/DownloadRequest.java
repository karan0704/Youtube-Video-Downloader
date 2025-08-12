package com.karan.youtubedownloader.model;

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
    private String downloadPath;
    private String browserType;
}