import {
  Component, OnInit, AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { AmbientLight, BufferAttribute, BufferGeometry, Color, Loader, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, SpotLight, SpotLightHelper, Texture, TextureLoader, WebGLRenderer } from 'three';


import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';

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
  map!: Mesh<BufferGeometry, MeshStandardMaterial>;
  ambientLight!: AmbientLight;
  spotLight!: SpotLight;
  spotLightHelper!: SpotLightHelper;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    const mapControls = new MapControls(this.camera, this.renderer.domElement)
    mapControls.enableDamping = true;
    mapControls.dampingFactor = 0.05;
    mapControls.zoomToCursor = true;

    const loader = new TextureLoader();
    loader.load('assets/heightmaps/render2.png', (texture: Texture) =>
      this.onTextureLoaded(texture)
    );

    this.spotLight = new SpotLight(0xffffff, 1000);
    this.spotLight.penumbra = 0.15
    this.spotLight.position.set(0, 60, 0);

    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);

    this.spotLightHelper = new SpotLightHelper(this.spotLight);
    this.scene.add(this.spotLightHelper);

    this.ambientLight = new AmbientLight(Color.NAMES.white, 0.1);
    this.ambientLight.position.set(100, 1000, 100);
    this.scene.add(this.ambientLight);

    this.camera.position.set(0, 15, 30);
    this.camera.rotation.set(-0.6, 0, 0);

    this.renderer.setAnimationLoop(() => this.animate());
  }

  animate() {
    this.renderer.render(this.scene, this.camera);
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
      [1, 0.5, 0],    // Vibrant orange for mid-level parts
      [1, 0.25, 0],   // Bright orange for top parts
    ];
    const indices = [];

    // loop through every pixel in image
    for (let z = 0; z < data.height; z++) {
      for (let x = 0; x < data.width; x++) {
        const index = x * 4 + z * data.width * 4;
        const normalHeight = data.data[index] / 255; // normalize height data
        const y = Math.pow(normalHeight, 4);

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
        vertices.push(y * 5); // make height more pronounced
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

    const material = new MeshStandardMaterial();
    material.vertexColors = true;
    material.wireframe = false;

    this.map = new Mesh(geometry, material);

    this.map.receiveShadow = true;
    this.map.castShadow = true;
    this.scene.add(this.map);
    console.log(this.map);
  }

}
