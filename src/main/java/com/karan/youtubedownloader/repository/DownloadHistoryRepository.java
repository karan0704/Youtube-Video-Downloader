package com.karan.youtubedownloader.repository;

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
}