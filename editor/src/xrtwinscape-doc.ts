import { Scene } from "./scene";
import { Events } from "./events";
import { lessonFolder } from "./main";
import { uploadFile } from "./storage-manager";
import { AnnotationData } from "./annotation";
import { Splat } from "./splat";
import { BufferWriter } from "./serialize/writer";
import { serializePly } from "./splat-serialize";

const registerXRTwinScapeEvents = (scene: Scene, events: Events) => {
    events.function('xrtwinscape.save', async () => {
        // put current splat annotations into a file and upload it using storage-manager.ts 
        // start and stop spinner while saving
        events.fire('startSpinner');
        try {
            // Gather annotation data (assuming scene.annotationData exists)
            const selectedSplat = events.invoke('selection') as Splat;
            if (selectedSplat) {
                // Save annotation data
                const annotationData: AnnotationData = selectedSplat.annotations;
                const pose = events.invoke('camera.getPose');
                annotationData.camera = {
                    position: pose.position,
                    target: pose.target
                };
                const json = JSON.stringify(annotationData, null, 2);
                const annotationFile = new File([json], "splat.json", { type: "application/json" });
                await uploadFile(`${lessonFolder}/splat.json`, annotationFile);

                // Save selected splat as splat.ply
                const writer = new BufferWriter();
                await serializePly([selectedSplat], { maxSHBands: 3 }, writer);
                const plyBuffer = writer.close();
                const plyFile = new File([plyBuffer], "splat.ply", { type: "application/octet-stream" });
                await uploadFile(`${lessonFolder}/splat.ply`, plyFile);

                events.fire('showPopup', {
                    type: 'info',
                    header: 'Save',
                    message: 'Annotations and splat.ply saved and uploaded successfully.'
                });
            }
        } catch (error) {
            events.fire('showPopup', {
                type: 'error',
                header: 'Save Failed',
                message: error.message || String(error)
            });
        } finally {
            events.fire('stopSpinner');
        }
    });

    events.function('xrtwinscape.dashboard', async () => {
        window.open(`${process.env.API_URL}/admin/`, "_blank");
    });

    events.function('xrtwinscape.openplayer', async () => {
        window.open(`${process.env.API_URL}/render_xrts_viewer/?title=${encodeURIComponent(lessonFolder)}`, "_blank");
    });

    events.function('xrtwinscape.publish', async () => {
        // TODO call XR2Learn Marketplace API to publish the lesson
    });
}

export { registerXRTwinScapeEvents };