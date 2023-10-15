import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const keys = ['W', 'S', 'A', 'D'];

const spawnPosition = new THREE.Vector3(0, 0, 0);
const lineOfSightOffset = new THREE.Vector3(0, 2, 0); 
const cameraSpawnPosition = spawnPosition.clone().add(new THREE.Vector3(0, 3, -3));
camera.position.set(cameraSpawnPosition.x, cameraSpawnPosition.y, cameraSpawnPosition.z);

var rolePlayer;
const loader = new GLTFLoader();
loader.load('/cloth_ghost/scene.gltf', function(gltf) {
    rolePlayer = gltf.scene;
    rolePlayer.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    console.log(rolePlayer)
    scene.add(rolePlayer);
    camera.lookAt(rolePlayer.position + lineOfSightOffset);
    
    document.onkeydown = function (event) {
        const key = event.code.replace("Key", "")
        keys[key] = true;
    }
    
    document.onkeyup = function (event) {
        const key = event.code.replace("Key", "")
        keys[key] = false;
    }
}, undefined, function (error) {
    console.error(error);
});

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0,0,-5);
scene.add(light);

const controls = new OrbitControls(camera, renderer.domElement);

scene.add(new THREE.GridHelper( 40, 40 ));
scene.add(new THREE.AxesHelper());

function animate(){

    requestAnimationFrame(animate);
    
    handleMovement();

    updateCamera();

    renderer.render(scene, camera);
}

function handleMovement() {
    if(keys['W']){
        rolePlayer.translateZ(0.1);
    }
     if(keys['S']){ 
        rolePlayer.translateZ(-0.1);
    }
    if(keys['A']){ 
        rolePlayer.rotateY(0.1);
     
    }
    if(keys['D']){
        rolePlayer.rotateY(-0.1);
    }
}

function updateCamera() {
    if(rolePlayer == undefined) {
        return;
    }
    
    if(camera.position.distanceTo(rolePlayer.position) > 5){
        camera.translateZ(-0.1);
    }
    camera.position.y = 3;
    controls.target = rolePlayer.position.clone().add(lineOfSightOffset);
    camera.lookAt(controls.target);
    controls.update();
}

animate();
