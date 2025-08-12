package com.karan.youtubedownloader.model;

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
}