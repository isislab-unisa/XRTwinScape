import { Scene } from "./scene";
import { Events } from "./events";
import { lessonFolder } from "./main";
import { uploadFile } from "./storage-manager";
import { AnnotationData } from "./annotation";
import { Splat } from "./splat";
import { BufferWriter } from "./serialize/writer";
import { serializePly } from "./splat-serialize";
import { authenticateKeycloak } from "./keycloakAuth.js";
import { Element, ElementType } from "./element";

type LessonAsset = {
    name: string;
    description: string;
    tags: string[];
    image: string;
};

const registerXRTwinScapeEvents = (scene: Scene, events: Events) => {
    events.function('xrtwinscape.savesplat', async () => {
        events.fire('startSpinner');
        try {
            const selectedSplat = events.invoke('selection') as Splat;
            if (selectedSplat) {
                // Save selected splat as splat.ply
                const writer = new BufferWriter();
                await serializePly([selectedSplat], { maxSHBands: 3 }, writer);
                const plyBuffer = writer.close();
                const plyFile = new File([plyBuffer], "splat.ply", { type: "application/octet-stream" });
                await uploadFile(`${lessonFolder}/splat.ply`, plyFile);

                await events.invoke('showPopup', {
                    type: 'info',
                    header: 'Save',
                    message: 'Splat saved and uploaded successfully.'
                });
            }
        } catch (error) {
            await events.invoke('showPopup', {
                type: 'error',
                header: 'Save Failed',
                message: error.message || String(error)
            });
        } finally {
            events.fire('stopSpinner');
        }
    });

    events.function('xrtwinscape.saveannotations', async () => {
        events.fire('startSpinner');
        try {
            const selectedSplat = events.invoke('selection') as Splat;
            if (selectedSplat) {
                // Save annotation data
                const annotationData: AnnotationData = selectedSplat.annotations;
                const json = JSON.stringify(annotationData, null, 2);
                const annotationFile = new File([json], "splat.json", { type: "application/json" });
                await uploadFile(`${lessonFolder}/splat.json`, annotationFile);

                await events.invoke('showPopup', {
                    type: 'info',
                    header: 'Save',
                    message: 'Annotations saved and uploaded successfully.'
                });
            }
        } catch (error) {
            await events.invoke('showPopup', {
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
        const result = await events.invoke('showPopup', {
            type: 'yesno',
            header: 'Not Logged In',
            message: "You must be logged in the XR2Learn Marketplace to publish lessons. " + 
            "Press yes to proceed to log in and publish. ANY UNSAVED CHANGES WILL BE LOST."
        });

        if (result.action === 'yes') {
            events.invoke('show.xr2learnPublishDialog');
        }
    });

    async function publishToMarketplace(curToken: string, lessonAsset: LessonAsset, events: Events): Promise<void> {
        
        const marketplaceURL = "https://marketplace-api.xr2learn-marketplace.eu/";
        const response = await fetch(`${marketplaceURL}source`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${curToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'software',
                media: window.location.href
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to publish: ${response.statusText}`);
        }

        const sourceResponse = await response.json();
        const userResponse = await fetch(`${marketplaceURL}user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${curToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!userResponse.ok) {
            throw new Error(`Failed to fetch user data: ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Create form data
        const formData = new FormData();
        formData.append('name', lessonAsset.name);
        formData.append('description', lessonAsset.description);
        formData.append('type', 'software');
        formData.append('owner', userId);
        formData.append('tags', JSON.stringify(lessonAsset.tags || []));
        formData.append('external_link', window.location.href);
        formData.append('source', sourceResponse.id);

        // Disabled for server-side error
        const imageBlob = await fetch(lessonAsset.image).then(r => r.blob());
        formData.append('display_image', imageBlob, 'image.png');

        const marketplaceItemResponse = await fetch(`${marketplaceURL}marketplace-item/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${curToken}`,
                'Content-Type': 'multipart/form-data; boundary=----geckoformboundary'
            },
            body: formData
        });

        if (!marketplaceItemResponse.ok) {
            throw new Error(`Failed to create marketplace item: ${marketplaceItemResponse.statusText}`);
        }

        const itemResponse = await marketplaceItemResponse.json();
        const itemId = itemResponse?.item?.id;
        const itemUrl = itemId
            ? `https://xr2learn-marketplace.eu/marketplace/${itemId}`
            : null;

        await events.invoke('showPopup', {
            type: 'info',
            header: 'Success',
            message: 'Lesson published successfully to XR2Learn Marketplace.',
            link: itemUrl
        });
   
    }
    
    async function handlePublishing(lessonAsset: LessonAsset, events: Events) {
        const curToken = localStorage.getItem("kc_token");
        if (!curToken) {
            await events.invoke('showPopup', {
                type: 'error',
                header: 'Token Error',
                message: 'No valid token found. Please log in and try again.'
            });
            return;
        }

        try {
            events.fire('startSpinner');
            await publishToMarketplace(curToken, lessonAsset, events);
        } catch (error) {
            await events.invoke('showPopup', {
                type: 'error',
                header: 'Publish Failed',
                message: error.message || String(error)
            });
        } finally {
            localStorage.removeItem("lessonAsset");
            events.fire('stopSpinner');
        }
    }

    events.function('xr2learn.publish', async (lessonAsset: LessonAsset) => {
        console.log("Publishing lesson:", lessonAsset);
        localStorage.setItem("lessonAsset", JSON.stringify(lessonAsset));
        try
        {
            await authenticateKeycloak();
        }
        finally {
            localStorage.removeItem("lessonAsset");
        }
        await handlePublishing(lessonAsset, events);
    });

    events.on('scene.elementAdded', async (element: Element) => {
        if (element.type === ElementType.splat) {            
            const lessonAssetStr = localStorage.getItem("lessonAsset");
            if (lessonAssetStr) {
                const lessonAsset = JSON.parse(lessonAssetStr);
                console.log("Publishing lesson:", lessonAsset);
                await authenticateKeycloak();                
                await handlePublishing(lessonAsset, events);
            }
        }
    });
}

export { registerXRTwinScapeEvents, LessonAsset };