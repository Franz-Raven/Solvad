package com.solvad.backend.admin;

import org.springframework.data.domain.Page;

import java.util.List;

/** Generic paginated wrapper for admin dashboard lists. */
public record AdminPageResponse<T>(
        List<T> content,
        int page,
        int totalPages,
        long totalElements,
        int size
) {
    public static <T> AdminPageResponse<T> of(Page<?> source, List<T> content) {
        return new AdminPageResponse<>(
                content,
                source.getNumber(),
                source.getTotalPages(),
                source.getTotalElements(),
                source.getSize());
    }
}
