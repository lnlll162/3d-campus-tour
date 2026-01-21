// Example loader for manifest-driven, LOD-aware model loading (Three.js)
// Requires: three.min.js, GLTFLoader, DRACOLoader, KTX2Loader
// This is a minimal example to illustrate the flow; adapt to your app structure.

class CampusLoader {
  constructor(renderer) {
    this.renderer = renderer;
    this.manager = new THREE.LoadingManager();
    this.dracoLoader = new THREE.DRACOLoader();
    // set path to draco decoder if used
    this.dracoLoader.setDecoderPath('/draco/');

    this.ktx2Loader = new THREE.KTX2Loader().setTranscoderPath('/basis/');
    this.ktx2Loader.detectSupport(renderer);

    this.gltfLoader = new THREE.GLTFLoader(this.manager);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);

    this.loadedRegions = new Map(); // id -> scene group
  }

  async loadManifest(url) {
    const res = await fetch(url);
    this.manifest = await res.json();
    return this.manifest;
  }

  // simple AABB viewer: check if camera position is inside bbox (for demo)
  regionNeedsLoading(region, cameraPosition) {
    const [minX, minY, minZ, maxX, maxY, maxZ] = region.bbox;
    const x = cameraPosition.x, y = cameraPosition.y, z = cameraPosition.z;
    return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
  }

  // load region with progressive LOD
  loadRegion(region, scene, camera) {
    if (this.loadedRegions.has(region.id)) return Promise.resolve(this.loadedRegions.get(region.id));

    const group = new THREE.Group();
    group.name = region.id;
    scene.add(group);
    this.loadedRegions.set(region.id, group);

    // load low LOD first
    const lod2 = region.lod.lod2;
    const lod1 = region.lod.lod1;
    const lod0 = region.lod.lod0;

    const loadGLB = (url) => new Promise((resolve, reject) => {
      this.gltfLoader.load(url, (gltf) => resolve(gltf), undefined, reject);
    });

    // Progressive load: lod2 -> lod1 -> lod0
    return loadGLB(lod2)
      .then(gltf => {
        group.add(gltf.scene);
        return loadGLB(lod1);
      })
      .then(gltf => {
        // remove previous child(s) and add higher LOD
        group.clear();
        group.add(gltf.scene);
        return loadGLB(lod0);
      })
      .then(gltf => {
        group.clear();
        group.add(gltf.scene);
        return group;
      })
      .catch(err => {
        console.error('Region load failed', err);
        return group;
      });
  }

  // public: update loader based on camera position (call each frame or throttled)
  async update(scene, camera) {
    if (!this.manifest) return;
    const camPos = camera.position;
    for (const region of this.manifest.regions) {
      if (this.regionNeedsLoading(region, camPos)) {
        if (!this.loadedRegions.has(region.id)) {
          this.loadRegion(region, scene, camera);
        }
      } else {
        // optional: unload distant regions
        // if (this.loadedRegions.has(region.id)) { ... }
      }
    }
  }
}

// Usage example:
// const loader = new CampusLoader(renderer);
// await loader.loadManifest('/manifests/campus_manifest.json');
// in render loop: loader.update(scene, camera);


