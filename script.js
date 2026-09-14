const canvas=document.getElementById('canvas');
let selected=null,drag=null,history=[],future=[],snap=20,gridOn=true,zoom=1,stream=null,view='2d';
let orbit={x:58,y:-28,zoom:1};

const names={floor:'바닥',wall:'벽',column:'기둥',roof:'지붕',window:'창문',door:'문',stairs:'계단',balcony:'발코니',solar:'태양광',tree:'나무',bench:'벤치',lamp:'조명',plant:'화분',sofa:'소파',table:'테이블',bed:'침대',cabinet:'수납장'};
const icon={tree:'🌳',lamp:'💡',plant:'🪴',sofa:'▰',table:'▱',bed:'▭',cabinet:'▤'};
function snapTo(v){return Math.round(v/snap)*snap}
function setStatus(t){document.getElementById('status').textContent=t;clearTimeout(window._st);window._st=setTimeout(()=>document.getElementById('status').textContent='2cm 스냅 ON',1300)}
function snapshot(){return [...canvas.querySelectorAll('.piece')].map(p=>({type:p.dataset.type,x:p.offsetLeft,y:p.offsetTop,rot:p.dataset.rot||0,text:p.textContent}))}
function restore(state){canvas.innerHTML='';state.forEach(s=>addPiece(s.type,s.x,s.y,false,s.rot,s.text));selected=null;update();render3D()}
function save(){history.push(snapshot());if(history.length>40)history.shift();future=[]}

function addPiece(type,x,y,record=true,rot='0',text=null){
 if(record)save();
 const el=document.createElement('div');el.className='piece '+type;el.dataset.type=type;el.dataset.rot=rot;
 el.textContent=text!==null?text:(icon[type]||'');
 el.style.left=Math.max(0,snapTo(x))+'px';el.style.top=Math.max(0,snapTo(y))+'px';el.style.transform='rotate('+rot+'deg)';
 canvas.appendChild(el);bindPiece(el);select(el);update();render3D();return el;
}
function bindPiece(el){
 el.addEventListener('pointerdown',e=>{e.preventDefault();select(el);drag={el,sx:e.clientX,sy:e.clientY,ox:el.offsetLeft,oy:el.offsetTop};el.setPointerCapture(e.pointerId)});
 el.addEventListener('pointermove',e=>{
  if(!drag||drag.el!==el)return;
  const dx=(e.clientX-drag.sx)/zoom,dy=(e.clientY-drag.sy)/zoom;
  const x=Math.max(0,Math.min(canvas.clientWidth-el.offsetWidth,snapTo(drag.ox+dx)));
  const y=Math.max(0,Math.min(canvas.clientHeight-el.offsetHeight,snapTo(drag.oy+dy)));
  el.style.left=x+'px';el.style.top=y+'px';showInfo(el);
 });
 el.addEventListener('pointerup',()=>{drag=null;setStatus('2cm 단위로 배치됨');update();render3D()});
 el.addEventListener('dblclick',()=>{save();el.remove();selected=null;update();render3D();setStatus('요소 삭제됨')});
 el.addEventListener('click',e=>{e.stopPropagation();select(el)});
}
function select(el){document.querySelectorAll('.piece.selected').forEach(x=>x.classList.remove('selected'));selected=el;if(el)el.classList.add('selected');showInfo(el)}
function showInfo(el){
 const box=document.getElementById('selectedInfo');
 if(!el){box.textContent='요소를 선택하면 위치·크기를 확인할 수 있어요.';return}
 box.innerHTML='<b style="color:#e2e8f0">'+names[el.dataset.type]+'</b><br><span style="color:#94a3b8">위치 '+(el.offsetLeft/snap*2)+'cm × '+(el.offsetTop/snap*2)+'cm<br>크기 '+Math.round(el.offsetWidth/10)+'cm × '+Math.round(el.offsetHeight/10)+'cm<br>회전 '+(+(el.dataset.rot||0))+'°</span>';
}
function update(){
 const all=[...canvas.querySelectorAll('.piece')],c={};all.forEach(p=>c[p.dataset.type]=(c[p.dataset.type]||0)+1);
 document.getElementById('count').textContent=all.length;document.getElementById('columns').textContent=c.column||0;document.getElementById('walls').textContent=c.wall||0;document.getElementById('floors').textContent=c.floor||0;
 const checks=[(c.column||0)>=4,(c.wall||0)>=2,(c.floor||0)>=1,(c.column||0)>=1&&(c.wall||0)>=1],n=checks.filter(Boolean).length;
 ['m1','m2','m3','m4'].forEach((id,i)=>{const base=['기둥 4개 이상','벽 2개 이상','바닥 1개 이상','구조 요소 함께 사용'][i];document.getElementById(id).className=checks[i]?'ok':'';document.getElementById(id).textContent=(checks[i]?'✓ ':'○ ')+base});
 document.getElementById('score').textContent=n+' / 4 조건';
}
function addFromTool(type){const x=snapTo((canvas.clientWidth/2-50)+Math.random()*80-40),y=snapTo((canvas.clientHeight/2-40)+Math.random()*80-40);addPiece(type,x,y);setStatus(names[type]+' 추가됨')}
document.querySelectorAll('.tool').forEach(t=>{
 t.addEventListener('click',()=>{if(view==='3d')setView('2d');addFromTool(t.dataset.type)});
 t.addEventListener('dragstart',e=>e.dataTransfer.setData('type',t.dataset.type));
});
canvas.addEventListener('dragover',e=>e.preventDefault());
canvas.addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('type');if(type){const r=canvas.getBoundingClientRect();save();addPiece(type,snapTo(e.clientX-r.left-30),snapTo(e.clientY-r.top-30),false)}});
canvas.addEventListener('click',()=>select(null));
document.getElementById('rotate').onclick=()=>{if(selected){save();const r=(+(selected.dataset.rot||0)+90)%360;selected.dataset.rot=r;selected.style.transform='rotate('+r+'deg)';showInfo(selected);render3D();setStatus('90° 회전')}};
document.getElementById('delete').onclick=()=>{if(selected){save();selected.remove();selected=null;update();render3D();setStatus('요소 삭제됨')}};
document.addEventListener('keydown',e=>{if(e.key==='Delete')document.getElementById('delete').click();if(e.key.toLowerCase()==='r')document.getElementById('rotate').click()});
document.getElementById('undoBtn').onclick=()=>{if(!history.length)return;future.push(snapshot());restore(history.pop());setStatus('실행 취소')};
document.getElementById('redoBtn').onclick=()=>{if(!future.length)return;history.push(snapshot());restore(future.pop());setStatus('다시 실행')};
document.getElementById('newBtn').onclick=()=>{if(confirm('현재 설계를 모두 지울까요?')){save();canvas.innerHTML='';selected=null;update();render3D();setStatus('새 설계 시작')}};
document.getElementById('gridBtn').onclick=()=>{gridOn=!gridOn;canvas.style.backgroundImage=gridOn?'linear-gradient(#cbd5e1 1px,transparent 1px),linear-gradient(90deg,#cbd5e1 1px,transparent 1px)':'none';document.getElementById('gridBtn').textContent=gridOn?'▦ 2cm 모눈':'▦ 모눈 OFF';document.getElementById('snapPill').textContent=gridOn?'SNAP 2cm':'SNAP OFF';setStatus(gridOn?'2cm 스냅 ON':'모눈 OFF')};
document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.trim();document.querySelectorAll('.tool').forEach(t=>t.style.display=!q||t.textContent.includes(q)?'block':'none')});
canvas.addEventListener('wheel',e=>{if(!e.ctrlKey){e.preventDefault();zoom=Math.max(.7,Math.min(1.4,zoom+(e.deltaY<0?.08:-.08)));canvas.style.transform='scale('+zoom+')';canvas.parentElement.classList.add('zoomed');setStatus('확대 '+Math.round(zoom*100)+'%')}},{passive:false});
document.getElementById('check').onclick=()=>{
 const c={};canvas.querySelectorAll('.piece').forEach(p=>c[p.dataset.type]=(c[p.dataset.type]||0)+1);
 const ok=[(c.column||0)>=4,(c.wall||0)>=2,(c.floor||0)>=1,(c.column||0)>=1&&(c.wall||0)>=1],n=ok.filter(Boolean).length,r=document.getElementById('result');
 r.textContent=n===4?'✓ SUCCESS · 내진 미션 통과':'✕ FAIL · '+n+'/4 조건 충족';r.style.color=n===4?'#10b981':'#ef4444';setStatus(n===4?'미션 성공!':'조건을 더 충족해 보세요');
};

function setView(next){
 view=next;
 const is3=next==='3d';
 document.getElementById('canvas').style.display=is3?'none':'block';
 document.getElementById('scene3d').classList.toggle('show',is3);
 document.getElementById('view2d').classList.toggle('active',!is3);
 document.getElementById('view3d').classList.toggle('active',is3);
 document.getElementById('legend').textContent=is3?'🖱️ 3D 화면 드래그로 시점 회전　·　휠로 확대/축소　·　2D에서 요소 배치':'🖱️ 드래그 이동　·　↻ 회전　·　DEL 삭제　·　📐 2cm 스냅　·　마우스 휠로 확대/축소';
 if(is3)render3D();
 setStatus(is3?'3D 설계 보기':'2D 평면도 보기');
}
document.getElementById('view2d').onclick=()=>setView('2d');
document.getElementById('view3d').onclick=()=>setView('3d');

const scene=document.getElementById('scene3d'),world=document.getElementById('sceneWorld');
function make3D(cls,x,y,w,h,rot,label){
 const d=document.createElement('div');d.className='obj3 '+cls;d.dataset.label=label;
 d.style.left=(x/900*760)+'px';d.style.top=(y/620*520)+'px';d.style.width=Math.max(18,w/900*760)+'px';d.style.height=Math.max(12,h/620*520)+'px';
 d.style.setProperty('--rot',rot+'deg');return d;
}
function render3D(){
 if(!world)return;
 world.innerHTML='';
 const floor=document.createElement('div');floor.className='floor3d';world.appendChild(floor);
 const pieces=[...canvas.querySelectorAll('.piece')];
 pieces.forEach(p=>{
  const t=p.dataset.type,x=p.offsetLeft,y=p.offsetTop,w=p.offsetWidth,h=p.offsetHeight,rot=+(p.dataset.rot||0);
  if(t==='floor'){const d=make3D('floor-piece3',x,y,w,h,rot,names[t]);world.appendChild(d);return}
  const d=make3D(t+'3d',x,y,w,h,rot,names[t]);world.appendChild(d);
 });
}
function orbitScene(dx,dy){orbit.y=Math.max(-65,Math.min(15,orbit.y+dx*.35));orbit.x=Math.max(35,Math.min(85,orbit.x-dy*.25));world.style.transform='translate(-50%,-50%) rotateX('+orbit.x+'deg) rotateZ('+orbit.y+'deg) scale('+orbit.zoom+')'}
let sceneDrag=null;
scene.addEventListener('pointerdown',e=>{if(view!=='3d')return;sceneDrag={x:e.clientX,y:e.clientY};scene.setPointerCapture(e.pointerId)});
scene.addEventListener('pointermove',e=>{if(!sceneDrag)return;orbitScene(e.clientX-sceneDrag.x,e.clientY-sceneDrag.y);sceneDrag={x:e.clientX,y:e.clientY}});
scene.addEventListener('pointerup',()=>sceneDrag=null);
scene.addEventListener('wheel',e=>{if(view!=='3d')return;e.preventDefault();orbit.zoom=Math.max(.65,Math.min(1.45,orbit.zoom+(e.deltaY<0?.06:-.06)));orbitScene(0,0);setStatus('3D 확대 '+Math.round(orbit.zoom*100)+'%')},{passive:false});

function renderArDesign(){const box=document.getElementById('arPreview');box.innerHTML='<div class="ar-cube"></div><div class="ar-cube"></div><div class="ar-cube"></div><div class="ar-roof"></div>'}
async function openAR(){
 document.getElementById('arModal').classList.add('open');document.getElementById('arModal').setAttribute('aria-hidden','false');renderArDesign();
 const msg=document.getElementById('arMessage');
 if(!navigator.mediaDevices?.getUserMedia){msg.textContent='이 기기에서는 카메라를 사용할 수 없습니다. AR 미리보기는 계속 사용할 수 있어요.';return}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});document.getElementById('camera').srcObject=stream;msg.textContent='카메라 위에 설계 모형을 겹쳐 확인하세요.'}
 catch(e){msg.textContent='카메라 권한이 거부되어 AR 미리보기로 실행합니다.'}
}
function closeAR(){document.getElementById('arModal').classList.remove('open');document.getElementById('arModal').setAttribute('aria-hidden','true');if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;document.getElementById('camera').srcObject=null}
document.getElementById('arMode').onclick=openAR;document.getElementById('arMode2').onclick=openAR;document.getElementById('closeAr').onclick=closeAR;
document.getElementById('placeAr').onclick=()=>{document.getElementById('arPreview').style.transform='translate(-50%,-35%) perspective(600px) rotateX(8deg) rotateY(-18deg) scale(1.15)';document.getElementById('arMessage').textContent='✓ 설계를 배치했습니다. 위치를 확인해 보세요.'};
document.getElementById('openUrl').onclick=()=>{const u=document.getElementById('appUrl').value.trim();if(/^https:\/\//.test(u))window.open(u,'_blank');else alert('https://로 시작하는 AR 앱 주소를 입력하세요.')};

[['floor',240,220],['column',260,240],['column',340,240],['column',260,340],['column',340,340],['wall',260,220],['wall',260,400],['solar',440,240],['tree',560,340],['sofa',430,350],['table',500,360]].forEach(s=>addPiece(s[0],s[1],s[2],false));
history=[];update();render3D();