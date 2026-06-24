import {
    useContext
} from "react";

import {
    ProjectContext
} from "../state/ProjectContext";

export function useProject() {

    const context =
        useContext(ProjectContext);

    if (!context) {
        throw new Error(
            "ProjectContext missing"
        );
    }

    return context;
}