import { ScaleGizmo } from 'playcanvas';

import { TransformTool } from './transform-tool';
import { Events } from '../events';
import { Scene } from '../scene';

class ScaleTool extends TransformTool {
    constructor(events: Events, scene: Scene) {
        const gizmo = new ScaleGizmo(scene.camera.entity.camera, scene.gizmoLayer);

        // Initially disable all but uniform scale
        ['x', 'y', 'z', 'yz', 'xz', 'xy'].forEach((axis) => {
            gizmo.enableShape(axis, false);
        });

        // Listen for useScale3 changes
        events.on('transform.useScale3', (useScale3: boolean) => {
            if (useScale3) {
                // Enable x, y, z axes for non-uniform scaling
                ['x', 'y', 'z'].forEach((axis) => gizmo.enableShape(axis, true));
            } else {
                // Disable x, y, z axes for uniform scaling only
                ['x', 'y', 'z'].forEach((axis) => gizmo.enableShape(axis, false));
            }
        });

        super(gizmo, events, scene);
    }
}

export { ScaleTool };
