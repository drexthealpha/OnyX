declare module 'three' {
  interface Vector3 {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): void;
  }

  interface BufferGeometry {
    setFromPoints(points: Vector3[]): this;
    dispose(): void;
  }

  interface Material {
    dispose(): void;
  }

  interface Mesh {
    geometry: BufferGeometry;
    material: Material;
    position: Vector3;
    name: string;
  }

  interface Scene {
    add(object: any): void;
  }

  interface PerspectiveCamera {
    position: Vector3;
    lookAt(x: number, y: number, z: number): void;
    aspect: number;
    updateProjectionMatrix(): void;
  }

  interface WebGLRenderer {
    setPixelRatio(n: number): void;
    setSize(w: number, h: number): void;
    setClearColor(color: number): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    dispose(): void;
  }

  interface Light {
    position: Vector3;
  }

  export const Vector3: new (x?: number, y?: number, z?: number) => Vector3;
  export const BufferGeometry: new () => BufferGeometry;
  export const Scene: new () => Scene;
  export const PerspectiveCamera: new (fov: number, aspect: number, near: number, far: number) => PerspectiveCamera;
  export const WebGLRenderer: new (options?: any) => WebGLRenderer;
  export const AmbientLight: new (color: number, intensity: number) => Light;
  export const DirectionalLight: new (color: number, intensity: number) => Light;
  export const MeshStandardMaterial: new (options?: any) => Material;
  export const LineBasicMaterial: new (options?: any) => Material;
  export const Line: new (geometry: BufferGeometry, material: Material) => any;
  export const SphereGeometry: new (r: number, w: number, h: number) => BufferGeometry;
  export const BoxGeometry: new (w: number, h: number, d: number) => BufferGeometry;
  export const CylinderGeometry: new (r1: number, r2: number, h: number, s: number) => BufferGeometry;
  export const TorusGeometry: new (r: number, t: number, w: number, h: number) => BufferGeometry;
  export const OctahedronGeometry: new (r: number) => BufferGeometry;
  export const PlaneGeometry: new (w: number, h: number) => BufferGeometry;
  export const TetrahedronGeometry: new (r: number) => BufferGeometry;
}