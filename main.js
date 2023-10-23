import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TGALoader } from 'three/addons/loaders/TGALoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
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
    SCALE: 0.003,
    SPEED: 0.05,
    RUNNING_SPEED: 0.1,
    SPEED_MULTIPLIER_ROTATION: 0.5
};

const CONTROLS = {
    LINE_OF_SIGHT_OFFSET: 2,
    keys: ['W', 'S', 'A', 'D', 'ControlLeft', 'Space']
}

//set these to configure controls
const keys = CONTROLS.keys;

const spawnPosition = new THREE.Vector3(113, 5, 323);

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

var speed = ROLE_PLAYER_CONSTANTS.SPEED;
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
        if(key === 'ShiftLeft'){
            speed = ROLE_PLAYER_CONSTANTS.RUNNING_SPEED;
        }
    }
    
    document.onkeyup = function (event) {
        const key = event.code.replace("Key", "")
        keys[key] = false;
        if(key === 'ShiftLeft'){
            speed = ROLE_PLAYER_CONSTANTS.SPEED;
        }
    }
    
}, undefined, function (error) {
    console.error(error);
});


const controls = new OrbitControls(camera, renderer.domElement);

// scene.add(new THREE.GridHelper( 40, 40 ));
// scene.add(new THREE.AxesHelper());

// const planeWidth = 10000;
// const planeLength = 10000;

// const geometry = new THREE.PlaneGeometry( planeWidth, planeLength );
// const texture = new THREE.TextureLoader().load('/sand.jpg')
// const material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );

// const plane = new THREE.Mesh( geometry, material );
// plane.rotateX(Math.PI/2)
// scene.add( plane );

var desert;
new GLTFLoader().load('/desert_map/scene.gltf', function(gltf) {
    desert = gltf.scene;
    desert.scale.set(150,150,150)
    scene.add(desert);
})


// Sky - source : https://github.com/mrdoob/three.js/blob/master/examples/webgl2_volume_cloud.html
const canvas = document.createElement( 'canvas' );
canvas.width = 1;
canvas.height = 32;

const context = canvas.getContext( '2d' );
const gradient = context.createLinearGradient( 0, 0, 14, 32 );
gradient.addColorStop( 0.0, '#014a84' );
gradient.addColorStop( 0.5, '#0561a0' );
gradient.addColorStop( 1.0, '#437ab6' );
context.fillStyle = gradient;
context.fillRect( 0, 0, 1, 32 );

const skyMap = new THREE.CanvasTexture( canvas );
skyMap.colorSpace = THREE.SRGBColorSpace;

const sky = new THREE.Mesh(
    new THREE.SphereGeometry( 14000 ),
    new THREE.MeshBasicMaterial( { map: skyMap, side: THREE.BackSide } )
);
scene.add( sky );


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
        translatePrespective.apply(rolePlayer, [speed]);
        console.log(rolePlayer.position)
    }
     if(keys['ControlLeft']){ 
        translatePrespective.apply(rolePlayer, [-speed]);    
    }
    if(keys['A']){ 
        rotateOnVertical.apply(rolePlayer, [speed*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);
    }
    if(keys['D']){
        rotateOnVertical.apply(rolePlayer, [-speed*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);
    }
    if(keys['S']){ 
        rotateOnHorizontal.apply(rolePlayer, [-speed*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);    
    }   
    if(keys['W']){ 
        rotateOnHorizontal.apply(rolePlayer, [speed*ROLE_PLAYER_CONSTANTS.SPEED_MULTIPLIER_ROTATION]);    
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
    scene.add(new THREE.AmbientLight( 0xffff, .5))
}

animate();
