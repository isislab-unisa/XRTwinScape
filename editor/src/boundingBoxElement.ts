import { BlendState, BoxGeometry, Color, ConeGeometry, CylinderGeometry, GraphNode, Mat4, Mesh, MeshInstance, Quat, SEMANTIC_COLOR, SEMANTIC_POSITION, ShaderMaterial, Vec3 } from "playcanvas";
import { Element, ElementType } from './element';
import { vertexShader, fragmentShader } from './shaders/debug-shader';
import { Splat } from "./splat";
import { Transform } from "./transform";
import { BoundingBox } from "./annotation";
import { PlayerCameraElement } from "./playerCameraElement";

class BoundingBoxElement extends Element {
    material: ShaderMaterial;
    instances: MeshInstance[];
    boundingBox: BoundingBox;
    splat: Splat;

    constructor() {
        super(ElementType.boundingBox);
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

        const boundingPoints =
            [-1, 1].map((x) => {
                return [-1, 1].map((y) => {
                    return [-1, 1].map((z) => {
                        return [
                            new Vec3(x, y, z), new Vec3(x * 0.75, y, z),
                            new Vec3(x, y, z), new Vec3(x, y * 0.75, z),
                            new Vec3(x, y, z), new Vec3(x, y, z * 0.75)
                        ];
                    });
                });
            }).flat(3);

        const veca = new Vec3();
        const vecb = new Vec3();

        const update = (enabled: Boolean) => {
            this.clearMeshes();
            if(!this.splat || !enabled)
            {
                return;
            }
            this.boundingBox = this.splat.annotations.boundingBox;
            if(!this.boundingBox)
            {
                this.boundingBox = new BoundingBox();
                this.boundingBox.position = new Vec3(0, 0, 0);
                this.boundingBox.rotation = new Quat();
                this.boundingBox.size = new Vec3(1, 1, 1);
                this.splat.annotations.boundingBox = this.boundingBox;
            }

            const bound = this.boundingBox;
            const scale = new Mat4().setTRS(bound.position, bound.rotation, bound.size);

            for (let i = 0; i < boundingPoints.length / 2; i++) {
                const a = boundingPoints[i * 2];
                const b = boundingPoints[i * 2 + 1];
                scale.transformPoint(a, veca);
                scale.transformPoint(b, vecb);

                // Cylinder geometry for edge
                const edgeDir = vecb.clone().sub(veca);
                const edgeLength = edgeDir.length();
                const edgeMid = veca.clone().add(vecb).mulScalar(0.5);

                const axis = edgeDir.clone().normalize();
                const quat = new Quat().setFromDirections(Vec3.UP, axis);

                const cylinderMesh = Mesh.fromGeometry(this.scene.app.graphicsDevice, new CylinderGeometry({
                    height: edgeLength,
                    heightSegments: 8,                                        
                    radius: 0.01
                }));

                const meshInstance = this.addMesh(cylinderMesh);
                meshInstance.node.setPosition(edgeMid);
                meshInstance.node.setRotation(quat);
            }
            this.scene.debugLayer.addMeshInstances(this.instances, true);
            this.scene.forceRender = true;
        }

        this.scene.events.on('selection.splatChanged', (selection: Splat) => {
            this.splat = selection;
            update(false);
        });

        this.scene.events.on('selection.boundingBoxChanged', (bbox: BoundingBox) => {
            update(true);
        });

        this.scene.events.on('selection.playerCameraChanged', (camera: PlayerCameraElement) =>{            
            update(false);
        });

        this.scene.events.on('boundingBox.moved', (bbox: BoundingBox) =>{            
            update(true);
        });
    }

    clearMeshes()
    {
        if (this.instances) {
            this.scene.debugLayer.removeMeshInstances(this.instances, true);
        }
        this.instances = []
    }

    addMesh(mesh: Mesh) : MeshInstance
    {
        if(!this.instances)
        {
            this.instances = [];
        }
        const meshInstance = new MeshInstance(mesh, this.material, new GraphNode());
        meshInstance.cull = false;
        this.instances.push(meshInstance)
        return meshInstance
    }

    remove() {

    }

    getPivot(mode: 'center' | 'boundCenter', selection: boolean, result: Transform) {
        const cameraPos = this.boundingBox.position;
        const cameraRot = this.boundingBox.rotation;
        const cameraScale = this.boundingBox.size;
        result.set(cameraPos, cameraRot, cameraScale);
    }

    move(position?: Vec3, rotation?: Quat, scale?: Vec3): void {
        if (position) {
            this.boundingBox.position.copy(position);
        }
        if (rotation) {
            this.boundingBox.rotation.copy(rotation);
        }
        if (scale) {
            this.boundingBox.size.copy(scale);
        }
    }   

}

export { BoundingBoxElement }