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
            "useProject must be used within a ProjectProvider"
        );
    }

    return context;
}
