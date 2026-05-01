import * as THREE from 'three';
import type { Scene } from '../types';

type MeshType = THREE.Mesh;
type LineType = THREE.Line;

function geometryForType(type: string): THREE.BufferGeometry {
  switch (type) {
    case 'agent':
      return new THREE.SphereGeometry(0.5, 16, 16);
    case 'vault':
    case 'compute':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'router':
    case 'gateway':
      return new THREE.CylinderGeometry(0.4, 0.6, 1, 8);
    case 'voice':
    case 'studio':
      return new THREE.TorusGeometry(0.4, 0.15, 8, 16);
    case 'mem':
    case 'semantic':
      return new THREE.OctahedronGeometry(0.55);
    case 'wall':
      return new THREE.BoxGeometry(2, 1, 0.1);
    case 'zone':
      return new THREE.PlaneGeometry(2, 2);
    default:
      return new THREE.TetrahedronGeometry(0.6);
  }
}

function colorForType(type: string): number {
  const palette: Record<string, number> = {
    agent: 0x22d3ee,
    vault: 0x4ade80,
    compute: 0xf59e0b,
    router: 0xa78bfa,
    gateway: 0x38bdf8,
    voice: 0xf472b6,
    studio: 0xfb923c,
    mem: 0x818cf8,
    semantic: 0x34d399,
    wall: 0x94a3b8,
    zone: 0x60a5fa,
  };
  return palette[type] ?? 0xddddff;
}

export class SceneRenderer {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private meshMap: Map<string, MeshType> = new Map();
  private edgeLines: LineType[] = [];
  private resizeObserver?: { disconnect(): void };

  render(scene: Scene, canvas: HTMLCanvasElement): void {
    this._teardown();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(
      typeof window !== 'undefined' ? window.devicePixelRatio : 1
    );
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setClearColor(0x0d0d1f);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 6, 14);
    this.camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 5);
    this.scene.add(ambient);
    this.scene.add(dir);

    for (const node of scene.nodes) {
      const geometry = geometryForType(node.type);
      const material = new THREE.MeshStandardMaterial({
        color: colorForType(node.type),
        roughness: 0.4,
        metalness: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.name = node.id;
      this.scene.add(mesh);
      this.meshMap.set(node.id, mesh);
    }

    const nodeMap = new Map(scene.nodes.map((n) => [n.id, n]));
    for (const edge of scene.edges) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) continue;

      const points = [
        new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z),
        new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this.edgeLines.push(line);
    }

    this.renderer.render(this.scene, this.camera);

    if (typeof window !== 'undefined') {
      const onResize = () => {
        const w = canvas.clientWidth || canvas.width;
        const h = canvas.clientHeight || canvas.height;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.renderer.render(this.scene, this.camera);
      };
      window.addEventListener('resize', onResize);
      this.resizeObserver = {
        disconnect: () => window.removeEventListener('resize', onResize),
      };
    }
  }

  refresh(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose(): void {
    this._teardown();
  }

  private _teardown(): void {
    this.resizeObserver?.disconnect();
    for (const mesh of this.meshMap.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshMap.clear();
    for (const line of this.edgeLines) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    this.edgeLines = [];
    this.renderer?.dispose();
  }
}