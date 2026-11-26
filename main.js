(function(){
'use strict';
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var vh=innerHeight;addEventListener('resize',function(){vh=innerHeight});

/* ---------- scroll loop (single rAF): header, dock, progress, parallax ---------- */
var top=$('#top'),dock=$('#dock'),prog=$('#progress'),px=$$('[data-parallax]'),ticking=false;
function frame(){
  var y=window.scrollY,max=document.documentElement.scrollHeight-vh;
  top.classList.toggle('scrolled',y>24);
  dock.classList.toggle('show',y>vh*.6);
  if(prog)prog.style.setProperty('--p',max>0?Math.min(1,y/max).toFixed(4):0);
  if(!rm){
    for(var i=0;i<px.length;i++){
      var el=px[i],k=parseFloat(el.getAttribute('data-parallax')),host=el.parentElement,r=host.getBoundingClientRect();
      if(r.bottom<-200||r.top>vh+200)continue;
      var off=(r.top+r.height/2)-vh/2;
      el.style.translate='0 '+(-off*k).toFixed(1)+'px';
    }
  }
  ticking=false;
}
function req(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
addEventListener('scroll',req,{passive:true});addEventListener('resize',req);frame();

/* ---------- menu overlay ---------- */
var btn=$('#menuBtn'),ov=$('#overlay');
function setMenu(open){
  ov.classList.toggle('open',open);
  btn.setAttribute('aria-expanded',open);
  btn.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  ov.setAttribute('aria-hidden',!open);
  if(open){ov.removeAttribute('inert')}else{ov.setAttribute('inert','')}
  document.body.classList.toggle('lock',open);
  if(open){var f=$('.ov-nav a',ov);setTimeout(function(){f&&f.focus()},400)}else{btn.focus({preventScroll:true})}
}
btn.addEventListener('click',function(){setMenu(btn.getAttribute('aria-expanded')!=='true')});
$$('a',ov).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('open'))setMenu(false)});
matchMedia('(min-width:1100px)').addEventListener('change',function(e){if(e.matches&&ov.classList.contains('open'))setMenu(false)});

/* ---------- hero headline: word-by-word reveal ---------- */
var h1=$('#h1');
if(h1&&!rm){
  var n=0;
  (function split(node){
    $$(':scope > *',node);
    Array.prototype.slice.call(node.childNodes).forEach(function(c){
      if(c.nodeType===3){
        var frag=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(t){
          if(!t)return;
          if(/^\s+$/.test(t)){frag.appendChild(document.createTextNode(' '));return}
          var w=document.createElement('span');w.className='w';var i=document.createElement('i');i.textContent=t;i.style.setProperty('--i',n++);w.appendChild(i);frag.appendChild(w);
        });
        node.replaceChild(frag,c);
      }else if(c.nodeType===1&&c.classList.contains('grad-t')){
        var w2=document.createElement('span');w2.className='w';var i2=document.createElement('i');i2.style.setProperty('--i',n++);
        node.replaceChild(w2,c);w2.appendChild(i2);i2.appendChild(c);
      }
    });
  })(h1);
  requestAnimationFrame(function(){requestAnimationFrame(function(){h1.classList.add('go')})});
}

/* ---------- reveal (staggered) ---------- */
$$('.statgrid,.svc,.trio,.grid2,.grid4,.steps,.gallery,.prod,.chap,.qs,.exp-photos').forEach(function(p){
  $$(':scope > .rv',p).forEach(function(c,i){c.style.setProperty('--i',i)});
});
if('IntersectionObserver' in window&&!rm){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  $$('.rv').forEach(function(el){io.observe(el)});
}else{$$('.rv').forEach(function(el){el.classList.add('in')})}

/* ---------- count-up ---------- */
var cnts=$$('[data-count]');
function runCount(el){
  var to=parseInt(el.getAttribute('data-count'),10),t0=null,d=1400;
  function st(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,4);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(st)}
  el.textContent='0';requestAnimationFrame(st);
}
if(!rm&&'IntersectionObserver' in window){
  var co=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){runCount(e.target);co.unobserve(e.target)}})},{threshold:.6});
  cnts.forEach(function(c){co.observe(c)});
}

/* ---------- videos: choose source by viewport, play only when visible ---------- */
var hv=$('.herovid');
function loadHero(){
  if(!hv||hv.dataset.ready)return;hv.dataset.ready='1';
  var src=matchMedia('(min-width:900px)').matches?hv.getAttribute('data-wide'):hv.getAttribute('data-narrow');
  var s=document.createElement('source');s.src=src;s.type='video/mp4';hv.appendChild(s);hv.load();
  hv.addEventListener('playing',function(){hv.classList.add('on')},{once:true});
}
var vids=$$('video.lazyvid').concat(hv?[hv]:[]);
if(vids.length){
  if(rm||!('IntersectionObserver' in window)){vids.forEach(function(v){v.removeAttribute('autoplay');v.pause()})}
  else{
    var vo=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;
      if(e.isIntersecting&&!document.hidden){if(v===hv)loadHero();else if(v.preload==='none')v.preload='auto';var p=v.play();if(p&&p.catch)p.catch(function(){})}else{v.pause()}})},{threshold:.2});
    vids.forEach(function(v){vo.observe(v)});
    document.addEventListener('visibilitychange',function(){if(document.hidden)vids.forEach(function(v){v.pause()})});
  }
}

/* ---------- snap carousels: dots + arrows ---------- */
$$('[data-snap]').forEach(function(sn){
  var wrap=sn.parentNode,dots=$('[data-dots]',wrap),items=$$(':scope > li',sn),cur=0;
  if(!dots||!items.length)return;
  items.forEach(function(it,i){
    var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Ir para o item '+(i+1));
    b.addEventListener('click',function(){go(i)});dots.appendChild(b);
  });
  var bs=$$('button',dots);
  function go(i){var it=items[Math.max(0,Math.min(items.length-1,i))];sn.scrollTo({left:it.offsetLeft-(sn.clientWidth-it.clientWidth)/2,behavior:rm?'auto':'smooth'})}
  function upd(){
    var c=sn.scrollLeft+sn.clientWidth/2,best=0,bd=1e9;
    items.forEach(function(it,i){var d=Math.abs(it.offsetLeft+it.clientWidth/2-c);if(d<bd){bd=d;best=i}});
    cur=best;bs.forEach(function(b,i){if(i===best)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
  }
  var t=false;sn.addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(function(){upd();t=false})}},{passive:true});
  upd();
  var ar=$('[data-arrows]',wrap);
  if(ar){$('[data-prev]',ar).addEventListener('click',function(){go(cur-1)});$('[data-next]',ar).addEventListener('click',function(){go(cur+1)})}
});

/* carousels: load all their images once near the viewport */
if('IntersectionObserver' in window){
  var lo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){$$('img[loading=lazy]',e.target).forEach(function(i){i.loading='eager'});lo.unobserve(e.target)}})},{rootMargin:'700px 0px'});
  $$('[data-snap],.gallery,.marquee').forEach(function(c){lo.observe(c)});
}

/* ---------- marquee: pause offscreen ---------- */
$$('[data-marquee]').forEach(function(m){
  if(rm||!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(es){m.classList.toggle('paused',!es[0].isIntersecting)}).observe(m);
});

/* ---------- 3D tilt (hover on desktop, tap on touch) ---------- */
if(!rm){
  $$('.card.gb,.pcard,.icard,.pipe,.team,.media,.chap li,.checks').forEach(function(el){
    el.classList.add('tilt');
    var rt=0;
    function set(e){
      var b=el.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
      var max=el.offsetWidth>500?3.5:7;
      cancelAnimationFrame(rt);rt=requestAnimationFrame(function(){
        el.style.setProperty('--ry',((x-.5)*2*max).toFixed(2)+'deg');
        el.style.setProperty('--rx',((.5-y)*2*max).toFixed(2)+'deg');
        el.style.setProperty('--mx',(x*100).toFixed(1)+'%');el.style.setProperty('--my',(y*100).toFixed(1)+'%');
      });
    }
    function off(){cancelAnimationFrame(rt);el.classList.remove('hot','moving');el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')}
    el.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){el.classList.add('hot','moving')}});
    el.addEventListener('pointermove',function(e){if(e.pointerType==='mouse')set(e)});
    el.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')off()});
    el.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'){el.classList.add('hot');set(e)}});
    ['pointerup','pointercancel'].forEach(function(n){el.addEventListener(n,function(e){if(e.pointerType!=='mouse')setTimeout(off,160)})});
  });
}

/* ---------- magnetic buttons ---------- */
if(!rm&&fine){
  $$('.magnet').forEach(function(b){
    b.addEventListener('pointermove',function(e){
      var r=b.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);
      b.style.translate=(x*.22).toFixed(1)+'px '+(y*.32).toFixed(1)+'px';
    });
    b.addEventListener('pointerleave',function(){b.style.translate='0 0'});
  });
}

/* ---------- contact form -> WhatsApp ---------- */
var form=$('#form');
if(form)form.addEventListener('submit',function(e){
  e.preventDefault();var d=new FormData(form);
  var t='Olá! Quero agendar uma reunião.\nNome: '+(d.get('nome')||'')+'\nEmpresa: '+(d.get('empresa')||'')+'\nCidade/UF: '+(d.get('cidade')||'')+'\nInteresse: '+(d.get('interesse')||'')+'\nMensagem: '+(d.get('msg')||'');
  window.open('https://wa.me/5579991988251?text='+encodeURIComponent(t),'_blank','noopener');
});

/* ---------- neural network canvas (reacts to mouse / touch) ---------- */
var cv=$('#net');
if(cv&&cv.getContext){
  var ctx=cv.getContext('2d'),W,H,pts=[],raf=0,vis=false,dpr=Math.min(devicePixelRatio||1,2);
  var ptr={x:-999,y:-999,a:0};
  function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.round(Math.max(26,Math.min(78,W*H/17000)));pts=[];
    for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,p:Math.random()<.18,r:Math.random()});
  }
  function draw(){
    ctx.clearRect(0,0,W,H);var L=Math.min(140,Math.max(95,W/9)),L2=L*L,i,j,a,b;
    for(i=0;i<pts.length;i++){a=pts[i];
      for(j=i+1;j<pts.length;j++){b=pts[j];var dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;
        if(d<L2){ctx.strokeStyle=(a.p||b.p?'rgba(255,110,181,':'rgba(125,216,247,')+(0.3*(1-Math.sqrt(d)/L)).toFixed(3)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
      if(ptr.a>0.02){var px_=a.x-ptr.x,py_=a.y-ptr.y,pd=px_*px_+py_*py_,PL=170;
        if(pd<PL*PL){var al=(0.55*(1-Math.sqrt(pd)/PL)*ptr.a).toFixed(3);ctx.strokeStyle='rgba(34,199,240,'+al+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(ptr.x,ptr.y);ctx.stroke()}}
    }
    for(i=0;i<pts.length;i++){a=pts[i];ctx.fillStyle=a.p?'rgba(255,110,181,.95)':'rgba(125,216,247,.9)';ctx.beginPath();ctx.arc(a.x,a.y,(a.p?2.5:1.9)+a.r*.6,0,6.283);ctx.fill()}
    if(ptr.a>0.02){var g=ctx.createRadialGradient(ptr.x,ptr.y,0,ptr.x,ptr.y,90);g.addColorStop(0,'rgba(34,199,240,'+(0.22*ptr.a).toFixed(3)+')');g.addColorStop(1,'rgba(34,199,240,0)');ctx.fillStyle=g;ctx.fillRect(ptr.x-90,ptr.y-90,180,180)}
  }
  function step(){
    for(var i=0;i<pts.length;i++){var p=pts[i];
      if(ptr.a>0.02){var dx=ptr.x-p.x,dy=ptr.y-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<190&&d>1){var f=(1-d/190)*.012*ptr.a;p.vx+=dx/d*f;p.vy+=dy/d*f}}
      p.vx*=.995;p.vy*=.995;
      var sp=Math.abs(p.vx)+Math.abs(p.vy);if(sp<.12){p.vx+=(Math.random()-.5)*.02;p.vy+=(Math.random()-.5)*.02}
      p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}
    if(ptr.hold>0){ptr.hold--}else if(ptr.a>0){ptr.a=Math.max(0,ptr.a-.02)}
    draw();raf=requestAnimationFrame(step);
  }
  function run(){if(!raf&&vis&&!document.hidden&&!rm)raf=requestAnimationFrame(step)}
  function halt(){cancelAnimationFrame(raf);raf=0}
  size();draw();
  var rz;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){size();draw()},200)});
  var host=cv.parentNode;
  function mv(e){var r=cv.getBoundingClientRect();ptr.x=e.clientX-r.left;ptr.y=e.clientY-r.top;ptr.a=Math.min(1,ptr.a+.25);ptr.hold=e.pointerType==='mouse'?20:90}
  if(!rm){
    host.addEventListener('pointermove',mv,{passive:true});
    host.addEventListener('pointerdown',mv,{passive:true});
    host.addEventListener('pointerleave',function(){ptr.hold=0});
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;vis?run():halt()},{threshold:0}).observe(cv);
    document.addEventListener('visibilitychange',function(){document.hidden?halt():run()});
  }
}
})();
