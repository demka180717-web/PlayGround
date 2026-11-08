import * as THREE from 'three';

const canvas = document.querySelector('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b6d9e8');
scene.fog = new THREE.Fog('#b6d9e8', 23, 68);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .1, 120);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.13;

scene.add(new THREE.HemisphereLight(0xe4f6ff, 0x657853, 2.0));
const sun = new THREE.DirectionalLight(0xffedc4, 3.25);
sun.position.set(-15, 27, -10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left = -26; sun.shadow.camera.right = 26; sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
sun.shadow.bias = -.0005;
scene.add(sun);

const palette = {
  grass:{label:'Mossy grass',ui:['#8fbd77','#78a966','#a9ce8a','#688d5e'], top:'#8fbd77', side:'#78a966'},
  dirt:{label:'Warm earth',ui:['#a97850','#805738','#bd8b5e','#6e4b39'],top:'#a97850',side:'#805738'},
  stone:{label:'Soft stone',ui:['#a7aaa0','#81867d','#c0c3b9','#6d716c'],top:'#a7aaa0',side:'#81867d'},
  wood:{label:'Honey wood',ui:['#b17b4c','#875b3b','#c89560','#704b34'],top:'#b17b4c',side:'#875b3b'},
  leaves:{label:'Leafy green',ui:['#78a768','#5d8951','#98bf78','#4c7448'],top:'#78a768',side:'#5d8951'},
  sand:{label:'Pale sand',ui:['#e2cb8e','#c5ad70','#f0dfa9','#ab955f'],top:'#e2cb8e',side:'#c5ad70'}
};
const keys = Object.keys(palette);
const blockMaterials = {};
for (const [type,p] of Object.entries(palette)) {
  const mat = (color) => new THREE.MeshStandardMaterial({color, roughness:1});
  blockMaterials[type] = [mat(p.side),mat(p.ui[3]),mat(p.top),mat(p.ui[3]),mat(p.side),mat(p.ui[1])];
}
const cube = new THREE.BoxGeometry(1,1,1);
const blocks = new Map();
const batches = [];
const keyOf = (x,y,z)=>`${x},${y},${z}`;
function addBlock(x,y,z,type,special=false) {
  const k=keyOf(x,y,z); if(blocks.has(k)) return false;
  blocks.set(k,{x,y,z,type,special}); return true;
}
function removeBlock(x,y,z) {
  const k=keyOf(x,y,z), b=blocks.get(k); if(!b) return null;
  blocks.delete(k); return b;
}
function rebuildBatches(){
  for(const batch of batches)scene.remove(batch);
  batches.length=0;
  const byType=Object.fromEntries(keys.map(type=>[type,[]]));
  for(const [key,block] of blocks)byType[block.type].push([key,block]);
  const matrix=new THREE.Matrix4();
  for(const type of keys){
    const entries=byType[type];if(!entries.length)continue;
    const batch=new THREE.InstancedMesh(cube,blockMaterials[type],entries.length);
    batch.userData={type,keys:entries.map(([key])=>key)};
    entries.forEach(([,block],i)=>{matrix.makeTranslation(block.x+.5,block.y+.5,block.z+.5);batch.setMatrixAt(i,matrix);});
    batch.castShadow=true;batch.receiveShadow=true;batch.instanceMatrix.needsUpdate=true;
    scene.add(batch);batches.push(batch);
  }
}
const terrainHeight=(x,z)=>Math.max(1,Math.min(4,Math.floor(2.6+Math.sin(x*.27)*.62+Math.cos(z*.24)*.5+Math.sin((x+z)*.17)*.45)));
// Gentle rolling island, layered in earthy voxel strata.
for(let x=-22;x<=22;x++) for(let z=-22;z<=22;z++) {
  const edge=Math.max(Math.abs(x),Math.abs(z));
  if(edge>20 && ((x*17+z*13)%5!==0)) continue;
  const h=terrainHeight(x,z);
  for(let y=0;y<=h;y++) {
    const type=y===h?'grass':y>=h-2?'dirt':'stone';
    addBlock(x,y,z,type);
  }
}
// Soft sandy shoreline and a quiet, shallow pool.
for(let x=-22;x<=22;x++) for(let z=-22;z<=22;z++) {
  if(Math.abs(x)>19||Math.abs(z)>19) {
    const h=terrainHeight(x,z);
    const k=keyOf(x,h,z), b=blocks.get(k);
    if(b) b.type='sand';
  }
}
const water=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x84c8d1,roughness:.27,metalness:.05,transparent:true,opacity:.72}));
water.rotation.x=-Math.PI/2; water.position.y=1.38; water.position.z=-.5; scene.add(water);
// A few cubic trees make a welcoming little grove.
function tree(x,z,size=1) {
  const ground=terrainHeight(x,z);
  const trunkH=3+Math.floor(size*1.5);
  for(let y=ground+1;y<=ground+trunkH;y++) addBlock(x,y,z,'wood',true);
  const top=ground+trunkH;
  for(let dy=-1;dy<=2;dy++) {
    const radius=dy===2?1:dy===-1?1:2;
    for(let dx=-radius;dx<=radius;dx++) for(let dz=-radius;dz<=radius;dz++) {
      if(Math.abs(dx)+Math.abs(dz)>radius*2-1) continue;
      if(dx===0&&dz===0&&dy<1) continue;
      if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy)*.8>4.1) continue;
      addBlock(x+dx,top+dy,z+dz,'leaves',true);
    }
  }
}
[[7,4,1],[10,7,.8],[-8,6,.9],[-11,10,1],[5,-10,.9],[-7,-11,.8],[13,-4,.8],[-14,-3,1],[2,13,.75]].forEach(v=>tree(...v));
rebuildBatches();
// Simple flower tufts: tiny jewel-colored cubes on the meadow.
const flowers=[];
for(let i=0;i<38;i++) {
  const x=Math.floor(Math.sin(i*12.98)*13),z=Math.floor(Math.cos(i*7.31)*13);
  if(Math.abs(x)<3&&Math.abs(z)<3) continue;
  const y=terrainHeight(x,z)+1;
  const color=['#f6d989','#f2a9a0','#d3c7f1','#f5eee0'][i%4];
  const f=new THREE.Mesh(new THREE.BoxGeometry(.13,.16,.13),new THREE.MeshStandardMaterial({color,roughness:.8}));
  f.position.set(x+.5,y+.64,z+.5); f.castShadow=true; scene.add(f); flowers.push(f);
}
// Distant blocky clouds add scale and softness to the horizon.
const cloudMat=new THREE.MeshStandardMaterial({color:'#f5fbf4',roughness:1});
for(const [x,y,z,s] of [[-17,14,-20,1.3],[6,17,-24,1.7],[21,13,-12,1.1],[-25,16,2,1.5],[19,16,19,1.2]]) {
  for(let i=0;i<4;i++){const c=new THREE.Mesh(cube,cloudMat);c.scale.set(2.7*s, .55*s, .9*s);c.position.set(x+(i-1.5)*1.6*s,y+(i%2)*.28,z);scene.add(c);}
}

const inventory=Object.fromEntries(keys.map(k=>[k,18]));
let selected='grass';
const hotbar=document.querySelector('#hotbar');
const selectedName=document.querySelector('#selectedName');
const selectedSwatch=document.querySelector('.selected-swatch');
function buildHotbar(){
  hotbar.innerHTML='';
  keys.forEach((type,index)=>{
    const slot=document.createElement('button'); slot.className='slot'+(type===selected?' selected':'');slot.setAttribute('aria-label',`${index+1}: ${palette[type].label}, ${inventory[type]} blocks`);
    const [top,left,right]=palette[type].ui;
    slot.innerHTML=`<span class="slot-num">${index+1}</span><span class="block-icon" style="--block:${palette[type].side};--top:${top};--left:${left};--right:${right}"><span></span></span><span class="count">${inventory[type]}</span>`;
    slot.addEventListener('click',()=>selectBlock(type));hotbar.append(slot);
  });
  selectedName.textContent=palette[selected].label;selectedSwatch.style.background=palette[selected].top;
}
function selectBlock(type){selected=type;buildHotbar();}
buildHotbar();

const player={x:.5,z:.5,y:0,vy:0,yaw:Math.PI*.15,pitch:-.12,onGround:false};
const playerHeight=1.62, moveSpeed=5.1;
function groundAt(x,z){return terrainHeight(Math.floor(x),Math.floor(z))+1;}
player.y=groundAt(player.x,player.z)+playerHeight;
const keysDown=new Set();
let locked=false,started=false,toastTimer;
const welcome=document.querySelector('#welcome'),pause=document.querySelector('#pauseScreen');
function notify(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1700);}
function requestLock(){if(!isTouch)canvas.requestPointerLock?.();}
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
function begin(){started=true;welcome.classList.add('hidden');if(!isTouch)requestLock();else notify('Use the arrows to wander');}
document.querySelector('#startButton').addEventListener('click',begin);
document.querySelector('#resumeButton').addEventListener('click',()=>{pause.classList.remove('visible');if(!isTouch)requestLock();});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(locked){pause.classList.remove('visible');}else if(started&&!isTouch&&!welcome.classList.contains('hidden')){}else if(started&&!isTouch){pause.classList.add('visible');}});
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  keysDown.add(e.code);
  if(e.code.startsWith('Digit')){const i=Number(e.code.slice(5))-1;if(keys[i])selectBlock(keys[i]);}
  if(e.code==='Space'&&player.onGround){player.vy=7.1;player.onGround=false;}
  if(e.code==='Escape'&&isTouch&&started)pause.classList.toggle('visible');
});
window.addEventListener('keyup',e=>keysDown.delete(e.code));
window.addEventListener('blur',()=>keysDown.clear());
document.addEventListener('mousemove',e=>{if(locked){player.yaw-=e.movementX*.0022;player.pitch=Math.max(-1.35,Math.min(1.25,player.pitch-e.movementY*.0022));}});

const raycaster=new THREE.Raycaster();raycaster.far=6;
let target=null;
function aim(){
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(batches,false);
  target=hits.length?hits[0]:null;
  const label=document.querySelector('#targetName');
  if(target){const type=target.object.userData.type;label.textContent=palette[type]?.label||'';label.classList.add('visible');}else label.classList.remove('visible');
}
function dig(){
  aim();if(!target)return;
  const data=target.object.userData, block=blocks.get(data.keys[target.instanceId]);if(!block)return;
  if(block.y===0){notify('The ground holds this little world together');return;}
  const removed=removeBlock(block.x,block.y,block.z);if(!removed)return;
  if(!removed.special&&inventory[removed.type]!==undefined)inventory[removed.type]=Math.min(99,inventory[removed.type]+1);
  rebuildBatches();buildHotbar();
}
function place(){
  aim();if(!target){notify('Find a spot for your block');return;}
  if(inventory[selected]<=0){notify('Gather a few blocks first');return;}
  const block=blocks.get(target.object.userData.keys[target.instanceId]);if(!block)return;
  const n=target.face.normal;
  const x=block.x+Math.round(n.x),y=block.y+Math.round(n.y),z=block.z+Math.round(n.z);
  if(Math.hypot((x+.5)-player.x,(z+.5)-player.z)<.8 && y<player.y+.3&&y+1>player.y-playerHeight){notify('A little too close to place');return;}
  if(addBlock(x,y,z,selected)){inventory[selected]--;rebuildBatches();buildHotbar();}
}
canvas.addEventListener('click',()=>{if(started&&!isTouch&&!locked){requestLock();return;}if(started&&locked)dig();});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(started)place();});
window.addEventListener('mousedown',e=>{if(e.button===2&&started)place();});
document.querySelector('#helpButton').addEventListener('click',()=>document.querySelector('#helpCard').classList.toggle('open'));
document.querySelector('#closeHelp').addEventListener('click',()=>document.querySelector('#helpCard').classList.remove('open'));
document.querySelector('#soundButton').addEventListener('click',e=>{e.currentTarget.classList.toggle('muted');notify('A little quiet is nice too');});

// Touch look and simple, press-and-hold movement for phones and tablets.
let touchLook=null;const touchMove=new Set();
canvas.addEventListener('touchstart',e=>{if(!started)return;const t=e.changedTouches[0];touchLook={x:t.clientX,y:t.clientY,id:t.identifier};},{passive:true});
canvas.addEventListener('touchmove',e=>{if(!touchLook)return;for(const t of e.changedTouches){if(t.identifier===touchLook.id){const dx=t.clientX-touchLook.x,dy=t.clientY-touchLook.y;player.yaw-=dx*.006;player.pitch=Math.max(-1.25,Math.min(1.15,player.pitch-dy*.006));touchLook={x:t.clientX,y:t.clientY,id:t.identifier};}}},{passive:true});
canvas.addEventListener('touchend',e=>{for(const t of e.changedTouches)if(t.identifier===touchLook?.id)touchLook=null;},{passive:true});
document.querySelectorAll('[data-move]').forEach(button=>{
  const dir=button.dataset.move;
  button.addEventListener('pointerdown',e=>{e.preventDefault();touchMove.add(dir);button.setPointerCapture(e.pointerId);});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>button.addEventListener(name,()=>touchMove.delete(dir)));
});
document.querySelector('#mobileJump').addEventListener('pointerdown',e=>{e.preventDefault();if(player.onGround){player.vy=7.1;player.onGround=false;}});
document.querySelector('#mobileMine').addEventListener('pointerdown',e=>{e.preventDefault();dig();});
document.querySelector('#mobileBuild').addEventListener('pointerdown',e=>{e.preventDefault();place();});

const clockEl=document.querySelector('#clock');let elapsed=0;
function update(dt){
  elapsed+=dt;
  const hour=9+Math.floor(elapsed/90)%10,minute=Math.floor((elapsed%90)/1.5)%60;
  clockEl.textContent=`DAY 01 · ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  let forward=0,side=0;
  if(keysDown.has('KeyW')||keysDown.has('ArrowUp')||touchMove.has('forward'))forward++;
  if(keysDown.has('KeyS')||keysDown.has('ArrowDown')||touchMove.has('back'))forward--;
  if(keysDown.has('KeyD')||keysDown.has('ArrowRight')||touchMove.has('right'))side++;
  if(keysDown.has('KeyA')||keysDown.has('ArrowLeft')||touchMove.has('left'))side--;
  const mag=Math.hypot(forward,side)||1;forward/=mag;side/=mag;
  const dx=(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*side)*moveSpeed*dt;
  const dz=(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*side)*moveSpeed*dt;
  // Stay on the meadow; solid trunks gently stop the player.
  const nextX=THREE.MathUtils.clamp(player.x+dx,-20.3,20.3),nextZ=THREE.MathUtils.clamp(player.z+dz,-20.3,20.3);
  function blocked(x,z){const bx=Math.floor(x),bz=Math.floor(z),by=groundAt(x,z);for(let y=by;y<by+2;y++){const b=blocks.get(keyOf(bx,y,bz));if(b&&(b.type==='wood'||b.type==='stone'))return true;}return false;}
  if(!blocked(nextX,player.z))player.x=nextX;
  if(!blocked(player.x,nextZ))player.z=nextZ;
  const floor=groundAt(player.x,player.z)+playerHeight;
  player.vy-=19*dt;player.y+=player.vy*dt;
  if(player.y<floor){player.y=floor;player.vy=0;player.onGround=true;}else player.onGround=false;
  camera.position.set(player.x,player.y,player.z);
  camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
  document.querySelector('#coords').innerHTML=`X ${Math.floor(player.x)}&nbsp;&nbsp; Y ${Math.floor(player.y-playerHeight)}&nbsp;&nbsp; Z ${Math.floor(player.z)}`;
  aim();
}
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);}
requestAnimationFrame(frame);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);});
