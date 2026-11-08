import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#161d24');
scene.fog = new THREE.FogExp2('#161d24', .035);
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, .1, 100);
camera.position.set(0, 7.3, 12.8);
camera.lookAt(0, .6, 0);
const clock = new THREE.Clock();
const mat = (color, roughness=.8, metalness=0, extra={})=>new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra});
const mats={floor:mat('#30383a'), concrete:mat('#343c40'), dark:mat('#20272b'), metal:mat('#465157',.48,.65), red:mat('#f35c4a',.36,.1,{emissive:'#5c1714',emissiveIntensity:.7}), cyan:mat('#54d6ce',.35,.1,{emissive:'#164b4a',emissiveIntensity:.65}), amber:mat('#f3b35f',.42,.15,{emissive:'#5a3215',emissiveIntensity:.4}), white:mat('#bfc6c4'), black:mat('#171b1e'), skin:mat('#bd8669'), enemySkin:mat('#a96f5c'), playerJacket:mat('#387b78'), enemyJacket:mat('#873d42'), denim:mat('#283940'), pants:mat('#303237'), shoe:mat('#171a1c'), wood:mat('#8b6241'), blood:mat('#bd3837',.5,0,{emissive:'#501716',emissiveIntensity:.3})};
scene.add(new THREE.HemisphereLight('#a9c8d1','#202127',2.05));
const keyLight=new THREE.DirectionalLight('#ffe3bf',3.1);keyLight.position.set(-4,9,5);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-10;keyLight.shadow.camera.right=10;keyLight.shadow.camera.top=10;keyLight.shadow.camera.bottom=-10;scene.add(keyLight);
const redLight=new THREE.PointLight('#f05545',14,10,2);redLight.position.set(-5,3,-2);scene.add(redLight);
const blueLight=new THREE.PointLight('#3babc4',15,11,2);blueLight.position.set(5,3,-3);scene.add(blueLight);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,90),mats.floor);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
// Scuffed concrete fighting square and perimeter markings
const arena=new THREE.Mesh(new THREE.PlaneGeometry(13,10),mat('#3b4141'));arena.rotation.x=-Math.PI/2;arena.position.y=.006;arena.receiveShadow=true;scene.add(arena);
const grid=new THREE.GridHelper(13,26,'#62645e','#4c5251');grid.position.y=.014;grid.material.transparent=true;grid.material.opacity=.2;scene.add(grid);
function box(parent, name, size, position, material, rotation){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.name=name;m.position.set(...position);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
// Urban alley perimeter, lit windows and graffiti-like neon details
for(let i=0;i<8;i++){
 const side=i<4?-1:1, j=i%4, x=side*(8.1+j*.35), z=-5.5+j*3.1;
 const h=5.8+(j%2)*2.1;box(scene,'alley building',[2.4,h,2.7],[x,h/2-0.1,z],mat(j%2?'#252d33':'#20282e'));
 for(let w=0;w<3;w++){const win=box(scene,'window',[.04,.55,.72],[x-side*1.22,1.3+w*1.2,z-.45],mat(w%2?'#d18b4e':'#437580',.4,0,{emissive:w%2?'#713d1e':'#153b47',emissiveIntensity:.45}));}
}
for(let x of [-6.4,6.4]){
 box(scene,'arena wall',[.25,1.25,10],[x,.58,0],mats.dark);
 for(let z=-4;z<=4;z+=2)box(scene,'wall reflector',[.04,.08,.08],[x*1.005,1.04,z],x<0?mats.red:mats.cyan);
}
// Set dressing: dumpsters, stacked crates, bollards, puddles
for(const [x,z] of [[-5,-2],[5,2]]){
 box(scene,'dumpster',[1.25,.78,.9],[x,.4,z],mat('#26383a'));box(scene,'dumpster lid',[1.32,.1,.95],[x,.82,z],mat('#384548'),[.03,0,0]);
 for(let dx of [-.42,.42]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.1,12),mats.black);wheel.rotation.z=Math.PI/2;wheel.position.set(x+dx,.16,z+.35);scene.add(wheel);}
}
for(const [x,z] of [[-4,2.5],[4,-2.5],[-5,4],[5,-4]]){
 box(scene,'crate',[.72,.72,.72],[x,.37,z],mats.wood);box(scene,'crate slat',[.77,.09,.75],[x,.32,z],mat('#62462f'));
}
const puddleMat=new THREE.MeshStandardMaterial({color:'#394d50',roughness:.2,metalness:.45,transparent:true,opacity:.65});
for(const [x,z,s] of [[-3.5,-2,.7],[3.3,2.5,.9],[-1,3,.6],[2,-3,.75]]){const p=new THREE.Mesh(new THREE.CircleGeometry(s,32),puddleMat);p.rotation.x=-Math.PI/2;p.position.set(x,.023,z);p.scale.y=.48;scene.add(p);}
// Wall lights and a glowing arena sign
function neonSign(text,color,x,z){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,512,128);ctx.font='900 72px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=color;ctx.shadowBlur=22;ctx.fillStyle=color;ctx.fillText(text,256,66);const texture=new THREE.CanvasTexture(c);const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));sign.position.set(x,4.35,z);sign.rotation.y=x<0?.3:-.3;scene.add(sign);}
neonSign('NO RULES','#f35c4a',-5.8,-4.95);neonSign('NIGHT SHIFT','#53c8cf',5.8,-4.9);
for(const x of [-5.8,5.8]){const lamp=new THREE.PointLight(x<0?'#f15b49':'#45c8d1',18,8,2);lamp.position.set(x,4.1,-3.9);scene.add(lamp);}
const ring=new THREE.Mesh(new THREE.RingGeometry(3.55,3.62,64),new THREE.MeshBasicMaterial({color:'#b74b40',transparent:true,opacity:.48}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;scene.add(ring);
// Fighters are built from low-poly parts so they remain crisp on phones.
const weaponMeshes={};
function makeWeapon(type){
 const g=new THREE.Group();
 if(type==='knife'){
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.28,8),mat('#272b2c'));grip.position.y=-.04;g.add(grip);
  const guard=new THREE.Mesh(new THREE.BoxGeometry(.2,.045,.08),mats.metal);guard.position.y=.12;g.add(guard);
  const blade=new THREE.Mesh(new THREE.ConeGeometry(.075,.38,4),mat('#c7d0cf',.22,.8,{metalness:.8}));blade.rotation.z=Math.PI;blade.position.y=.34;g.add(blade);
 }else if(type==='bat'){
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,.82,10),mats.wood);shaft.position.y=.05;g.add(shaft);
  const knob=new THREE.Mesh(new THREE.CylinderGeometry(.08,.075,.1,10),mat('#332b26'));knob.position.y=-.4;g.add(knob);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.22,10),mat('#262729'));grip.position.y=-.25;g.add(grip);
 }else{
  const plank=new THREE.Mesh(new THREE.BoxGeometry(.21,.88,.105),mat('#8d6849'));plank.position.y=.02;g.add(plank);
  for(const y of [-.26,.27]){const nail=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.02,6),mats.metal);nail.rotation.x=Math.PI/2;nail.position.set(.03,y,.056);g.add(nail);}
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;
}
for(const type of ['knife','bat','board'])weaponMeshes[type]=makeWeapon(type);
function limb(parent, material, length, radius, y){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.82,radius,length,9),material);mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);const joint=new THREE.Mesh(new THREE.SphereGeometry(radius,9,7),material);joint.position.y=y-length/2;parent.add(joint);return mesh;}
function makeFighter(isPlayer){
 const root=new THREE.Group();scene.add(root);
 const cloth=isPlayer?mats.playerJacket:mats.enemyJacket, skin=isPlayer?mats.skin:mats.enemySkin;
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.48,4,8),cloth);torso.position.y=1.08;torso.castShadow=true;root.add(torso);
 const chest=new THREE.Mesh(new THREE.BoxGeometry(.62,.12,.43),isPlayer?mat('#2a5b5c'):mat('#6a3037'));chest.position.set(0,1.15,.025);chest.castShadow=true;root.add(chest);
 const belt=new THREE.Mesh(new THREE.CylinderGeometry(.25,.28,.13,10),mats.dark);belt.position.y=.73;root.add(belt);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.235,12,10),skin);head.position.y=1.68;head.castShadow=true;root.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.24,10,7,0,Math.PI*2,0,Math.PI*.52),isPlayer?mat('#242326'):mat('#221e20'));hair.position.y=1.75;root.add(hair);
 const face=new THREE.Mesh(new THREE.BoxGeometry(.2,.065,.028),mat('#262629'));face.position.set(0,1.63,-.212);root.add(face);
 // jacket collar and shoulder pads
 for(const side of [-1,1]){const pad=new THREE.Mesh(new THREE.SphereGeometry(.19,9,7),isPlayer?mat('#326967'):mat('#77393e'));pad.scale.set(1,.75,1);pad.position.set(side*.37,1.36,0);root.add(pad);}
 const arms=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.39,1.32,0);root.add(arm);
  limb(arm,cloth,.38,.115,-.21);
  const fore=new THREE.Group();fore.position.set(0,-.39,0);arm.add(fore);limb(fore,cloth,.36,.09,-.18);
  const glove=new THREE.Mesh(new THREE.SphereGeometry(.105,9,7),mat(isPlayer?'#1f2729':'#252326'));glove.position.set(0,-.4,-.01);fore.add(glove);
  if(side===1){const hand=new THREE.Group();hand.position.set(0,-.43,-.035);fore.add(hand);for(const type of Object.keys(weaponMeshes)){const item=weaponMeshes[type].clone(true);item.visible=false;hand.add(item);}arm.userData.hand=hand;}
  arms.push(arm);
 }
 const legs=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.17,.7,0);root.add(leg);
  limb(leg,isPlayer?mats.denim:mats.pants,.45,.135,-.23);
  const shin=new THREE.Group();shin.position.set(0,-.45,0);leg.add(shin);limb(shin,isPlayer?mats.denim:mats.pants,.35,.105,-.18);
  const shoe=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.34),mats.shoe);shoe.position.set(0,-.4,-.065);shoe.castShadow=true;shin.add(shoe);
  legs.push(leg);
 }
 // Face forward means local negative Z. Add a subtle scarf stripe on the rival.
 if(!isPlayer){const band=new THREE.Mesh(new THREE.BoxGeometry(.42,.07,.05),mats.red);band.position.set(0,1.87,0);root.add(band);}
 return {root,arms,legs,health:100,maxHealth:100,attackTimer:0,attackAnim:0,hitFlash:0,stun:0,dodge:0,walk:0,weapon:'knife',isPlayer,dead:false};
}
const player=makeFighter(true), enemy=makeFighter(false);
player.root.position.set(-2.2,0,1.0);enemy.root.position.set(2.2,0,-.7);
function equip(f,type){f.weapon=type;const hand=f.arms[1].userData.hand;hand.children.forEach((c,i)=>c.visible=Object.keys(weaponMeshes)[i]===type);}
equip(player,'knife');equip(enemy,'bat');

let running=false, round=1, elapsed=0, hits=0, soundOn=true, toastTimer=0, enemyThink=0, joystick={x:0,y:0}, keys={}, particles=[];
const gameEl=document.querySelector('#game'),statusEl=document.querySelector('#statusMessage');
const playerHealthEl=document.querySelector('#playerHealth'),enemyHealthEl=document.querySelector('#enemyHealth');
const toastEl=document.querySelector('#toast');
let audioContext=null;
function tone(freq=180,duration=.06,type='sine',volume=.04){if(!soundOn)return;try{audioContext??=new AudioContext();if(audioContext.state==='suspended')audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(volume,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch{}}
function setStatus(text){statusEl.textContent=text;}
function showToast(text){toastEl.textContent=text;toastEl.classList.add('show');toastTimer=1.1;}
function updateHealth(){playerHealthEl.style.width=`${Math.max(0,player.health)}%`;enemyHealthEl.style.width=`${Math.max(0,enemy.health)}%`;document.querySelector('#playerHealthText').textContent=Math.ceil(player.health);document.querySelector('#enemyHealthText').textContent=Math.ceil(enemy.health);}
function startRound(){
 document.querySelector('#introOverlay').classList.add('hidden');document.querySelector('#endOverlay').classList.add('hidden');
 player.health=player.maxHealth=100;enemy.maxHealth=100+Math.min((round-1)*8,32);enemy.health=enemy.maxHealth;
 player.dead=enemy.dead=false;player.root.visible=enemy.root.visible=true;player.root.position.set(-2.2,0,1);enemy.root.position.set(2.2,0,-.7);
 player.dodge=enemy.dodge=0;enemyThink=.7;elapsed=0;hits=0;running=true;updateHealth();document.querySelector('#roundLabel').textContent=`РАУНД ${String(round).padStart(2,'0')}`;setStatus('БОЙ НАЧАЛСЯ — ДЕРЖИ ДИСТАНЦИЮ');tone(330,.12,'triangle',.05);
}
function endRound(won){running=false;round+=won?1:0;document.querySelector('#endTitle').textContent=won?'ПОБЕДА.':'ТЫ ВЫБЫЛ.';document.querySelector('#endTitle').style.color=won?'#f35c4a':'#d6d3cd';document.querySelector('#endCopy').textContent=won?'Арена твоя. Готов к следующему?':'Передохни и попробуй другую тактику.';document.querySelector('#hitCount').textContent=hits;const sec=Math.floor(elapsed);document.querySelector('#fightTime').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;document.querySelector('#endOverlay').classList.remove('hidden');}
function chooseWeapon(type){equip(player,type);document.querySelectorAll('.weapon').forEach(b=>b.classList.toggle('active',b.dataset.weapon===type));const labels={knife:'НОЖ: быстрая серия',bat:'БИТА: тяжёлый удар',board:'ДОСКА: оглушение'};showToast(labels[type]);tone(240,.04,'triangle',.025);}
document.querySelectorAll('.weapon').forEach(b=>b.addEventListener('click',()=>chooseWeapon(b.dataset.weapon)));
document.querySelector('#startBtn').addEventListener('click',startRound);
document.querySelector('#restartBtn').addEventListener('click',startRound);
document.querySelector('#soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.innerHTML=soundOn?'♫ <span>ЗВУК</span>':'♪ <span>ВЫКЛ</span>';if(soundOn)tone(440,.05);});
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space'||e.code==='KeyJ')attack(player,enemy);if(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyK')dodge(player);if(e.code==='Digit1')chooseWeapon('knife');if(e.code==='Digit2')chooseWeapon('bat');if(e.code==='Digit3')chooseWeapon('board');});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
document.querySelector('#attackBtn').addEventListener('pointerdown',e=>{e.preventDefault();attack(player,enemy)});
document.querySelector('#dodgeBtn').addEventListener('pointerdown',e=>{e.preventDefault();dodge(player)});
const stickZone=document.querySelector('#stickZone'),stickKnob=document.querySelector('#stickKnob');let stickPointer=null;
stickZone.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;stickZone.setPointerCapture(stickPointer);moveStick(e)});
stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)moveStick(e)});
function moveStick(e){const rect=stickZone.querySelector('.stick-base').getBoundingClientRect(),dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),length=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,34/length);joystick.x=dx/34*scale;joystick.y=dy/34*scale;stickKnob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
function releaseStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;joystick={x:0,y:0};stickKnob.style.transform='translate(0,0)';}
stickZone.addEventListener('pointerup',releaseStick);stickZone.addEventListener('pointercancel',releaseStick);
function dodge(f){if(!running||f.dodge>0)return;f.dodge=.43;f.root.position.x-=Math.sin(f.root.rotation.y)*.65;f.root.position.z-=Math.cos(f.root.rotation.y)*.65;tone(130,.09,'sawtooth',.025);}
function addParticles(position,count,color,force=1){for(let i=0;i<count;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.025+Math.random()*.025,6,5),color);mesh.position.copy(position);mesh.castShadow=false;scene.add(mesh);particles.push({mesh,life:.36+Math.random()*.35,vel:new THREE.Vector3((Math.random()-.5)*force,Math.random()*force*.8,(Math.random()-.5)*force)});}}
function attack(attacker,target){
 if(!running||attacker.dead||attacker.attackTimer>0||attacker.stun>0)return;
 const isPlayer=attacker===player,type=isPlayer?player.weapon:attacker.weapon;
 const config={knife:{cool:.39,damage:12,range:2.05},bat:{cool:.72,damage:23,range:2.25},board:{cool:.82,damage:9,range:2.15}}[type];
 const damage=attacker===player?config.damage:Math.round(config.damage*.58);
 attacker.attackTimer=config.cool;attacker.attackAnim=.48;const distance=attacker.root.position.distanceTo(target.root.position);
 tone(type==='knife'?310:type==='bat'?105:170,.1,type==='bat'?'square':'triangle',.032);
 if(distance>config.range||target.dead)return;
 if(target.dodge>0){if(isPlayer)showToast('ПРОМАХ — ОН УШЁЛ В УКЛОН');return;}
 target.health=Math.max(0,target.health-damage);target.hitFlash=.18;target.root.position.x+=Math.sign(target.root.position.x-attacker.root.position.x)*.22;
 if(type==='board')target.stun=1.35;else target.stun=.16;
 target.root.userData.hitTint=.15;
 const hitPoint=target.root.position.clone().add(new THREE.Vector3(0,1.15,0));
 if(type==='knife')addParticles(hitPoint,5,mats.blood,.55);else if(type==='bat')addParticles(hitPoint,7,mats.blood,1.15);else addParticles(hitPoint,5,mats.amber,.8);
 gameEl.classList.remove('hit-flash');void gameEl.offsetWidth;gameEl.classList.add('hit-flash');setTimeout(()=>gameEl.classList.remove('hit-flash'),210);
 if(isPlayer){hits++;showToast(type==='board'?'ОГЛУШЕНИЕ!':type==='bat'?'СИЛЬНЫЙ УДАР':'ПОПАДАНИЕ');setStatus(type==='knife'?'СЕРИЯ ПОПАДАНИЙ':'ХОРОШИЙ УДАР');}else{showToast(target.dodge>0?'УКЛОН!':'ТЕБЯ ЗАДЕЛИ');setStatus('НЕ ДАЙ СЕБЯ ЗАГНАТЬ В УГОЛ');}
 tone(type==='bat'?78:115,.12,'sawtooth',.055);updateHealth();
 if(target.health<=0){target.dead=true;target.stun=1.5;target.root.rotation.x=-.8;target.root.position.y=.2;if(target===player)endRound(false);else endRound(true);}
}
function clampFighter(f){f.root.position.x=THREE.MathUtils.clamp(f.root.position.x,-5.1,5.1);f.root.position.z=THREE.MathUtils.clamp(f.root.position.z,-3.9,4.1);}
function updateFighter(f,dt){
 f.attackTimer=Math.max(0,f.attackTimer-dt);f.attackAnim=Math.max(0,f.attackAnim-dt);f.hitFlash=Math.max(0,f.hitFlash-dt);f.stun=Math.max(0,f.stun-dt);f.dodge=Math.max(0,f.dodge-dt);
 const toward=new THREE.Vector3((f===player?enemy:player).root.position.x-f.root.position.x,0,(f===player?enemy:player).root.position.z-f.root.position.z);
 const targetAngle=Math.atan2(toward.x,-toward.z);let delta=((targetAngle-f.root.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;f.root.rotation.y+=delta*Math.min(1,dt*11);
 const t=clock.elapsedTime;
 const swinging=f.attackAnim>0?Math.sin((1-f.attackAnim/.48)*Math.PI):0;
 f.arms.forEach((arm,i)=>{const rest=i===1?-.08:-.25;arm.rotation.x=rest-(i===1?swinging*1.75:0);arm.rotation.z=(i===0?-.12:.12);});
 const stride=f.moving?Math.sin(f.walk*8):0;f.legs[0].rotation.x=stride*.48;f.legs[1].rotation.x=-stride*.48;
 f.root.position.y+=((f.moving?.035*Math.abs(Math.sin(t*8)):0)-f.root.position.y)*Math.min(1,dt*12);
}
function update(dt){
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toastEl.classList.remove('show');}
 if(running){elapsed+=dt;player.moving=false;enemy.moving=false;updateFighter(player,dt);updateFighter(enemy,dt);
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystick.x;
  let iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joystick.y;
  const mag=Math.hypot(ix,iz);if(mag>1){ix/=mag;iz/=mag;}
  if(player.dodge>0){ix*=1.35;iz*=1.35;}
  if(player.stun<=0&&mag>.05){player.moving=true;player.walk+=dt;player.root.position.x+=ix*3.1*dt;player.root.position.z+=iz*3.1*dt;clampFighter(player);}
  else if(player.stun>0)setStatus('ОГЛУШЁН — ГОТОВЬСЯ К УКЛОНУ');
  const gap=player.root.position.distanceTo(enemy.root.position);enemyThink-=dt;
  if(enemy.stun<=0&&!enemy.dead){
   if(gap>1.45){enemy.moving=true;const dir=player.root.position.clone().sub(enemy.root.position).normalize();enemy.walk+=dt;enemy.root.position.x+=dir.x*1.72*dt;enemy.root.position.z+=dir.z*1.72*dt;clampFighter(enemy);}
   else if(enemyThink<=0){enemyThink=1.15+Math.random()*.42;if(Math.random()<.22&&enemy.dodge<=0)dodge(enemy);else attack(enemy,player);}
  }
  if(player.dodge>0)player.root.position.add(new THREE.Vector3(-Math.sin(player.root.rotation.y),0,-Math.cos(player.root.rotation.y)).multiplyScalar(1.15*dt));
  if(enemy.dodge>0)enemy.root.position.add(new THREE.Vector3(-Math.sin(enemy.root.rotation.y),0,-Math.cos(enemy.root.rotation.y)).multiplyScalar(1.05*dt));
  clampFighter(player);clampFighter(enemy);
 }else{updateFighter(player,dt);updateFighter(enemy,dt);}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.vel.y-=2.2*dt;p.mesh.position.addScaledVector(p.vel,dt);p.mesh.scale.setScalar(Math.max(.05,p.life));if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();particles.splice(i,1);}}
 const midX=(player.root.position.x+enemy.root.position.x)*.5,midZ=(player.root.position.z+enemy.root.position.z)*.5;
 camera.position.x=THREE.MathUtils.lerp(camera.position.x,midX*.18,dt*1.8);camera.position.z=THREE.MathUtils.lerp(camera.position.z,12.8+midZ*.12,dt*1.8);camera.lookAt(midX*.12,.65,midZ*.1);
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);update(dt);renderer.render(scene,camera);}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));});
