const canvas = document.getElementById("canvas");
let selected = null, drag = null, history = [], future = [];
let snap = 2, gridOn = true, zoom = 1, view = "2d";
let camera = { x: 58, z: -28, scale: 1 };

const names = {
  floor:"바닥", wall:"벽", column:"기둥", roof:"지붕", window:"창문",
  door:"문", stairs:"계단", balcony:"발코니", solar:"태양광",
  tree:"나무", bench:"벤치", lamp:"조명", plant:"화분",
  sofa:"소파", table:"테이블", bed:"침대", cabinet:"수납장"
};
const icon = {tree:"🌳",lamp:"💡",plant:"🪴",sofa:"▰",table:"▱",bed:"▭",cabinet:"▤"};

function snapTo(v){ return Math.round(v / snap) * snap; }
function setStatus(t){
  const s=document.getElementById("status");
  s.textContent=t;
  clearTimeout(window.statusTimer);
  window.statusTimer=setTimeout(()=>s.textContent=gridOn?"2cm 스냅 ON":"모눈 OFF",1300);
}
function snapshot(){
  return [...canvas.querySelectorAll(".piece")].map(p=>({
    type:p.dataset.type, x:p.offsetLeft, y:p.offsetTop,
    rot:+(p.dataset.rot||0), w:p.offsetWidth, h:p.offsetHeight
  }));
}
function restore(state){
  canvas.innerHTML="";
  state.forEach(s=>addPiece(s.type,s.x,s.y,false,s.rot));
  selected=null; 
document.getElementById("openUrl")?.addEventListener("click",()=>{
  const url=document.getElementById("appUrl")?.value.trim();
  if(url) window.open(url,"_blank","noopener,noreferrer");
  else setStatus("AR 앱 주소를 입력하세요");
});

update(); render3D();
}
function save(){ history.push(snapshot()); if(history.length>50)history.shift(); future=[]; }

function addPiece(type,x,y,record=true,rot=0){
  if(record) save();
  const el=document.createElement("div");
  el.className="piece "+type;
  el.dataset.type=type;
  el.dataset.rot=rot;
  el.style.left=Math.max(0,snapTo(x))+"px";
  el.style.top=Math.max(0,snapTo(y))+"px";
  el.style.transform=`rotate(${rot}deg)`;
  if(icon[type]) el.textContent=icon[type];
  canvas.appendChild(el);
  bindPiece(el);
  select(el);
  update();
  render3D();
  return el;
}
function bindPiece(el){
  el.addEventListener("pointerdown",e=>{
    if(view!=="2d") return;
    e.preventDefault(); e.stopPropagation(); select(el);
    drag={el,sx:e.clientX,sy:e.clientY,ox:el.offsetLeft,oy:el.offsetTop};
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove",e=>{
    if(!drag||drag.el!==el)return;
    const dx=(e.clientX-drag.sx)/zoom, dy=(e.clientY-drag.sy)/zoom;
    const x=Math.max(0,Math.min(canvas.clientWidth-el.offsetWidth,snapTo(drag.ox+dx)));
    const y=Math.max(0,Math.min(canvas.clientHeight-el.offsetHeight,snapTo(drag.oy+dy)));
    el.style.left=x+"px"; el.style.top=y+"px"; showInfo(el);
  });
  el.addEventListener("pointerup",()=>{
    if(!drag)return;
    drag=null; setStatus("2cm 단위로 배치됨"); update(); render3D();
  });
  el.addEventListener("click",e=>{e.stopPropagation();select(el);});
  el.addEventListener("dblclick",()=>deleteSelected(el));
}
function select(el){
  document.querySelectorAll(".piece.selected").forEach(x=>x.classList.remove("selected"));
  selected=el;
  if(el)el.classList.add("selected");
  showInfo(el);
}
function showInfo(el){
  const box=document.getElementById("selectedInfo");
  if(!el){box.textContent="요소를 선택하면 위치·크기를 확인할 수 있어요.";return;}
  const x=(el.offsetLeft/100).toFixed(2), y=(el.offsetTop/100).toFixed(2);
  const w=(el.offsetWidth/100).toFixed(2), h=(el.offsetHeight/100).toFixed(2);
  box.innerHTML=`<b style="color:#e2e8f0">${names[el.dataset.type]}</b><br>
  <span style="color:#94a3b8">좌표 X ${x}m · Y ${y}m<br>
  크기 ${w}m × ${h}m<br>회전 ${+(el.dataset.rot||0)}°</span>`;
}
function update(){
  const all=[...canvas.querySelectorAll(".piece")], c={};
  all.forEach(p=>c[p.dataset.type]=(c[p.dataset.type]||0)+1);
  document.getElementById("count").textContent=all.length;
  document.getElementById("columns").textContent=c.column||0;
  document.getElementById("walls").textContent=c.wall||0;
  document.getElementById("floors").textContent=c.floor||0;

  const checks=[
    (c.column||0)>=4,(c.wall||0)>=2,(c.floor||0)>=1,
    (c.column||0)>=1&&(c.wall||0)>=1
  ];
  checks.forEach((ok,i)=>{
    const el=document.getElementById("m"+(i+1));
    const labels=["기둥 4개 이상","벽 2개 이상","바닥 1개 이상","구조 요소 함께 사용"];
    el.className=ok?"ok":"";
    el.textContent=(ok?"✓ ":"○ ")+labels[i];
  });
  document.getElementById("score").textContent=checks.filter(Boolean).length+" / 4 조건";
}
function addFromTool(type){
  if(view==="3d")setView("2d");
  const x=snapTo(canvas.clientWidth/2-50+(Math.random()*80-40));
  const y=snapTo(canvas.clientHeight/2-40+(Math.random()*80-40));
  addPiece(type,x,y);
  setStatus(names[type]+" 추가됨");
}
function deleteSelected(el=selected){
  if(!el)return;
  save(); el.remove(); selected=null; update(); render3D(); setStatus("요소 삭제됨");
}

document.querySelectorAll(".tool").forEach(t=>{
  t.addEventListener("click",()=>addFromTool(t.dataset.type));
  t.addEventListener("dragstart",e=>e.dataTransfer.setData("type",t.dataset.type));
});
canvas.addEventListener("dragover",e=>e.preventDefault());
canvas.addEventListener("drop",e=>{
  e.preventDefault();
  const type=e.dataTransfer.getData("type");
  if(!type)return;
  const r=canvas.getBoundingClientRect();
  addPiece(type,snapTo((e.clientX-r.left)/zoom-30),snapTo((e.clientY-r.top)/zoom-30));
});
canvas.addEventListener("click",()=>select(null));

document.getElementById("rotate").onclick=()=>{
  if(!selected)return;
  save();
  const r=(+(selected.dataset.rot||0)+90)%360;
  selected.dataset.rot=r; selected.style.transform=`rotate(${r}deg)`;
  showInfo(selected); render3D(); setStatus("90° 회전");
};
document.getElementById("delete").onclick=()=>deleteSelected();
document.addEventListener("keydown",e=>{
  if(e.key==="Delete")deleteSelected();
  if(e.key.toLowerCase()==="r")document.getElementById("rotate").click();
});
document.getElementById("undoBtn").onclick=()=>{
  if(!history.length)return;
  future.push(snapshot()); restore(history.pop()); setStatus("실행 취소");
};
document.getElementById("redoBtn").onclick=()=>{
  if(!future.length)return;
  history.push(snapshot()); restore(future.pop()); setStatus("다시 실행");
};
document.getElementById("newBtn").onclick=()=>{
  if(confirm("현재 설계를 모두 지울까요?")){
    save(); canvas.innerHTML=""; selected=null; update(); render3D(); setStatus("새 설계 시작");
  }
};
document.getElementById("gridBtn").onclick=()=>{
  gridOn=!gridOn;
  canvas.classList.toggle("grid-off",!gridOn);
  document.getElementById("gridBtn").textContent=gridOn?"▦ 2cm 모눈":"▦ 모눈 OFF";
  document.getElementById("snapPill").textContent=gridOn?"SNAP 2cm":"SNAP OFF";
  setStatus(gridOn?"2cm 스냅 ON":"모눈 OFF");
};
document.getElementById("search").addEventListener("input",e=>{
  const q=e.target.value.trim();
  document.querySelectorAll(".tool").forEach(t=>t.style.display=!q||t.textContent.includes(q)?"":"none");
});
canvas.addEventListener("wheel",e=>{
  if(!e.ctrlKey){e.preventDefault();zoom=Math.max(.7,Math.min(1.5,zoom+(e.deltaY<0?.08:-.08)));canvas.style.transform=`scale(${zoom})`;setStatus("확대 "+Math.round(zoom*100)+"%");}
},{passive:false});

document.getElementById("check").onclick=()=>{
  const c={};canvas.querySelectorAll(".piece").forEach(p=>c[p.dataset.type]=(c[p.dataset.type]||0)+1);
  const ok=[(c.column||0)>=4,(c.wall||0)>=2,(c.floor||0)>=1,(c.column||0)>=1&&(c.wall||0)>=1];
  const n=ok.filter(Boolean).length, r=document.getElementById("result");
  r.textContent=n===4?"✓ SUCCESS · 내진 미션 통과":"✕ FAIL · "+n+"/4 조건 충족";
  r.style.color=n===4?"#10b981":"#ef4444";
  setStatus(n===4?"미션 성공!":"조건을 더 충족해 보세요");
};

function setView(next){
  view=next;
  const is3=next==="3d";
  document.getElementById("canvas").style.display=is3?"none":"block";
  document.getElementById("scene3d").classList.toggle("show",is3);
  document.querySelector(".canvas-wrap").classList.toggle("mode-3d",is3);
  document.getElementById("view2d").classList.toggle("active",!is3);
  document.getElementById("view3d").classList.toggle("active",is3);
  document.getElementById("legend").textContent=is3
    ?"🖱️ 3D 드래그: 시점 회전 · 휠: 확대/축소 · 카메라 버튼 사용"
    :"🖱️ 드래그 이동 · ↻ 회전 · DEL 삭제 · 📐 2cm 스냅 · 휠 확대/축소";
  if(is3)render3D();
  setStatus(is3?"3D Floor Planner 보기":"2D 평면도 보기");
}
document.getElementById("view2d").onclick=()=>setView("2d");
document.getElementById("view3d").onclick=()=>setView("3d");

const scene=document.getElementById("scene3d");
const world=document.getElementById("sceneWorld");
function applyCamera(mode){
  const presets={iso:[58,-28,1],top:[88,0,1.05],walk:[22,-12,1.12]};
  const p=presets[mode]||presets.iso;
  camera={x:p[0],z:p[1],scale:p[2]};
  world.style.transform=`translate(-50%,-50%) rotateX(${camera.x}deg) rotateZ(${camera.z}deg) scale(${camera.scale})`;
  ["camIso","camTop","camWalk"].forEach(id=>document.getElementById(id)?.classList.remove("active"));
  document.getElementById(mode==="iso"?"camIso":mode==="top"?"camTop":"camWalk")?.classList.add("active");
}
function orbitScene(dx,dy){
  camera.z+=dx*.35;
  camera.x=Math.max(28,Math.min(88,camera.x-dy*.25));
  world.style.transform=`translate(-50%,-50%) rotateX(${camera.x}deg) rotateZ(${camera.z}deg) scale(${camera.scale})`;
}
function create3DObject(type,p){
  const x=p.offsetLeft, y=p.offsetTop, w=p.offsetWidth, h=p.offsetHeight, rot=+(p.dataset.rot||0);
  const d=document.createElement("div");
  d.className="obj3 "+type+"3d";
  d.style.left=(x/100)+"px"; d.style.top=(y/100)+"px";
  d.style.setProperty("--w",Math.max(12,w/100)+"px");
  d.style.setProperty("--d",Math.max(12,h/100)+"px");
  d.style.setProperty("--rot",rot+"deg");

  if(type==="wall"){
    d.innerHTML=`<div class="face f-front"></div><div class="face f-back"></div>
      <div class="face f-left"></div><div class="face f-right"></div>
      <div class="face f-top"></div><div class="face f-bottom"></div>`;
    d.style.setProperty("--h","300px");
    d.style.setProperty("--depth","14px");
  }else if(type==="column"){
    d.innerHTML=`<div class="face f-front"></div><div class="face f-back"></div>
      <div class="face f-left"></div><div class="face f-right"></div>
      <div class="face f-top"></div><div class="face f-bottom"></div>`;
    d.style.setProperty("--w","22px"); d.style.setProperty("--d","22px"); d.style.setProperty("--h","250px");
  }else if(type==="door"){
    d.innerHTML=`<div class="door-frame"></div><div class="door-panel"></div><span class="door-knob">●</span>`;
    d.style.setProperty("--w",Math.max(32,w/100)+"px"); d.style.setProperty("--h","210px");
  }else if(type==="window"){
    d.innerHTML=`<div class="window-frame"></div><div class="window-glass"></div><i class="window-cross"></i>`;
    d.style.setProperty("--w",Math.max(50,w/100)+"px"); d.style.setProperty("--h","120px");
  }else if(type==="roof"){
    d.innerHTML=`<div class="roof-slab"></div><div class="roof-ridge"></div>`;
    d.style.setProperty("--w",Math.max(80,w/100)+"px"); d.style.setProperty("--d",Math.max(50,h/100)+"px");
  }else{
    d.textContent=icon[type]||"";
  }
  return d;
}
function render3D(){
  if(!world)return;
  world.innerHTML="";
  const floor=document.createElement("div");
  floor.className="floor3d";
  world.appendChild(floor);
  canvas.querySelectorAll(".piece").forEach(p=>world.appendChild(create3DObject(p.dataset.type,p)));
  applyCamera(document.querySelector(".scene-toolbar .active")?.id==="camTop"?"top":document.querySelector(".scene-toolbar .active")?.id==="camWalk"?"walk":"iso");
}
scene.addEventListener("pointerdown",e=>{if(view!=="3d")return;scene.setPointerCapture(e.pointerId);scene._drag={x:e.clientX,y:e.clientY};});
scene.addEventListener("pointermove",e=>{
  if(!scene._drag||view!=="3d")return;
  orbitScene(e.clientX-scene._drag.x,e.clientY-scene._drag.y);
  scene._drag={x:e.clientX,y:e.clientY};
});
scene.addEventListener("pointerup",()=>scene._drag=null);
scene.addEventListener("pointercancel",()=>scene._drag=null);
scene.addEventListener("wheel",e=>{
  if(view!=="3d")return;
  e.preventDefault();
  camera.scale=Math.max(.65,Math.min(1.6,camera.scale+(e.deltaY<0?.06:-.06)));
  world.style.transform=`translate(-50%,-50%) rotateX(${camera.x}deg) rotateZ(${camera.z}deg) scale(${camera.scale})`;
},{passive:false});

document.getElementById("camIso").onclick=()=>applyCamera("iso");
document.getElementById("camTop").onclick=()=>applyCamera("top");
document.getElementById("camWalk").onclick=()=>applyCamera("walk");
document.getElementById("camReset").onclick=()=>applyCamera("iso");

document.getElementById("arMode").onclick=()=>document.getElementById("arMode2").click();
document.getElementById("arMode2").onclick=async()=>{
  const modal=document.getElementById("arModal"), video=document.getElementById("camera");
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false});
    video.srcObject=stream; document.getElementById("arMessage").textContent="카메라가 준비됐습니다. 배치를 눌러 미리보기를 표시하세요.";
  }catch(err){document.getElementById("arMessage").textContent="카메라 권한이 없어 AR 미리보기 화면으로 실행됩니다.";}
};
document.getElementById("closeAr").onclick=()=>{
  const v=document.getElementById("camera");
  if(v.srcObject)v.srcObject.getTracks().forEach(t=>t.stop());
  document.getElementById("arModal").classList.remove("open");
  document.getElementById("arModal").setAttribute("aria-hidden","true");
};
document.getElementById("placeAr").onclick=()=>{
  const preview=document.getElementById("arPreview");
  preview.innerHTML="";
  const count=Math.min(6,canvas.querySelectorAll(".piece").length||1);
  for(let i=0;i<count;i++){const c=document.createElement("div");c.className="ar-cube";c.style.left=(20+(i%3)*52)+"px";c.style.bottom=(8+Math.floor(i/3)*45)+"px";preview.appendChild(c);}
  const roof=document.createElement("div");roof.className="ar-roof";preview.appendChild(roof);
};

update(); render3D();
