import "./style.scss"
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GUI } from 'dat.gui'
import { Box3, BufferGeometry, Color, CubeTexture, DataTexture, Intersection, Object3D, Vector3 } from "three"
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

//VARIABLES

const boardColor1 = 0x8a8a8a
const boardColor2 = 0xd6d6d6

//MANAGER
const manager = new THREE.LoadingManager()

manager.onProgress = function (url, loaded, total) {
	console.log(url, loaded, total)
}

manager.onError = function (url) {
	console.log('There was an error loading ' + url)
}

//TEXTURES
const textureLoader = new THREE.TextureLoader(manager)

const earthNormal = textureLoader.load('/earth-normal.jpg')

const bg = textureLoader.load('./bg.jpeg', () => {
	const rTarget = new THREE.WebGLCubeRenderTarget(bg.image.height)
	rTarget.fromEquirectangularTexture(renderer, bg)
	scene.background = rTarget.texture
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

// scene.fog = new THREE.Fog(0xffffff, 10, 20)

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
const objs: THREE.Mesh[] = []


//MESH

let map: { [key: string]: any } = {}

let selected: any = []

const boxGroup = new THREE.Group()

const texture = new THREE.CanvasTexture(new FlakesTexture())

const createSphere = (x: number, z: number, map: any, color: number) => {

	new RGBELoader(manager).load('/texture.hdr', function (hdrmap: any) {

		texture.wrapS = THREE.RepeatWrapping
		texture.wrapT = THREE.RepeatWrapping
		texture.repeat.x = 10
		texture.repeat.y = 6

		const envmap = envmaploader.fromCubemap(hdrmap)

		const sphereParams = {
			wireframe: false,
			// normalMap: earthNormal,
			// normalScale: new THREE.Vector2(1, 10),
			// emissiveIntensity: 2
			clearcoat: 1.0,
			clearcoatRoughness: 0.1,
			metalness: 0.9,
			roughness: 0.5,
			color: color,
			// color: 0x8418ca,
			// color: 0x1a4fd6,
			normalMap: texture,
			normalScale: new THREE.Vector2(0.15, 0.15),
			envMap: envmap.texture,
			sheen: 1
		}

		sphere = new THREE.Mesh(
			new THREE.SphereGeometry(0.3, 64, 64),
			new THREE.MeshPhysicalMaterial(sphereParams)
		)

		sphere.position.set(x, 1.3, z)

		sphere.name = `sphere${x}_${z}`

		sphere.userData.hovered = false
		sphere.userData.color = color
		sphere.userData.destination = false

		const sphereBox = new THREE.Box3().setFromObject(sphere)

		map[`sphere${x}_${z}`] = sphere

		scene.add(sphere)
		console.log(sphere)
	})
}

for (let i = -4; i < 4; i++) {
	for (let j = -4; j < 4; j++) {

		let color = (j % 2 == 0 && i % 2 == 0) ? boardColor1 : (j % 2 != 0 && i % 2 != 0) ? boardColor1 : boardColor2

		map[`square${i}_${j}`] = new THREE.Mesh(
			new THREE.BoxBufferGeometry(1, 0.1, 1, 4, 1, 4),
			new THREE.MeshPhysicalMaterial({
				color: color,
				wireframe: false,
				metalness: .9,
				roughness: .05,
				clearcoat: 1,
				transparent: true,
				opacity: .7,
				reflectivity: 1,
				refractionRatio: 0.985,
				ior: 0.9,
				side: THREE.BackSide,
				sheen: 1
			})
		)

		map[`square${i}_${j}`].userData.color = color
		map[`square${i}_${j}`].position.set(i, 1, j)
		map[`square${i}_${j}`].name = `square${i}_${j}`
		map[`square${i}_${j}`].userData.hovered = false
		map[`square${i}_${j}`].box = new THREE.Box3().setFromObject(map[`square${i}_${j}`])

		let squarePos = new THREE.Vector3

		squarePos.set(map[`square${i}_${j}`].position.x, 1.3, map[`square${i}_${j}`].position.z)

		boxGroup.add(map[`square${i}_${j}`])

		if (color == boardColor2 && ([1, 2, 3, -2, -3, -4].includes(i))) {
			if (i == 1) {
				createSphere(i, j, map, 0x8418ca)
			}
		}
	}
}

//TEXTURES

let sphere

//MESH - sphere
let envmaploader = new THREE.PMREMGenerator(renderer)

const gridHelper = new THREE.GridHelper(100, 100, 0xff0000)

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

renderer.setSize(window.innerWidth, window.innerHeight)

new OrbitControls(camera, renderer.domElement)

function onMouseMove(event: MouseEvent) {
	mouse.x = (event.clientX / sizes.width) * 2 - 1
	mouse.y = - (event.clientY / sizes.height) * 2 + 1
}

function resetBoard() {
	for (const object in map) {
		map[object].material.color.set(map[object].userData.color)
		map[object].userData.hovered = false

		// if (map[object].box.intersectsBox(sphereBox)) {
		// 	map[object].material.color.set(0x4a4a4a)
		// }
	}
}

window.addEventListener('mousemove', onMouseMove, false);

window.addEventListener('resize', () => {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('click', clickHandler)


function clickHandler() {
	for (const object of objs) {
		if (object.userData.hovered) {
			if (object.name.includes('square')) {
				if (selected.length > 0) {
					scene.getObjectByName(selected[0].name).userData.destination = new THREE.Vector3(object.position.x, 1.3, object.position.z)
					console.log(scene.getObjectByName(object.name))
				}
			}
			if (object.name.includes('sphere')) {
				selected.push(scene.getObjectByName(object.name))
			}
		}
	}

}

window.addEventListener('dblclick', resetSelected)

function resetSelected() {
	selected = []
}

function animate() {

	console.log(selected, scene.children)

	if (selected.length > 0) {
		if (scene.getObjectByName(selected[0].name).userData.destination) {
			scene.getObjectByName(selected[0].name).position.lerp(scene.getObjectByName(selected[0].name).userData.destination, 0.1)
			if (scene.getObjectByName(selected[0].name).position == scene.getObjectByName(selected[0].name).userData.destination) {
				scene.getObjectByName(selected[0].name).userData.destination = false
				console.log('clicked')
			}
		}
	}

	// sphereBox.copy(sphere.geometry.boundingBox as Box3).applyMatrix4(sphere.matrixWorld);

	resetBoard()
	requestAnimationFrame(animate)
	render()
}

function render() {

	raycaster.setFromCamera(mouse, camera)
	const intersects = raycaster.intersectObjects(scene.children)

	for (const intersect of intersects) {

		if (intersects[0].object.name.includes('square')) {
			map[intersects[0].object.name].material.color.set(0xff0000)
			map[intersects[0].object.name].userData.hovered = true
		}
		if (intersects[0].object.name.includes('sphere')) {
			map[intersects[0].object.name].material.color.set(0xffffff)
			map[intersects[0].object.name].userData.hovered = true
		}
	}

	camera.updateMatrix()

	renderer.render(scene, camera)
}

manager.onLoad = function () {
	scene.traverse((object) => {
		if ((object as THREE.Mesh).isMesh) {
			objs.push(object as THREE.Mesh)
		}
	})

	animate()
}



