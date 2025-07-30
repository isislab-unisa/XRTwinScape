
import { BlendState, ConeGeometry, GraphNode, Mesh, MeshInstance, Quat, SEMANTIC_COLOR, SEMANTIC_POSITION, ShaderMaterial, Vec3 } from "playcanvas";
import { Element, ElementType } from './element';
import { vertexShader, fragmentShader } from './shaders/debug-shader';
import { Splat } from "./splat";
import { Transform } from "./transform";
import { AnnotationCamera } from "./annotation";

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
            console.log('1');
            this.clearMeshes();
            console.log('2');
            if(!this.splat || !enabled)
            {
                return;
            }
            
            console.log('3');
            this.playerCamera = this.splat.annotations.camera;
            if(!this.playerCamera)
            {
                this.playerCamera = new AnnotationCamera();
                this.playerCamera.position = Vec3.ZERO;
                this.playerCamera.target = Vec3.FORWARD;
            }
            const testMesh = Mesh.fromGeometry(this.scene.app.graphicsDevice, new ConeGeometry({ height: 0.1, baseRadius: 0.05, heightSegments: 8 }));
            const newInstance = this.addMesh(testMesh);
            newInstance.node.setPosition(this.playerCamera.position);
            console.log('4');
            const cameraPos = this.playerCamera.position;
            const cameraTarget = this.playerCamera.target;
            const forward = cameraTarget.clone().sub(cameraPos).normalize();
            const quat = new Quat();
            quat.setFromDirections(Vec3.FORWARD, forward);
            console.log('5');
            newInstance.node.setRotation(quat);           
            console.log('6');
            this.scene.debugLayer.addMeshInstances([this.instance], true);
            this.scene.forceRender = true;
            console.log('7');
        }

        this.scene.events.on('selection.changed', (selection: Splat) => {
            this.splat = selection;
            update(false);
        });

        this.scene.events.on('playerCamera.selected', (enabled: Boolean) => {
            console.log('PlayerCameraElement selected: ' + enabled);
            update(enabled);
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
        const cameraTarget = this.playerCamera.target;
        const forward = cameraTarget.clone().sub(cameraPos).normalize();
        const cameraQuat = new Quat();
        cameraQuat.setFromDirections(Vec3.FORWARD, forward);
        result.set(cameraPos, cameraQuat, Vec3.ONE);
    }

}

export { PlayerCameraElement }