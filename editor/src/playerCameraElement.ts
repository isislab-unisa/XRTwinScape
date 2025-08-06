
import { BlendState, ConeGeometry, GraphNode, Mesh, MeshInstance, Quat, SEMANTIC_COLOR, SEMANTIC_POSITION, ShaderMaterial, Vec3 } from "playcanvas";
import { Element, ElementType } from './element';
import { vertexShader, fragmentShader } from './shaders/debug-shader';
import { Splat } from "./splat";
import { Transform } from "./transform";
import { AnnotationCamera } from "./annotation";
import { BoundingBoxElement } from "./boundingBoxElement";

class PlayerCameraElement extends Element {
    material: ShaderMaterial;
    instance: MeshInstance;
    playerCamera: AnnotationCamera;
    splat: Splat;

    constructor() {
        super(ElementType.playerCamera);
    }

    destroy() {
        this.material.destroy();
    }

    add() {
        this.material = new ShaderMaterial({
            uniqueName: 'debugLines',
            attributes: {
                vertex_position: SEMANTIC_POSITION,
                vertex_color: SEMANTIC_COLOR
            },
            vertexCode: vertexShader,
            fragmentCode: fragmentShader
        });
        this.material.blendState = BlendState.NOBLEND;
        this.material.update();

        const update = (enabled: Boolean) => {
            this.clearMeshes();
            if(!this.splat || !enabled)
            {
                return;
            }
            this.playerCamera = this.splat.annotations.camera;
            if(!this.playerCamera)
            {
                this.playerCamera = new AnnotationCamera();
                this.playerCamera.position = new Vec3(0, 0, 0);
                this.playerCamera.rotation = new Quat();
                this.splat.annotations.camera = this.playerCamera;
            }
            const testMesh = Mesh.fromGeometry(this.scene.app.graphicsDevice, new ConeGeometry({ height: 0.1, baseRadius: 0.05, heightSegments: 8 }));
            const newInstance = this.addMesh(testMesh);
            newInstance.node.setPosition(this.playerCamera.position);
            newInstance.node.setRotation(this.playerCamera.rotation);
            this.scene.debugLayer.addMeshInstances([this.instance], true);
            this.scene.forceRender = true;
        }

        this.scene.events.on('selection.splatChanged', (selection: Splat) => {
            this.splat = selection;
            update(false);
        });

        this.scene.events.on('selection.playerCameraChanged', (camera: PlayerCameraElement) => {
            update(camera !== null);
        });

        this.scene.events.on('selection.boundingBoxChanged', (bbox: BoundingBoxElement) => {
            update(false);
        });

        this.scene.events.on('playerCamera.moved', () =>{            
            update(true);
        });
    }

    clearMeshes()
    {
        if (this.instance) {
            this.scene.debugLayer.removeMeshInstances([this.instance], true);
        }
        this.instance = null
    }

    addMesh(mesh: Mesh) : MeshInstance
    {
        const meshInstance = new MeshInstance(mesh, this.material, new GraphNode());
        meshInstance.cull = false;
        this.instance = meshInstance;
        return meshInstance
    }

    remove() {

    }

    getPivot(mode: 'center' | 'boundCenter', selection: boolean, result: Transform) {
        const cameraPos = this.playerCamera.position;
        const cameraRot = this.playerCamera.rotation;
        result.set(cameraPos, cameraRot, Vec3.ONE);
    }

    move(position?: Vec3, rotation?: Quat, scale?: Vec3): void {
        if (position) {
            this.playerCamera.position.copy(position);
        }
        if (rotation) {
            this.playerCamera.rotation.copy(rotation);
        }
    }

}

export { PlayerCameraElement }