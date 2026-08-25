package com.solvad.backend.storage;

public class CloudinaryUploadResult {
    private final String url;
    private final String format;

    public CloudinaryUploadResult(String url, String format) {
        this.url = url;
        this.format = format;
    }

    public String getUrl() {
        return url;
    }

    public String getFormat() {
        return format;
    }
}
