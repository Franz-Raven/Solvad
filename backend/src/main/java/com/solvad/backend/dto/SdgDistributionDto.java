package com.solvad.backend.dto;

public class SdgDistributionDto {
    private String sdgFocus;
    private Long problemCount;

    public SdgDistributionDto() {}

    public SdgDistributionDto(String sdgFocus, Long problemCount) {
        this.sdgFocus = sdgFocus;
        this.problemCount = problemCount;
    }

    public String getSdgFocus() {
        return sdgFocus;
    }

    public void setSdgFocus(String sdgFocus) {
        this.sdgFocus = sdgFocus;
    }

    public Long getProblemCount() {
        return problemCount;
    }

    public void setProblemCount(Long problemCount) {
        this.problemCount = problemCount;
    }
}