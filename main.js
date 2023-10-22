import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TGALoader } from 'three/addons/loaders/TGALoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//these values need to be set depending on the role player model
const CAMERA_CONSTANTS = {
    STARTING_DISTANCE : 4,
    FOLLOWING_DISTANCE: 7,
    FOLLOWING_SPEED: 0.2,
    LINE_OF_SIGHT_OFFSET: 3
};

const ROLE_PLAYER_CONSTANTS = {
    PERSPECTIVE_AXIS: "x", 
    VERTICAL_AXIS: "y", 
    HORIZONTAL_AXIS: "z",
    SCALE: 0.005,
    SPEED: 0.2,
    SPEED_MULTIPLIER_ROTATION: 0.5
};

const CONTROLS = {
    LINE_OF_SIGHT_OFFSET: 2,
    keys: ['W', 'S', 'A', 'D', 'ControlLeft', 'Space']
}

//set these to configure controls
const keys = CONTROLS.keys;

const spawnPosition = new THREE.Vector3(0, 0, 0);

const cameraLineOfSightOffset = new THREE.Vector3(0, 0, 0);
cameraLineOfSightOffset[ROLE_PLAYER_CONSTANTS.VERTICAL_AXIS] = CAMERA_CONSTANTS.LINE_OF_SIGHT_OFFSET;

const targetLineOfSightOffset = new THREE.Vector3(0, 0, 0);
targetLineOfSightOffset[ROLE_PLAYER_CONSTANTS.VERTICAL_AXIS] = CONTROLS.LINE_OF_SIGHT_OFFSET;

const cameraPositionOffsetVector = new THREE.Vector3(0, 0, 0);
cameraPositionOffsetVector[ROLE_PLAYER_CONSTANTS.PERSPECTIVE_AXIS] = -CAMERA_CONSTANTS.STARTING_DISTANCE;
const cameraSpawnPosition = spawnPosition.clone().add(cameraPositionOffsetVector).add(cameraLineOfSightOffset);

camera.position.set(cameraSpawnPosition.x, cameraSpawnPosition.y, cameraSpawnPosition.z);

setAmbientLight();

const clock = new THREE.Clock();
var rolePlayer;
const manager = new THREE.LoadingManager();

manager.addHandler(/\.tga$/i, new TGALoader())

var mixer;
var translatePrespective, rotateOnVertical, rotateOnHorizontal;
new FBXLoader(manager).load('/phoenix_bird/source/fly.fbx', function(fbx) {
    
    rolePlayer = fbx;
    rolePlayer.scale.multiplyScalar(ROLE_PLAYER_CONSTANTS.SCALE);
    translatePrespective = Object.getPrototypeOf(Object.getPrototypeOf(rolePlayer))[`translate${ROLE_PLAYER_CONSTANTS.PERSPECTIVE_AXIS.toUpperCase()}`];
    rotateOnVertical = Object.getPrototypeOf(Object.getPrototypeOf(rolePlayer))[`rotate${ROLE_PLAYER_CONSTANTS.VERTICAL_AXIS.toUpperCase()}`];
    rotateOnHorizontal = Object.getPrototypeOf(Object.getPrototypeOf(rolePlayer))[`rotate${ROLE_PLAYER_CONSTANTS.HORIZONTAL_AXIS.toUpperCase()}`];

    rolePlayer.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    mixer = new THREE.AnimationMixer(rolePlayer);
    mixer.clipAction(rolePlayer.animations[0]).play();

    scene.add(rolePlayer);
    

    document.onkeydown = function (event) {
        console.log(event.code)
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


const controls = new OrbitControls(camera, renderer.domElement);

scene.add(new THREE.GridHelper( 40, 40 ));
scene.add(new THREE.AxesHelper());

function animate(){

    requestAnimationFrame(animate);
    
    if(!rolePlayer){
        return;
    }

    handleMovement();

    updateCamera();

    renderer.render(scene, camera);
    mixer.update(clock.getDelta())

}


function handleMovement() {
    if(keys['Space']){
        translatePrespective.apply(rolePlayer, [ROLE_PLAYER_CONSTANTS.SPEED]);
    }
     if(keys['ControlLeft']){ 
        translatePrespective.apply(rolePlayer, [-ROLE_PLAYER_CONSTANTS.SPEED]);    
    }
    if(keys['A']){ 
        rotateOnVertical.apply(rolePlayer, [ROLE_PLAYER_CONSTANTS.SPEED*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);
    }
    if(keys['D']){
        rotateOnVertical.apply(rolePlayer, [-ROLE_PLAYER_CONSTANTS.SPEED*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);
    }
    if(keys['S']){ 
        rotateOnHorizontal.apply(rolePlayer, [-ROLE_PLAYER_CONSTANTS.SPEED*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);    
    }   
    if(keys['W']){ 
        rotateOnHorizontal.apply(rolePlayer, [ROLE_PLAYER_CONSTANTS.SPEED*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);    
    }
}

function updateCamera() {

    if(camera.position.distanceTo(rolePlayer.position) > CAMERA_CONSTANTS.FOLLOWING_DISTANCE){
        const distance = rolePlayer.position.distanceTo(camera.position);
        const translationVector = rolePlayer.position.clone().sub(camera.position).add(cameraLineOfSightOffset).normalize();
        // camera.translateOnAxis(translationVector, distance - CAMERA_CONSTANTS.FOLLOWING_DISTANCE ); // why does this not work ?
        camera.position.addScaledVector(translationVector, distance - CAMERA_CONSTANTS.FOLLOWING_DISTANCE);
    }

    controls.target = rolePlayer.position.clone().add(targetLineOfSightOffset);
    
    camera.lookAt(controls.target);

    controls.update();
}

function setAmbientLight() {
    scene.add(new THREE.AmbientLight())
}

animate();
