import { type Epic }
from "../models/Epic";

import {
    useProject
}
from "../hooks/useProject";

interface Props {
    epic: Epic;
}

export default function EpicEditor({
    epic
}: Props) {

    const {
        updateEpic
    } = useProject();

    return (

        <div>

            <input

                value={epic.name}

                onChange={e =>
                    updateEpic(
                        epic.id,
                        {
                            name:
                                e.target.value
                        }
                    )
                }

            />

            <input

                type="color"

                value={epic.color}

                onChange={e =>
                    updateEpic(
                        epic.id,
                        {
                            color:
                                e.target.value
                        }
                    )
                }

            />

        </div>
    );
}