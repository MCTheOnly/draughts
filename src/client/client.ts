import "./style.scss";
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui'
import { Box3, BufferGeometry, CubeTexture, DataTexture, Intersection, Object3D } from "three"
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const manager = new THREE.LoadingManager()

manager.onProgress = function (item, loaded, total) {

	// console.log(item, loaded, total);

};

manager.onLoad = function () {
	// console.log(scene.getObjectByName('sphere'))
}

//TEXTURES
const textureLoader = new THREE.TextureLoader()

const earthNormal = textureLoader.load('/earth-normal.jpg')

const bg = textureLoader.load('./bg.jpeg', () => {
	const rt = new THREE.WebGLCubeRenderTarget(bg.image.height)
	rt.fromEquirectangularTexture(renderer, bg)
	scene.background = rt.texture
})

//GUI
const gui = new GUI()
const folder = gui.addFolder('Folder')

const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}

const canvas = document.querySelector('.webgl')

//SCENE
const scene = new THREE.Scene()

scene.fog = new THREE.Fog(0xffffff, 5, 20)

//CAMERA
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	1000
)

camera.position.set(10, 10, 0)
camera.lookAt(0, 0, 0)

//LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
const light = new THREE.PointLight(0xffffff, 1)
light.position.set(20, 100, -70)

//RENDERER
const renderer = new THREE.WebGL1Renderer({
	canvas: canvas as HTMLElement,
	alpha: false as boolean,
	// antialias: true as boolean
})

// renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.25

//RAYCASTER
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
// let intersects: THREE.Intersection[]
const objs: THREE.Mesh[] = []


//MESH
//MESH - plane
const plane = new THREE.Mesh(
	new THREE.PlaneGeometry(10, 10),
	new THREE.MeshBasicMaterial({
		color: 0x1a1a1a,
		side: THREE.DoubleSide,
		wireframe: false,
		vertexColors: false
	}))

plane.position.set(0, 1, 0)
plane.rotateX(-Math.PI * 0.5)

let map: { [key: string]: any } = {}

const boxGroup = new THREE.Group();

for (let i = -2; i < 3; i++) {
	for (let j = -2; j < 3; j++) {
		map[`square${i}_${j}`] = new THREE.Mesh(
			new THREE.BoxBufferGeometry(1, 0.1, 1, 4, 1, 4),
			new THREE.MeshPhysicalMaterial({
				color: 0x4a4a4a,
				wireframe: false,
				metalness: .9,
				roughness: .05,
				clearcoat: 1,
				transparent: true,
				opacity: .5,
				reflectivity: 1,
				refractionRatio: 0.985,
				ior: 0.9,
				side: THREE.BackSide,
				sheen: 1

			})
		)
		map[`square${i}_${j}`].position.set(i, 1, j)
		map[`square${i}_${j}`].name = `square${i}_${j}`
		map[`square${i}_${j}`].userData.hovered = false
		map[`square${i}_${j}`].box = new THREE.Box3().setFromObject(map[`square${i}_${j}`])
		boxGroup.add(map[`square${i}_${j}`])

	}
}

//TEXTURES

let sphere

//MESH - sphere
let envmaploader = new THREE.PMREMGenerator(renderer)

new RGBELoader().load('/texture.hdr', function (hdrmap: any) {

	const texture = new THREE.CanvasTexture(new FlakesTexture())
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.repeat.x = 10;
	texture.repeat.y = 6;

	let envmap = envmaploader.fromCubemap(hdrmap)

	const sphereParams = {
		wireframe: false,
		// normalMap: earthNormal,
		// normalScale: new THREE.Vector2(1, 10),
		// emissiveIntensity: 2
		clearcoat: 1.0,
		clearcoatRoughness: 0.1,
		metalness: 0.9,
		roughness: 0.5,
		color: 0x8418ca,
		normalMap: texture,
		normalScale: new THREE.Vector2(0.15, 0.15),
		envMap: envmap.texture,
		sheen: 1
	}

	sphere = new THREE.Mesh(
		new THREE.SphereGeometry(0.3, 64, 64),
		new THREE.MeshPhysicalMaterial(sphereParams)
	)

	sphere.position.set(0, 1.3, 0)

	sphere.name = 'sphere'

	const sphereBox = new THREE.Box3().setFromObject(sphere)

	scene.add(sphere)

	// sphere.position.set(0,2,0)

})

const gridHelper = new THREE.GridHelper(100, 100, 0xff0000)

// scene.traverse((object) => {
// 	if ((object as THREE.Mesh).isMesh) {
// 		console.log(typeof object)
// 	}
// })

const sceneObjects = [
	camera,
	// plane,
	// gridHelper,
	boxGroup,
	// sphere,
	// box
	ambientLight,
	light
]

scene.add(...sceneObjects)

scene.traverse((object) => {
	if ((object as THREE.Mesh).isMesh) {
		objs.push(object as THREE.Mesh);
	}
})

renderer.setSize(window.innerWidth, window.innerHeight)

new OrbitControls(camera, renderer.domElement)

function onMouseMove(event: MouseEvent) {
	mouse.x = (event.clientX / sizes.width) * 2 - 1;
	mouse.y = - (event.clientY / sizes.height) * 2 + 1;
}

function resetBoard() {
	for (const object in map) {
		map[object].material.color.set(0x1f1f1f)
		map[object].userData.hovered = false

		// if (map[object].box.intersectsBox(sphereBox)) {
		// 	map[object].material.color.set(0x4a4a4a)
		// }

	}
}

window.addEventListener('mousemove', onMouseMove, false);

window.addEventListener('resize', () => {
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
});

window.addEventListener('click', clickHandler)

function clickHandler() {
	for (const object of objs) {
		if (object.userData.hovered) {
			scene.children[4].userData.destination = new THREE.Vector3(object.position.x, 1.3, object.position.z)
			// console.log(object)
		}
	}
}

function animate() {

	if (scene.children[4].userData.destination) {
		scene.children[4].position.lerp(scene.children[4].userData.destination, 0.1)
		if (scene.children[4].position == scene.children[4].userData.destination) {
			scene.children[4].userData.destination = false
			console.log('clicked')
		}
	}

	// sphereBox.copy(sphere.geometry.boundingBox as Box3).applyMatrix4(sphere.matrixWorld);
	// console.log(scene.getObjectByName('sphere'))

	resetBoard()
	requestAnimationFrame(animate)
	render()
}

function render() {

	raycaster.setFromCamera(mouse, camera)

	const intersects = raycaster.intersectObjects(scene.children)

	for (const intersect of intersects) {
		if (map[intersects[0].object.name]) {
			map[intersects[0].object.name].material.color.set(0xff0000)
			map[intersects[0].object.name].userData.hovered = true
			// console.log(intersect)

		}
	}

	renderer.render(scene, camera)
}

window.setTimeout(() => {
	// let sphere = scene.children[4]
	animate()
}, 4000)


