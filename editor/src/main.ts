import { Color, createGraphicsDevice } from 'playcanvas';

import { registerCameraPosesEvents } from './camera-poses';
import { registerDocEvents } from './doc';
import { EditHistory } from './edit-history';
import { registerEditorEvents } from './editor';
import { Events } from './events';
import { initFileHandler, loadAnnotationDataFromJSON } from './file-handler';
import { registerPlySequenceEvents } from './ply-sequence';
import { registerPublishEvents } from './publish';
import { registerRenderEvents } from './render';
import { Scene } from './scene';
import { getSceneConfig } from './scene-config';
import { registerSelectionEvents } from './selection';
import { Shortcuts } from './shortcuts';
import { registerTimelineEvents } from './timeline';
import { BrushSelection } from './tools/brush-selection';
import { LassoSelection } from './tools/lasso-selection';
import { MoveTool } from './tools/move-tool';
import { PolygonSelection } from './tools/polygon-selection';
import { RectSelection } from './tools/rect-selection';
import { RotateTool } from './tools/rotate-tool';
import { ScaleTool } from './tools/scale-tool';
import { SphereSelection } from './tools/sphere-selection';
import { ToolManager } from './tools/tool-manager';
import { registerTransformHandlerEvents } from './transform-handler';
import { EditorUI } from './ui/editor';
import { getFile } from './storage-manager';
import { Splat } from './splat';
import { registerXRTwinScapeEvents } from './xrtwinscape-doc';
import { FilterOnType } from './annotation';

export let lessonFolder: string = null;

declare global {
    interface LaunchParams {
        readonly files: FileSystemFileHandle[];
    }

    interface Window {
        launchQueue: {
            setConsumer: (callback: (launchParams: LaunchParams) => void) => void;
        };
        scene: Scene;
    }
}

const getURLArgs = () => {
    // extract settings from command line in non-prod builds only
    const config = {};

    const apply = (key: string, value: string) => {
        let obj: any = config;
        key.split('.').forEach((k, i, a) => {
            if (i === a.length - 1) {
                obj[k] = value;
            } else {
                if (!obj.hasOwnProperty(k)) {
                    obj[k] = {};
                }
                obj = obj[k];
            }
        });
    };

    const params = new URLSearchParams(window.location.search.slice(1));
    params.forEach((value: string, key: string) => {
        apply(key, value);
    });

    return config;
};

const getLessonFolderFromURL = () => {
    const url = new URL(window.location.href);
    const folder = url.searchParams.get('lesson');
    if (folder) {
        lessonFolder = decodeURIComponent(folder);
    }
}

const initShortcuts = (events: Events) => {
    const shortcuts = new Shortcuts(events);

    shortcuts.register(['Delete', 'Backspace'], { event: 'select.delete' });
    shortcuts.register(['Escape'], { event: 'tool.deactivate' });
    shortcuts.register(['Tab'], { event: 'selection.next' });
    shortcuts.register(['1'], { event: 'tool.move', sticky: true });
    shortcuts.register(['2'], { event: 'tool.rotate', sticky: true });
    shortcuts.register(['3'], { event: 'tool.scale', sticky: true });
    shortcuts.register(['G', 'g'], { event: 'grid.toggleVisible' });
    shortcuts.register(['C', 'c'], { event: 'tool.toggleCoordSpace' });
    shortcuts.register(['F', 'f'], { event: 'camera.focus' });
    shortcuts.register(['R', 'r'], { event: 'tool.rectSelection', sticky: true });
    shortcuts.register(['P', 'p'], { event: 'tool.polygonSelection', sticky: true });
    shortcuts.register(['L', 'l'], { event: 'tool.lassoSelection', sticky: true });
    shortcuts.register(['B', 'b'], { event: 'tool.brushSelection', sticky: true });
    shortcuts.register(['A', 'a'], { event: 'select.all', ctrl: true });
    shortcuts.register(['A', 'a'], { event: 'select.none', shift: true });
    shortcuts.register(['I', 'i'], { event: 'select.invert', ctrl: true });
    shortcuts.register(['H', 'h'], { event: 'select.hide' });
    shortcuts.register(['U', 'u'], { event: 'select.unhide' });
    shortcuts.register(['['], { event: 'tool.brushSelection.smaller' });
    shortcuts.register([']'], { event: 'tool.brushSelection.bigger' });
    shortcuts.register(['Z', 'z'], { event: 'edit.undo', ctrl: true, capture: true });
    shortcuts.register(['Z', 'z'], { event: 'edit.redo', ctrl: true, shift: true, capture: true });
    shortcuts.register(['M', 'm'], { event: 'camera.toggleMode' });
    shortcuts.register(['D', 'd'], { event: 'dataPanel.toggle' });
    shortcuts.register([' '], { event: 'camera.toggleOverlay' });

    return shortcuts;
};

const main = async () => {
    // root events object
    const events = new Events();

    // url
    const url = new URL(window.location.href);
    getLessonFolderFromURL();

    // decode remote storage details
    let remoteStorageDetails;
    try {
        remoteStorageDetails = JSON.parse(decodeURIComponent(url.searchParams.get('remoteStorage')));
    } catch (e) { }

    // edit history
    const editHistory = new EditHistory(events);

    // editor ui
    const editorUI = new EditorUI(events, !!remoteStorageDetails);

    // create the graphics device
    const graphicsDevice = await createGraphicsDevice(editorUI.canvas, {
        deviceTypes: ['webgl2'],
        antialias: false,
        depth: false,
        stencil: false,
        xrCompatible: false,
        powerPreference: 'high-performance'
    });

    const overrides = [
        getURLArgs()
    ];

    // endpoint: http://twinscape:8001/


    // TODO get auth token from backend (root;root) method POST /api/token/ body:
    /* 
        {
            "username": "root",
            "password": "root"
        }
        rifare ogni 15 minuti per aggionare il token
    */
    // TODO get folder name from get params and store it globally
    // TODO on scene loaded: get the splat.ply file and splat.json file from the storage
    //      load ply and import annotations
    // TODO on save: upload json file
    // TODO on file chosen in content: upload file to the storage
    // TODO add camera position to annotation json
    // TODO remove debug buttons (import splat, import/export annotations)
    // TODO change file menu, it must have only: Save, Publish, Dashboard, Player

    // get file:
    // http://localhost:80/get_data_from_minio/?resource=LESSONNAME/FILENAME
    // upload file:
    // http://localhost:80/upload_data_on_minio/
    //    body: FormData with resource and file

    const username = process.env.XRTWINSCAPEUSERNAME;
    const password = process.env.XRTWINSCAPEPASSWORD;
    console.log('Username:', username);
    console.log('Password:', password);
  
    console.log('Lesson folder:', lessonFolder);

    // resolve scene config
    const sceneConfig = getSceneConfig(overrides);

    // construct the manager
    const scene = new Scene(
        events,
        sceneConfig,
        editorUI.canvas,
        graphicsDevice
    );

    // colors
    const bgClr = new Color();
    const selectedClr = new Color();
    const unselectedClr = new Color();
    const lockedClr = new Color();

    const setClr = (target: Color, value: Color, event: string) => {
        if (!target.equals(value)) {
            target.copy(value);
            events.fire(event, target);
        }
    };

    const setBgClr = (clr: Color) => {
        setClr(bgClr, clr, 'bgClr');
    };
    const setSelectedClr = (clr: Color) => {
        setClr(selectedClr, clr, 'selectedClr');
    };
    const setUnselectedClr = (clr: Color) => {
        setClr(unselectedClr, clr, 'unselectedClr');
    };
    const setLockedClr = (clr: Color) => {
        setClr(lockedClr, clr, 'lockedClr');
    };

    events.on('setBgClr', (clr: Color) => {
        setBgClr(clr);
    });
    events.on('setSelectedClr', (clr: Color) => {
        setSelectedClr(clr);
    });
    events.on('setUnselectedClr', (clr: Color) => {
        setUnselectedClr(clr);
    });
    events.on('setLockedClr', (clr: Color) => {
        setLockedClr(clr);
    });

    events.function('bgClr', () => {
        return bgClr;
    });
    events.function('selectedClr', () => {
        return selectedClr;
    });
    events.function('unselectedClr', () => {
        return unselectedClr;
    });
    events.function('lockedClr', () => {
        return lockedClr;
    });

    events.on('bgClr', (clr: Color) => {
        const cnv = (v: number) => `${Math.max(0, Math.min(255, (v * 255))).toFixed(0)}`;
        document.body.style.backgroundColor = `rgba(${cnv(clr.r)},${cnv(clr.g)},${cnv(clr.b)},1)`;
    });
    events.on('selectedClr', (clr: Color) => {
        scene.forceRender = true;
    });
    events.on('unselectedClr', (clr: Color) => {
        scene.forceRender = true;
    });
    events.on('lockedClr', (clr: Color) => {
        scene.forceRender = true;
    });

    // initialize colors from application config
    const toColor = (value: { r: number, g: number, b: number, a: number }) => {
        return new Color(value.r, value.g, value.b, value.a);
    };
    setBgClr(toColor(sceneConfig.bgClr));
    setSelectedClr(toColor(sceneConfig.selectedClr));
    setUnselectedClr(toColor(sceneConfig.unselectedClr));
    setLockedClr(toColor(sceneConfig.lockedClr));

    // create the mask selection canvas
    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d');
    maskCanvas.setAttribute('id', 'mask-canvas');
    maskContext.globalCompositeOperation = 'copy';

    const mask = {
        canvas: maskCanvas,
        context: maskContext
    };

    // tool manager
    const toolManager = new ToolManager(events);
    toolManager.register('rectSelection', new RectSelection(events, editorUI.toolsContainer.dom));
    toolManager.register('brushSelection', new BrushSelection(events, editorUI.toolsContainer.dom, mask));
    toolManager.register('polygonSelection', new PolygonSelection(events, editorUI.toolsContainer.dom, mask));
    toolManager.register('lassoSelection', new LassoSelection(events, editorUI.toolsContainer.dom, mask));
    toolManager.register('sphereSelection', new SphereSelection(events, scene, editorUI.canvasContainer));
    toolManager.register('move', new MoveTool(events, scene));
    toolManager.register('rotate', new RotateTool(events, scene));
    toolManager.register('scale', new ScaleTool(events, scene));

    editorUI.toolsContainer.dom.appendChild(maskCanvas);

    window.scene = scene;

    registerEditorEvents(events, editHistory, scene);
    registerSelectionEvents(events, scene);
    registerTimelineEvents(events);
    registerCameraPosesEvents(events);
    registerTransformHandlerEvents(events);
    registerPlySequenceEvents(events);
    registerPublishEvents(events);
    registerDocEvents(scene, events);
    registerXRTwinScapeEvents(scene, events);
    registerRenderEvents(scene, events);
    initShortcuts(events);
    initFileHandler(scene, events, editorUI.appContainer.dom, remoteStorageDetails);

    // load async models
    scene.start();

    // handle load params
    const loadList = url.searchParams.getAll('load');
    for (const value of loadList) {
        await events.invoke('import', decodeURIComponent(value));
    }

    if(lessonFolder){
        getFile(`${lessonFolder}/splat.ply`).then(async (blob: Blob) => {
            const model = await scene.assetLoader.loadModel({ url: URL.createObjectURL(blob), filename: "splat.ply", animationFrame: false });
            scene.add(model);
            getFile(`${lessonFolder}/splat.json`).then(async (blob: Blob) => {
                const jsonText = await blob.text();
                const annotationsRaw = JSON.parse(jsonText);
                const annotations = await loadAnnotationDataFromJSON(annotationsRaw);
                model.annotations = annotations;
                events.fire('selection.changed', model);
            }).catch((err) => {
                console.error('Failed to load splat.json:', err);
            });
        }).catch((err) => {
            console.error('Failed to load splat.ply:', err);
        });
        
    }

    // handle OS-based file association in PWA mode
    if ('launchQueue' in window) {
        window.launchQueue.setConsumer(async (launchParams: LaunchParams) => {
            for (const file of launchParams.files) {
                const blob = await file.getFile();
                const url = URL.createObjectURL(blob);
                await events.invoke('import', url, file.name);
                URL.revokeObjectURL(url);
            }
        });
    }
};

export { main };