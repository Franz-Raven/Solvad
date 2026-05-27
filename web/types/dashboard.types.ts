
export interface ProblemStatusGroupDto {
    open: number;
    active: number;
    solvedNeedsImprovement: number;
    completed: number;
    closed: number;
}

export interface SdgDistributionDto {
    sdgFocus: string;
    problemCount: number;
}