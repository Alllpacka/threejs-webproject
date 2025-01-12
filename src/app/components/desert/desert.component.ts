import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  AmbientLight,
  AnimationMixer,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  CylinderGeometry,
  DoubleSide,
  FogExp2,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  SpotLight,
  SpotLightHelper,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

@Component({
  selector: 'app-desert',
  templateUrl: './desert.component.html',
  styleUrls: ['./desert.component.scss'],
})
export class DesertComponent implements OnInit, AfterViewInit {
  @ViewChild('desert')
  canvas!: ElementRef<HTMLCanvasElement>;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  composer!: EffectComposer;

  clock!: Clock;
  mixer!: AnimationMixer;

  map!: Mesh<BufferGeometry, MeshPhongMaterial>;
  plane!: Mesh<PlaneGeometry, MeshPhongMaterial>;
  ambientLight!: AmbientLight;
  spotLight!: SpotLight;
  spotLightHelper!: SpotLightHelper;
  sky!: Mesh<SphereGeometry, MeshStandardMaterial>;
  innerSpotLight!: SpotLight;
  innerSpotLightHelper!: SpotLightHelper;

  laser!: Mesh<CylinderGeometry, MeshStandardMaterial>;
  laser2!: Mesh<CylinderGeometry, MeshStandardMaterial>;

  fog!: FogExp2;

  moon!: Mesh<SphereGeometry, MeshStandardMaterial>;
  moonLight!: SpotLight;
  moonLightHelper!: SpotLightHelper;
  moonHelper!: Mesh<BoxGeometry, MeshBasicMaterial>;

  outerSpotLight!: SpotLight;
  outerSpotLightHelper!: SpotLightHelper;
  helperCube!: Mesh<BoxGeometry, MeshBasicMaterial>;
  helperCube2!: Mesh<BoxGeometry, MeshBasicMaterial>;

  xAxis = new Vector3(1, 0, 0);
  yAxis = new Vector3(0, 1, 0);
  zAxis = new Vector3(0, 0, 1);

  radius = 50; // Radius of the circle
  angle = 0; // Angle in radians
  speed = 0.001; // Speed of the rotation

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.renderer = new WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.clock = new Clock();

    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.55, 0.21);
    this.composer.addPass(bloomPass);

    const mapControls = new MapControls(this.camera, this.renderer.domElement);
    mapControls.enableDamping = true;
    mapControls.dampingFactor = 0.05;
    mapControls.zoomToCursor = true;

    // const loader = new TextureLoader();
    // loader.load('assets/heightmaps/dunes/ground_0043_height_1k.png', (texture: Texture) =>
    //   this.onTextureLoaded(texture)
    // );

    const planeGeomitry = new PlaneGeometry(100, 100, 1000, 1000);

    const planeMaterial = new MeshPhongMaterial();

    const loader = new TextureLoader();

    const texture = loader.load(
      'assets/heightmaps/dunes/ground_0043_color_1k.jpg'
    );
    const displacement = loader.load(
      'assets/heightmaps/dunes/ground_0043_roughness_1k.jpg'
    );
    const normal = loader.load(
      'assets/heightmaps/dunes/ground_0043_normal_opengl_1k.png'
    );

    planeMaterial.map = texture;
    planeMaterial.displacementMap = displacement;
    planeMaterial.displacementScale = 5;

    planeMaterial.normalMap = normal;
    planeMaterial.normalScale.set(4, 4);

    this.plane = new Mesh(planeGeomitry, planeMaterial);
    this.plane.rotation.x = -Math.PI / 2;

    this.plane.receiveShadow = true;
    this.plane.castShadow = true;

    this.plane.position.y = -2;

    this.scene.add(this.plane);

    const gltfLoader = new GLTFLoader();

    gltfLoader.load('assets/models/inner_pyramid_bottom.glb', (gltf) => {
      const pyramid = gltf.scene;
      pyramid.scale.set(5, 5, 5);
      pyramid.receiveShadow = true;
      pyramid.castShadow = true;
      pyramid.position.set(0, 8, 0);
      this.scene.add(pyramid);
    });

    gltfLoader.load('assets/models/inner_pyramid_top.glb', (gltf) => {
      const pyramid = gltf.scene;

      if (pyramid instanceof Mesh && pyramid.material instanceof MeshStandardMaterial) {
        pyramid.material.emissive = new Color(0xFB7108);
        pyramid.material.emissiveIntensity = 1;
      }

      pyramid.scale.set(5, 5, 5);
      pyramid.receiveShadow = true;
      pyramid.castShadow = true;
      pyramid.position.set(0, 8, 0);
      this.scene.add(pyramid);
    });

    gltfLoader.load('assets/models/outer_pyramid_top.glb', (gltf) => {
      const pyramid = gltf.scene;

      if (pyramid instanceof Mesh && pyramid.material instanceof MeshStandardMaterial) {
        pyramid.material.emissive = new Color(0xFB7108);
        pyramid.material.emissiveIntensity = 1;
      }

      this.mixer = new AnimationMixer(pyramid);

      gltf.animations.forEach((clip) => {
        const clipAction = this.mixer.clipAction(clip);
        clipAction.timeScale = 1.2;
        clipAction.play();
      });

      pyramid.scale.set(5, 5, 5);
      pyramid.receiveShadow = true;
      pyramid.castShadow = true;
      pyramid.position.set(0, 8, 0);
      this.scene.add(pyramid);
    });

    gltfLoader.load('assets/models/outer_pyramid_bottom.glb', (gltf) => {
      const pyramid = gltf.scene;

      if (pyramid instanceof Mesh && pyramid.material instanceof MeshStandardMaterial) {
        // pyramid.material.transparent = true
        // pyramid.material.depthWrite = false;
        // pyramid.material.opacity = 0.95;
        pyramid.material.alphaTest = 0.5;
      }

      pyramid.scale.set(5, 5, 5);
      pyramid.receiveShadow = true;
      pyramid.castShadow = true;
      pyramid.position.set(0, 8, 0);
      this.scene.add(pyramid);
    });

    const skyGeomitry = new SphereGeometry();
    const skyMaterial = new MeshStandardMaterial();

    const skyTexture = loader.load('assets/stars2.png');

    skyMaterial.map = skyTexture;
    skyMaterial.side = DoubleSide;
    skyMaterial.emissive = new Color(0xfb7108);
    skyMaterial.emissiveIntensity = 0.001;

    this.sky = new Mesh(skyGeomitry, skyMaterial);

    this.sky.scale.set(100, 100, 100);
    this.sky.position.y = 5;

    this.scene.add(this.sky);

    // this.spotLight = new SpotLight(0xffffff, 100);
    // this.spotLight.penumbra = 0.15
    // this.spotLight.position.set(0, 60, 0);

    // this.spotLight.castShadow = true;

    // this.scene.add(this.spotLight);

    // this.spotLightHelper = new SpotLightHelper(this.spotLight);
    // this.scene.add(this.spotLightHelper);

    // this.helperCube = new Mesh(new BoxGeometry(), new MeshBasicMaterial());

    // this.helperCube.position.set(0, 12, 0);
    // this.helperCube.visible = false;

    // this.scene.add(this.helperCube);

    // this.helperCube2 = new Mesh(new BoxGeometry(), new MeshBasicMaterial());

    // this.helperCube2.position.set(0, 100, 0);
    // this.helperCube2.visible = false;

    // this.scene.add(this.helperCube2);

    // this.innerSpotLight = new SpotLight(0xfb7108, 10);
    // this.innerSpotLight.target = this.helperCube;
    // this.innerSpotLight.position.y = 7;
    // this.innerSpotLight.angle = 0.2;
    // this.innerSpotLight.distance = 4.7;

    // this.innerSpotLightHelper = new SpotLightHelper(this.innerSpotLight);

    // this.scene.add(this.innerSpotLight, this.innerSpotLightHelper);

    const laserGeomitry = new CylinderGeometry(0.95, 0.001, 5.5, 32);
    const laserMaterial = new MeshPhysicalMaterial({
      color: 0xfb7108,
      emissive: 0xfb7108,
      transparent: true,
      opacity: 0.1,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.9,
      ior: 1.5,
      thickness: 0.2,
      depthTest: true,
      depthWrite: false,
    });

    this.laser = new Mesh(laserGeomitry, laserMaterial);

    this.laser.position.y = 9.2;

    this.scene.add(this.laser);

    // this.outerSpotLight = new SpotLight(0xFB7108);
    // this.outerSpotLight.target = this.helperCube2;
    // this.outerSpotLight.position.y = 15;
    // this.outerSpotLight.angle

    const laserGeomitry2 = new CylinderGeometry(1, 0.3, 100, 32);
    const laserMaterial2 = new MeshPhysicalMaterial({
      color: 0xfb7108,
      emissive: 0xfb7108,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.9,
      ior: 1.5,
      thickness: 0.2,
      depthTest: true,
      depthWrite: false,
    });

    this.laser2 = new Mesh(laserGeomitry2, laserMaterial2);

    this.laser2.position.y = 62;

    this.scene.add(this.laser2);

    this.scene.fog = new FogExp2(0x555555, 0.005);

    const moonHelperGeometry = new BoxGeometry();

    const moonHelperMaterial = new MeshBasicMaterial();

    this.moonHelper = new Mesh(moonHelperGeometry, moonHelperMaterial);

    // this.moonHelper.visible = false;

    this.scene.add(this.moonHelper);

    this.moonLight = new SpotLight(0xfb7108, 10000);
  
    this.moonLight.distance = 80;
    this.moonLight.angle = 0.2


    this.moonLight.target = this.moonHelper;
    this.moonLight.position.set(10, 50, 0);

    this.moonLightHelper = new SpotLightHelper(this.moonLight);
    this.scene.add(this.moonLight, this.moonLightHelper);

    const moonGemomitry = new SphereGeometry();

    const moonMap = loader.load('assets/moonTexture_Orange.png');
    const moonDisplacement = loader.load('assets/moonDisplacement.png');

    const moonMaterial = new MeshStandardMaterial({
      map: moonMap,
      displacementMap: moonDisplacement,
      displacementScale: 0.1,
    });

    this.moon = new Mesh(moonGemomitry, moonMaterial);

    this.moon.position.set(10, 50, 0);

    this.scene.add(this.moon);

    this.ambientLight = new AmbientLight(Color.NAMES.white, 0.1);
    this.ambientLight.position.set(100, 10000, 100);
    this.scene.add(this.ambientLight);

    this.camera.position.set(0, 15, 30);
    this.camera.rotation.set(-0.6, 0, 0);

    this.renderer.setAnimationLoop(() => this.animate());
  }

  animate() {
    this.sky.rotateOnAxis(this.yAxis, Math.PI / 50 / 180);
    this.moon.rotateOnAxis(this.yAxis, Math.PI / 50 / 180);

    this.angle += this.speed; // Increment the angle
    this.moon.position.x = this.radius * Math.cos(this.angle); // x-coordinate
    this.moon.position.z = this.radius * Math.sin(this.angle); // z-coordinate

    this.moonHelper.position.x = (this.radius / 3) * Math.cos(this.angle * 2);
    this.moonHelper.position.z = (this.radius / 3) * Math.cos(this.angle * 2);

    this.moonLight.position.set(this.moon.position.x, this.moon.position.y, this.moon.position.z);

    this.moonLight.target = this.moonHelper;

    this.moonLightHelper.update();

    if (this.mixer) this.mixer.update(this.clock.getDelta());

    this.composer.render();
    
    // this.renderer.render(this.scene, this.camera);
  }

  private onTextureLoaded(texture: Texture) {
    console.log('Texture loaded');
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(texture.image, 0, 0);

    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    this.generateTerrain(data);
  }

  private generateTerrain(data: ImageData) {
    const vertices = [];
    const colors = [];
    const colorsInfos = [
      [0.5, 0.25, 0], // Darker orange for lower parts
      [1, 0.5, 0], // Vibrant orange for mid-level parts
      [1, 0.25, 0], // Bright orange for top parts
    ];
    const indices = [];

    // loop through every pixel in image
    for (let z = 0; z < data.height; z++) {
      for (let x = 0; x < data.width; x++) {
        const index = x * 4 + z * data.width * 4;
        const normalHeight = data.data[index] / 255; // normalize height data
        const y = Math.pow(normalHeight, 1);

        // Determine a blend factor based on height
        // Blend height to match orange shades
        let blendedColor;
        if (normalHeight <= 0.33) {
          blendedColor = colorsInfos[0]; // Darker orange
        } else if (normalHeight <= 0.66) {
          blendedColor = colorsInfos[1]; // Vibrant orange
        } else {
          blendedColor = colorsInfos[2]; // Bright orange
        }

        // Add blended color to colors array
        colors.push(...blendedColor, 1);

        vertices.push(x - data.width / 2); // center terain around origin
        vertices.push(y * 5); // msake height more pronounced
        vertices.push(z - data.height / 2); // center around origin
      }
    }

    // generate indecies
    for (let j = 0; j < data.height - 1; j++) {
      const offset = j * data.height;

      for (let i = offset; i < offset + data.width - 1; i++) {
        // generate first triangle
        indices.push(i);
        indices.push(i + data.width);
        indices.push(i + 1);

        // generate second triangle
        indices.push(i + 1);
        indices.push(i + data.width);
        indices.push(i + 1 + data.width);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertices), 3) // set position of geometry
    );
    geometry.setAttribute(
      'color',
      new BufferAttribute(new Float32Array(colors), 4) // set color of geometry
    );
    geometry.computeVertexNormals();

    const material = new MeshPhongMaterial();
    material.vertexColors = true;
    material.wireframe = false;

    this.map = new Mesh(geometry, material);

    this.map.receiveShadow = true;
    this.map.castShadow = true;
    this.scene.add(this.map);
    console.log(this.map);
  }
}
