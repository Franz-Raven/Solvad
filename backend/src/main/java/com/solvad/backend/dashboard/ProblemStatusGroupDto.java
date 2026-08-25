package com.solvad.backend.dashboard;

public class ProblemStatusGroupDto {
    private Long open;                           // OPEN
    private Long active;                         // CLAIMED + IN_PROGRESS
    private Long solvedNeedsImprovement;         // SOLVED_OPEN_FOR_IMPROVEMENT
    private Long completed;                      // COMPLETED
    private Long closed;                         // CLOSED

    public ProblemStatusGroupDto() {}

    public ProblemStatusGroupDto(Long open, Long active, Long solvedNeedsImprovement, 
                                  Long completed, Long closed) {
        this.open = open;
        this.active = active;
        this.solvedNeedsImprovement = solvedNeedsImprovement;
        this.completed = completed;
        this.closed = closed;
    }

    public Long getOpen() {
        return open;
    }

    public void setOpen(Long open) {
        this.open = open;
    }

    public Long getActive() {
        return active;
    }

    public void setActive(Long active) {
        this.active = active;
    }

    public Long getSolvedNeedsImprovement() {
        return solvedNeedsImprovement;
    }

    public void setSolvedNeedsImprovement(Long solvedNeedsImprovement) {
        this.solvedNeedsImprovement = solvedNeedsImprovement;
    }

    public Long getCompleted() {
        return completed;
    }

    public void setCompleted(Long completed) {
        this.completed = completed;
    }

    public Long getClosed() {
        return closed;
    }

    public void setClosed(Long closed) {
        this.closed = closed;
    }

    public Long[] toArray() {
        return new Long[]{open, active, solvedNeedsImprovement, completed, closed};
    }
}