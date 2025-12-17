import {
    CULLFACE_NONE,
    FILTER_LINEAR,
    PIXELFORMAT_RGBA8,
    BlendState,
    Color,
    Entity,
    Layer,
    Mesh,
    MeshInstance,
    PlaneGeometry,
    Script,
    StandardMaterial,
    Texture
} from "/static/viewer/util.js";
import { ContentType } from "./annotation.js";

/** @import { Application, CameraComponent, Quat, Vec3 } from 'playcanvas' */

const canvas = document.getElementsByTagName('canvas')[0];

function scrollPassthrough(evt) {
    evt.preventDefault()
    const syntheticEvent = new WheelEvent(evt.type, {
        bubbles: true,
        cancelable: true,
        view: window,
        deltaX: evt.deltaX,
        deltaY: evt.deltaY,
        deltaZ: evt.deltaZ,
        deltaMode: evt.deltaMode,
        clientX: evt.clientX,
        clientY: evt.clientY,
        screenX: evt.screenX,
        screenY: evt.screenY
    });
    canvas.dispatchEvent(syntheticEvent);
}

function pointerPassthrough(evt) {
    evt.preventDefault()
    canvas.dispatchEvent(new PointerEvent(evt.type, {
        bubbles: true,
        cancelable: true,
        pointerId: evt.pointerId,
        clientX: evt.clientX,
        clientY: evt.clientY,
        screenX: evt.screenX,
        screenY: evt.screenY,
        pageX: evt.pageX,
        pageY: evt.pageY,
        pointerType: evt.pointerType,
        isPrimary: evt.isPrimary,
    }));
}

const pointerEventsToForward = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel'
];

export class Annotation extends Script {
    static _activeTooltip = null;
    static layerNormal = null;
    static layerMuted = null;
    static materialNormal = null;
    static materialMuted = null;
    static materialRead = null;
    static mesh = null;
    static _styleSheet = null;
    static instanceCount = 0;

    static _activeTooltip = null;

    hotspotNormal = null;
    hotspotMuted = null;
    title;
    text;
    camera;
    _tooltip;
    _hotspot;
    isRead = false;

    static attributes = {
        annotationData: { type: 'object' }
    };

    static _injectStyles() {
        if (this._styleSheet) return;
        const css = `
            .pc-annotation {
                display: none;
                position: absolute;
                background-color: rgba(0, 0, 0, 0.6);
                color: white;
                padding: 16px;
                border-radius: 8px;
                font-size: 14px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
                word-wrap: break-word;
                overflow-x: visible;
                white-space: normal;
                width: fit-content;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                z-index: 1000;
            }
            .pc-annotation-title { font-weight: bold; margin-bottom: 4px; }
            .pc-annotation-hotspot {
                display: none;
                position: absolute;
                width: 30px;
                height: 30px;
                opacity: 0;
                cursor: pointer;
                transform: translate(-50%, -50%);
                z-index: 999;
            }
            body.hide-annotations .pc-annotation-hotspot { display: none !important; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        this._styleSheet = style;
    }

    static createHotspotTexture(app, alpha = 0.8, size = 64, fillColor = '#000000', strokeColor = '#5bb6bb', borderWidth = 10) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = strokeColor;
        ctx.globalAlpha = 0;
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = alpha - 0.3;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - borderWidth;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        const texture = new Texture(app.graphicsDevice, {
            width: size,
            height: size,
            format: PIXELFORMAT_RGBA8,
            magFilter: FILTER_LINEAR,
            minFilter: FILTER_LINEAR,
            mipmaps: false
        });
        texture.setSource(canvas);
        return texture;
    }

    static hideAll() {
        document.body.classList.add('hide-annotations')
        if (this.materialNormal) {
            this.materialNormal.opacity = 0;
            this.materialNormal.update();
        }
        if (this.materialMuted) {
            this.materialMuted.opacity = 0;
            this.materialMuted.update();
        }
        if (this.materialRead) {
            this.materialRead.opacity = 0;
            this.materialRead.update();
        }
    }

    static showAll() {
        document.body.classList.remove('hide-annotations')
        if (this.materialNormal) {
            this.materialNormal.opacity = 1;
            this.materialNormal.update();
        }
        if (this.materialMuted) {
            this.materialMuted.opacity = 0.25;
            this.materialMuted.update();
        }
        if (this.materialRead) {
            this.materialRead.opacity = 1;
            this.materialRead.update();
        }
    }

    static _createHotspotMaterial(texture, { opacity = 1, depthTest = true, depthWrite = true } = {}) {
        const material = new StandardMaterial();
        material.diffuse = Color.BLACK;
        material.emissive = Color.WHITE;
        material.emissiveMap = texture;
        material.opacityMap = texture;
        material.opacity = opacity;
        material.alphaTest = 0.01;
        material.blendState = BlendState.ALPHABLEND;
        material.depthTest = depthTest;
        material.depthWrite = depthWrite;
        material.cull = CULLFACE_NONE;
        material.useLighting = false;
        material.update();
        return material;
    }

    static cleanupStatics() {
        console.log("Annotation: Cleaning up static resources");

        if (this.mesh) {
            this.mesh.destroy();
            this.mesh = null;
        }

        if (this.materialNormal) {
            this.materialNormal.destroy();
            this.materialNormal = null;
        }

        if (this.materialMuted) {
            this.materialMuted.destroy();
            this.materialMuted = null;
        }
		if (this.materialRead) {
            this.materialRead.destroy();
            this.materialRead = null;
        }

        
        this.layerNormal = null;
        this.layerMuted = null;
    }

    initialize() {
        Annotation.instanceCount++;

        Annotation._injectStyles();

        // --- DOM Elements Creation ---
        this._tooltip = document.createElement('div');
        this._tooltip.className = 'pc-annotation';

        const titleElement = document.createElement('div');
        titleElement.className = 'pc-annotation-title';
        titleElement.textContent = this.annotationData.id;
        this._tooltip.appendChild(titleElement);

        const textElement = document.createElement('div');
        var contentType = this.annotationData.defaultContent.contentType;
        var content = this.annotationData.defaultContent.content;
        var innerHTML = '';
        switch (contentType) {
            case 0: innerHTML = `<p>${content}</p>`; break;
            case 1:
                const imageUrl = `/get_data_from_minio/?resource=${window.lessonTitle}/${content}`;
                innerHTML = `<img src="${imageUrl}" alt="Annotation Image" style="max-width: 300px; max-height: 300px;">`;
                break;
            case 2: 
                const videoUrl = `/get_data_from_minio/?resource=${window.lessonTitle}/${content}`;
                innerHTML = `<video src="${videoUrl}" controls autoplay muted width="320" height="240"></video>`; break;
            case 3: 
                const audioUrl = `/get_data_from_minio/?resource=${window.lessonTitle}/${content}`;
                innerHTML = `<video src="${audioUrl}" controls autoplay width="320" height="40"></video>`; break;
        }
        textElement.innerHTML = innerHTML;
        this._tooltip.appendChild(textElement);

        this._hotspot = document.createElement('div');
        this._hotspot.className = 'pc-annotation-hotspot';

        if (window.isMobile) {
            pointerEventsToForward.forEach(eventName => {
                this._tooltip.addEventListener(eventName, pointerPassthrough)
                this._hotspot.addEventListener(eventName, pointerPassthrough)
            });
        } else {
            this._tooltip.addEventListener('wheel', scrollPassthrough)
            this._hotspot.addEventListener('wheel', scrollPassthrough)
        }

        this._hotspot.addEventListener('click', (e) => {
            e.stopPropagation();

            if (!this.isRead) {
                this.isRead = true;
                if (this.hotspotNormal && this.hotspotNormal.render) {
                    const readMeshInstance = new MeshInstance(Annotation.mesh, Annotation.materialRead);
                    this.hotspotNormal.render.meshInstances = [readMeshInstance];
                    this.app.renderNextFrame = true;
                }
            }

            if (Annotation._activeTooltip && Annotation._activeTooltip !== this._tooltip) {
                this._hideTooltip(Annotation._activeTooltip);
            }
            if (Annotation._activeTooltip === this._tooltip) {
                this._hideTooltip(this._tooltip);
                Annotation._activeTooltip = null;
            } else {
                Annotation._activeTooltip = this._tooltip;
                if (window.onAnnotationOpened) {
                    window.onAnnotationOpened(this.annotationData.id);
                }
                if (this.cameraPos) {
                    this.app.fire('annotation-focus', this.cameraPos, this.entity.getPosition())
                    setTimeout(() => this._showTooltip(this._tooltip), 400)
                } else {
                    this._showTooltip(this._tooltip);
                }
            }
        });

        document.addEventListener('click', (evt) => {
            if (Annotation._activeTooltip && !this._tooltip.contains(evt.target)) {
                this._hideTooltip(Annotation._activeTooltip);
                Annotation._activeTooltip = null;
            }
        });

        document.body.appendChild(this._tooltip);
        document.body.appendChild(this._hotspot);

        this.camera = this.app.root.findComponent('camera');

        // --- ROBUST RESOURCE CREATION ---
        // Check if static resources are valid. If mesh or indexBuffer is missing, force recreation.
        const isMeshValid = Annotation.mesh && Annotation.mesh.indexBuffer;

        if (!Annotation.layerMuted || !isMeshValid) {
            console.log("Annotation: Recreating static resources (Mesh/Layers)");

            // Reset statics to be safe
            Annotation.layerMuted = null;
            Annotation.layerNormal = null;
            Annotation.materialNormal = null;
            Annotation.materialMuted = null;
            Annotation.mesh = null;

            const createLayer = (name) => {
                // Check if layer already exists in scene to avoid duplicates on reset
                let layer = this.app.scene.layers.getLayerByName(name);
                if (!layer) {
                    layer = new Layer({ name: name });
                    const worldLayer = this.app.scene.layers.getLayerByName('World');
                    const idx = this.app.scene.layers.getTransparentIndex(worldLayer);
                    this.app.scene.layers.insert(layer, idx + 1);
                }
                return layer;
            };

            Annotation.layerMuted = createLayer('HotspotMuted');
            Annotation.layerNormal = createLayer('HotspotNormal');

            // Ensure camera has these layers
            const currentLayers = this.camera.layers;
            if (!currentLayers.includes(Annotation.layerNormal.id)) {
                this.camera.layers = [...currentLayers, Annotation.layerNormal.id, Annotation.layerMuted.id];
            }

            const textureNormal = Annotation.createHotspotTexture(this.app, 0.9);
            const textureMuted = Annotation.createHotspotTexture(this.app, 0.25);
            const textureRead = Annotation.createHotspotTexture(this.app, 0.9, 64, '#000000', '#8B0000');

            // NOTE: depthTest is FALSE for now to ensure visibility over Splats
            Annotation.materialNormal = Annotation._createHotspotMaterial(textureNormal, {
                opacity: 1,
                depthTest: false,
                depthWrite: true
            });

            Annotation.materialMuted = Annotation._createHotspotMaterial(textureMuted, {
                opacity: 0.25,
                depthTest: false,
                depthWrite: true
            });
			Annotation.materialRead = Annotation._createHotspotMaterial(textureRead, {
                opacity: 1,
                depthTest: false,
                depthWrite: true
            });

            
            Annotation.mesh = Mesh.fromGeometry(this.app.graphicsDevice, new PlaneGeometry());
        }

        const meshInstanceNormal = new MeshInstance(Annotation.mesh, Annotation.materialNormal);
        const meshInstanceMuted = new MeshInstance(Annotation.mesh, Annotation.materialMuted);

        this.hotspotNormal = new Entity();
        this.hotspotNormal.addComponent('render', {
            layers: [Annotation.layerNormal.id],
            meshInstances: [meshInstanceNormal]
        });
        this.entity.addChild(this.hotspotNormal);

        this.hotspotMuted = new Entity();
        this.hotspotMuted.addComponent('render', {
            layers: [Annotation.layerMuted.id],
            meshInstances: [meshInstanceMuted]
        });
        this.entity.addChild(this.hotspotMuted);

        this.on('destroy', () => {
            this._tooltip.remove();
            this._hotspot.remove();
            if (Annotation._activeTooltip === this._tooltip) {
                Annotation._activeTooltip = null;
            }

            Annotation.instanceCount--;
            if (Annotation.instanceCount <= 0) {
                Annotation.instanceCount = 0;
                Annotation.cleanupStatics();
            }
        });
    }

    _showTooltip(tooltip) {
        tooltip.style.display = 'block'
        tooltip.style.opacity = '1';
    }

    _hideTooltip(tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.style.opacity === '0') {
                tooltip.style.display = 'none';
            }
        }, 200);
    }

    update(dt) {
        if (!this.camera) return;

        const position = this.entity.getPosition();
        const screenPos = this.camera.worldToScreen(position);

        if (screenPos.z <= 0) {
            this._hideElements();
            return;
        }

        this._updatePositions(screenPos);
        this._updateRotationAndScale();
    }

    _hideElements() {
        this._hotspot.style.display = 'none';
        if (this._tooltip.style.display !== 'none') {
            this._hideTooltip(this._tooltip);
            if (Annotation._activeTooltip === this._tooltip) {
                Annotation._activeTooltip = null;
            }
        }
    }

    _updatePositions(screenPos) {
        this._hotspot.style.display = 'block';
        this._hotspot.style.left = `${screenPos.x}px`;
        this._hotspot.style.top = `${screenPos.y}px`;

        if (this._tooltip.style.display == 'block') {
            this._tooltip.style.left = `${screenPos.x - this._tooltip.scrollWidth / 2}px`;
            if (this._tooltip.scrollHeight + screenPos.y > window.innerHeight) {
                this._tooltip.style.top = `${screenPos.y - this._tooltip.scrollHeight}px`;
            } else {
                this._tooltip.style.top = `${screenPos.y}px`;
            }
        }
    }

    _updateRotationAndScale() {
        if (!this.hotspotNormal || !this.hotspotMuted) return;
        const cameraRotation = this.camera.entity.getRotation();
        this._updateHotspotTransform(this.hotspotNormal, cameraRotation);
        this._updateHotspotTransform(this.hotspotMuted, cameraRotation);

        const scale = this._calculateScreenSpaceScale();
        this.hotspotNormal.setLocalScale(scale, scale, scale);
        this.hotspotMuted.setLocalScale(scale, scale, scale);
    }

    _updateHotspotTransform(hotspot, cameraRotation) {
        if (!cameraRotation) return;
        hotspot.setRotation(cameraRotation);
        hotspot.rotateLocal(90, 0, 0);
    }

    _calculateScreenSpaceScale() {
        const DESIRED_PIXEL_SIZE = 12;
        const cameraPos = this.camera.entity.getPosition();
        const toAnnotation = this.entity.getPosition().sub(cameraPos);
        const distance = toAnnotation.length();
        const projMatrix = this.camera.projectionMatrix;
        const screenHeight = this.app.graphicsDevice.height;
        const worldSize = (DESIRED_PIXEL_SIZE / screenHeight) * (2 * distance / projMatrix.data[5]);
        return Math.max(worldSize * window.devicePixelRatio, 0.012);
    }
}