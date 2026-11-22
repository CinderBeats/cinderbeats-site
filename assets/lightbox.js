/* CinderBeats product photo lightbox: click/tap to open, pinch / wheel / buttons to zoom, drag to pan, Esc closes. Vanilla JS. */
(function(){
  var lb=document.getElementById('lightbox'); if(!lb) return;
  var stage=lb.querySelector('.lb-stage'), img=stage.querySelector('img'), closeBtn=lb.querySelector('.lb-close');
  var scale=1, tx=0, ty=0, opener=null, pointers={}, startDist=0, startScale=1, last=null, lastTap=0;
  var MIN=1, MAX=5;
  function apply(){ img.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')'; stage.style.cursor=scale>1?'grab':'zoom-in'; }
  function clampPan(){ if(scale<=1){tx=0;ty=0;return;} var r=img.getBoundingClientRect(), w=r.width/scale, h=r.height/scale; var mx=(w*scale-w)/2+40, my=(h*scale-h)/2+40; tx=Math.max(-mx,Math.min(mx,tx)); ty=Math.max(-my,Math.min(my,ty)); }
  function setScale(s){ scale=Math.max(MIN,Math.min(MAX,s)); clampPan(); apply(); }
  function reset(){ scale=1; tx=0; ty=0; apply(); }
  function open(btn){
    opener=btn; var t=btn.querySelector('img');
    img.src=btn.getAttribute('data-zoom'); img.alt=t?t.alt:'';
    reset(); lb.hidden=false; document.body.classList.add('lb-open'); closeBtn.focus();
  }
  function close(){ lb.hidden=true; document.body.classList.remove('lb-open'); img.removeAttribute('src'); pointers={}; if(opener) opener.focus(); }
  document.querySelectorAll('.zoomable').forEach(function(b){ b.addEventListener('click',function(){ open(b); }); });
  closeBtn.addEventListener('click',close);
  lb.addEventListener('click',function(e){ if(e.target===closeBtn) return; var r=img.getBoundingClientRect(); var inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; if(!inside&&scale===1) close(); });
  document.addEventListener('keydown',function(e){
    if(lb.hidden) return;
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='+'||e.key==='='){ setScale(scale*1.25); }
    else if(e.key==='-'){ setScale(scale/1.25); }
    else if(e.key==='0'){ reset(); }
    else if(e.key==='Tab'){ e.preventDefault(); closeBtn.focus(); } /* keep focus inside the dialog */
  });
  stage.addEventListener('wheel',function(e){ e.preventDefault(); setScale(scale*(e.deltaY<0?1.15:1/1.15)); },{passive:false});
  function dist(){ var p=Object.keys(pointers).map(function(k){return pointers[k];}); return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); }
  stage.addEventListener('pointerdown',function(e){
    pointers[e.pointerId]={x:e.clientX,y:e.clientY}; stage.setPointerCapture(e.pointerId);
    var n=Object.keys(pointers).length;
    if(n===2){ startDist=dist(); startScale=scale; last=null; }
    else if(n===1){ last={x:e.clientX,y:e.clientY};
      var now=Date.now(); if(now-lastTap<300){ scale>1?reset():setScale(2.5); } lastTap=now; }
  });
  stage.addEventListener('pointermove',function(e){
    if(!pointers[e.pointerId]) return; pointers[e.pointerId]={x:e.clientX,y:e.clientY};
    var n=Object.keys(pointers).length;
    if(n===2&&startDist){ setScale(startScale*dist()/startDist); }
    else if(n===1&&last&&scale>1){ tx+=e.clientX-last.x; ty+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; clampPan(); apply(); }
  });
  function up(e){ delete pointers[e.pointerId]; var n=Object.keys(pointers).length; if(n<2) startDist=0; if(n===1){ var k=Object.keys(pointers)[0]; last={x:pointers[k].x,y:pointers[k].y}; } else last=null; }
  stage.addEventListener('pointerup',up); stage.addEventListener('pointercancel',up);
})();
