import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import * as globe from './globe.js'
import * as debris_handler from './debris_handler.js'
import { get_slider_value } from './slider.js'
import * as TWEEN from "@tweenjs/tween.js";
import { drawPath } from './debris'
import "./area_selector.js";
import { sgp4 } from 'satellite.js';
import { parseStationsFromFile, getStationPosition } from "./satellite_util.js";
import { debris } from './satellite_registry'

export const REAL_EARTH_RADIUS = 6371;
export const EARTH_RADIUS = 10;
export const SCALE_RATIO = EARTH_RADIUS / REAL_EARTH_RADIUS;

//Basic stuff
//const gui = new dat.GUI()
const canvas = document.querySelector('canvas.webgl')
export const scene = new THREE.Scene()          //Need to export it so that mouse_move event can have it with raycasting

export function add_to_scene(obj) {
    scene.add(obj);
}
export function remove_from_scene(obj) {
    scene.remove(obj);
}

// Textures
const textureLoader = new THREE.TextureLoader()
const earthTexture = textureLoader.load('textures/EarthTexture.jpg')
const earthNormalMap = textureLoader.load('textures/NormalMap.jpg')
const starsTexture = textureLoader.load('textures/8k_stars_milky_way.jpg')
const debrisTexture = textureLoader.load('textures/circle.png')

// sky
const sky = new THREE.SphereGeometry(90, 64, 64)
const stars = new THREE.MeshBasicMaterial();
stars.map = starsTexture
stars.side = THREE.BackSide
scene.add(new THREE.Mesh(sky, stars))

// globe
const sphere = globe.globe(EARTH_RADIUS, earthTexture, earthNormalMap);
//const atmosphere = globe.atmosphere(EARTH_RADIUS-1);
scene.add(sphere)
//scene.add(atmosphere)

// Lights
scene.add(new THREE.AmbientLight(0x333333, 5));
const light = new THREE.DirectionalLight(0xffffff, 0.15)
light.castShadow = true;

light.position.set(100, 100, 0).normalize();
//gui.add(light, 'intensity').min(0).max(8).step(0.01)
//gui.add(light.position, 'x')
//gui.add(light.position, 'y')
//gui.add(light.position, 'z')
scene.add(light)

//Canvas Size
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Camera
export const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.01, 1000)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 20
scene.add(camera)


// Controls
const controls = new OrbitControls(camera, canvas)
controls.rotateSpeed = 0.3;
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = EARTH_RADIUS + 1;
controls.maxDistance = 10 * EARTH_RADIUS;

//debris
var debris_positions = [];
export const origin_date = new Date();
export let date = new Date();           //Using this to store modified date
for (let i = 0; i < debris.length; i++) {
    debris_positions.push([i, ...getStationPosition(debris[i], date)]);
}
// Debris should be passed with ([ [debris_id, x, y, z], ...], Texture to draw)
export const debris_objects = debris_handler.draw_debris(debris_positions, debrisTexture);
scene.add(...debris_objects);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Animation
let frames = 0
function tick(time) {
    frames += 1
    if (frames == 60) {
        let new_date = new Date();
        //new_date.setTime(new_date.getTime())
        new_date.setHours(new_date.getHours()+get_slider_value());
        debris_handler.updateDebrisPositions(new_date);
        frames = 0;
    }
    controls.update()
    renderer.render(scene, camera)
    TWEEN.update(time);
    requestAnimationFrame(tick);
}

tick(0);
