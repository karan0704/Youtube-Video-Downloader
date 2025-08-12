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
public class VideoInfo {
    private String title;
    private String url;
    private String duration;
    private List<String> availableQualities;
    private String thumbnail;
}