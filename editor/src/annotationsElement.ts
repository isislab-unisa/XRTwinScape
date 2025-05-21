import { BlendState, GraphNode, Mesh, MeshInstance, SEMANTIC_COLOR, SEMANTIC_POSITION, ShaderMaterial, SphereGeometry } from "playcanvas";
import { Element, ElementType } from './element';
import { vertexShader, fragmentShader } from './shaders/debug-shader';
import { Splat } from "./splat";
import { Annotation } from "./annotation";

class AnnotationElement extends Element {
    material: ShaderMaterial;
    instances: MeshInstance[];
    hidden: boolean;

    constructor() {
        super(ElementType.debug);
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

        const update = (splat: Splat) => {
            this.clearMeshes();
            if (!splat || !splat.annotations) {
                return;
            }

            if(!this.hidden){
                splat.annotations.annotations.forEach(annotation => {
                    const testMesh = Mesh.fromGeometry(this.scene.app.graphicsDevice, new SphereGeometry({ radius: 0.02 }));
                    const newInstance = this.addMesh(testMesh);
                    newInstance.node.setPosition(annotation.position)
                })
                
                this.scene.debugLayer.addMeshInstances(this.instances, true);
            }
            this.scene.forceRender = true;
        }

        this.scene.events.on('selection.changed', (selection: Splat) => {
            update(selection);
        });

        this.scene.events.on('scene.showHideAnnotations', () => {
            this.hidden = !this.hidden;
            const selSplat = this.scene.events.invoke('selection') as Splat;
            update(selSplat);
        });

        this.scene.events.on('annotation.moved', (annotation: Annotation) =>{
            const selSplat = this.scene.events.invoke('selection') as Splat;
            update(selSplat);
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

}

export { AnnotationElement }