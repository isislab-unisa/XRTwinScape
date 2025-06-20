import { Scene } from "./scene";
import { Events } from "./events";
import { lessonFolder } from "./main";
import { accessToken, getFile, updateAccessToken, uploadFile } from "./storage-manager";
import { AnnotationData } from "./annotation";
import { Splat } from "./splat";

const registerXRTwinScapeEvents = (scene: Scene, events: Events) => {
    events.function('xrtwinscape.save', async () => {
        // put current splat annotations into a file and upload it using storage-manager.ts 
        // start and stop spinner while saving
        events.fire('startSpinner');
        try {
            // Gather annotation data (assuming scene.annotationData exists)
            const selectedSplat = events.invoke('selection') as Splat
            if(selectedSplat) {
                const annotationData: AnnotationData = selectedSplat.annotations;
                const json = JSON.stringify(annotationData, null, 2);
                const file = new File([json], "splat.json", { type: "application/json" });
                await uploadFile(`${lessonFolder}/splat.json`, file);
                events.fire('showPopup', {
                    type: 'info',
                    header: 'Save',
                    message: 'Annotations saved and uploaded successfully.'
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
        // open a new tab with a get request to localhost/admin/
        window.open("http://localhost/admin/", "_blank");
    });

    events.function('xrtwinscape.openplayer', async () => {
        // open a new tab with a post request to localhost/xrts-viewer/,
        // send the data as form parameters instead of JSON body
        await updateAccessToken();
        const params = new URLSearchParams();
        params.append("resource", "splat.ply");
        params.append("title", lessonFolder);
        params.append("annotation", "splat.json");
        const win = window.open();
        fetch("http://localhost/render_xrts_viewer/", {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Bearer ${accessToken}`
            },
            body: params.toString(),
        })
        .then(response => response.text())
        .then(html => {
            if (win) {
                win.document.body.innerHTML = html;
            }
        })
        .catch(error => {
            if (win) {
                const pre = win.document.createElement('pre');
                pre.textContent = error.message || String(error);
                win.document.body.appendChild(pre);
            }
        });
    });

    events.function('xrtwinscape.publish', async () => {
        // leave empty
    });
}

export { registerXRTwinScapeEvents };