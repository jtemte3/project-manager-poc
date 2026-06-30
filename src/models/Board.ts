export interface Board {
    laneOrder: {
        todo: string[];
        inProgress: string[];
        done: string[];
    };
}