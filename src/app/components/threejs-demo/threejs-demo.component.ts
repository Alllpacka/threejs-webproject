import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { RangeCustomEvent } from '@ionic/angular';
import {
  BoxGeometry,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Mesh,
  Clock,
  BufferAttribute,
  BufferGeometry,
  Texture,
  TextureLoader,
  Color,
  AmbientLight,
  MeshStandardMaterial,
  SpotLight,
  SphereGeometry,
  SpotLightHelper,
} from 'three';

@Component({
  selector: 'app-threejs-demo',
  templateUrl: './threejs-demo.component.html',
  styleUrls: ['./threejs-demo.component.scss'],
})
export class ThreejsDemoComponent implements OnInit, AfterViewInit {
  @ViewChild('threejs')
  canvas!: ElementRef<HTMLCanvasElement>;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  cube!: Mesh<BoxGeometry, MeshStandardMaterial>;
  sphere!: Mesh<SphereGeometry, MeshStandardMaterial>;
  rotation_speed!: number;
  clock: Clock = new Clock();
  map!: Mesh<BufferGeometry, MeshStandardMaterial>;
  startColor!: Color;
  targetColor!: Color;
  colorTransitionDuration!: number;
  colorProgress!: number;
  colorDirection!: number;
  lightColor!: Color;
  lightIntensity!: number;
  ambientLight!: AmbientLight;
  spotLight!: SpotLight;
  spotLightHelper!: SpotLightHelper;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;

    this.rotation_speed = 10;

    const box_geometry = new BoxGeometry(2, 2, 2);
    const box_material = new MeshStandardMaterial({ color: 0x00ff00 });
    this.cube = new Mesh(box_geometry, box_material);

    this.cube.position.set(10, 10, 0);

    this.cube.castShadow = true;

    this.scene.add(this.cube);

    const sphere_geometry = new SphereGeometry(5, 32, 16);
    const sphere_material = new MeshStandardMaterial({ color: Color.NAMES.aquamarine })
    this.sphere = new Mesh(sphere_geometry, sphere_material);

    this.sphere.position.set(0, 10, 0);

    this.sphere.castShadow = true;

    this.scene.add(this.sphere);

    this.startColor = new Color(0x70d4fa);
    this.targetColor = new Color(0xf75d2f);

    this.colorTransitionDuration = 5;
    this.colorProgress = 0;
    this.colorDirection = 1;

    this.cube.material.color.set(this.startColor);

    // this.spotLight = new SpotLight(0xffffff, 1000, 25, Math.PI * 0.1, 0.15, 1);
    this.spotLight = new SpotLight(0xffffff, 1000);
    this.spotLight.penumbra = 0.15
    this.spotLight.position.set(0, 40, 0);
    this.spotLight.target = this.sphere;

    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);

    this.spotLightHelper = new SpotLightHelper( this.spotLight );
		this.scene.add( this.spotLightHelper );


    this.lightColor = new Color(0x404040);
    this.lightIntensity = 10;

    this.ambientLight = new AmbientLight(this.lightColor, this.lightIntensity);
    this.ambientLight.position.set(100, 1000, 100);
    this.scene.add(this.ambientLight);

    this.camera.position.set(0, 15, 30);
    this.camera.rotation.set(-0.6, 0, 0);

    this.renderer.setAnimationLoop(() => this.animate());

    const loader = new TextureLoader();
    loader.load('assets/heightmaps/heightmap.png', (texture: Texture) =>
      this.onTextureLoaded(texture)
    );
  }

  animate() {
    const elapsed = this.clock.getDelta();

    this.colorProgress +=
      (elapsed / this.colorTransitionDuration) * this.colorDirection;

    if (this.colorProgress >= 1) {
      this.colorProgress = 1;
      this.colorDirection = -1;
    } else if (this.colorProgress <= 0) {
      this.colorProgress = 0;
      this.colorDirection = 1;
    }

    this.cube.material.color.lerpColors(
      this.startColor,
      this.targetColor,
      this.colorProgress
    );

    this.cube.rotation.x += this.rotation_speed * 0.1 * elapsed;
    this.cube.rotation.y += this.rotation_speed * 0.1 * elapsed;

    this.ambientLight.intensity = this.lightIntensity;
    this.ambientLight.color = this.lightColor;

    this.renderer.render(this.scene, this.camera);
  }

  onRotationChange(ev: Event) {
    const rangeEvent = ev as RangeCustomEvent;
    const rangeValue = rangeEvent.detail.value as number;

    this.rotation_speed = rangeValue;
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
      [0.55, 0.71, 0.49],
      [0.95, 0.78, 0.67],
      [1, 1, 1],
    ];
    const indices = [];

    // loop through every pixel in image
    for (let z = 0; z < data.height; z++) {
      for (let x = 0; x < data.width; x++) {
        const index = x * 4 + z * data.width * 4;
        const y = data.data[index] / 255; // normalize height data

        vertices.push(x - data.width / 2); // center terain around origin
        vertices.push(y * 5); // make height more pronounced
        vertices.push(z - data.height / 2); // center around origin

        // set color data
        if (y <= 0.5) {
          colors.push(...colorsInfos[0], 1);
        } else if (y > 0.5 && y <= 0.8) {
          colors.push(...colorsInfos[1], 1);
        } else {
          colors.push(...colorsInfos[2], 1);
        }
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

    const material = new MeshStandardMaterial();
    material.vertexColors = true;
    material.wireframe = false;

    this.map = new Mesh(geometry, material);

    this.map.receiveShadow = true;
    this.scene.add(this.map);
  }

  onLightIntensityChange(ev: Event) {
    const rangeEvent = ev as RangeCustomEvent;
    const rangevalue = rangeEvent.detail.value as number;

    this.lightIntensity = rangevalue;
  }
}
