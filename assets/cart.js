/* CinderBeats cart: localStorage cart + slide-out drawer; checkout via the cinderbeats-cart Worker (Square hosted checkout). */
(function(){
  var WORKER='https://cinderbeats-cart.cinderbeats.workers.dev/checkout';
  var KEY='cb_cart_v1';
  var CATALOG={
    'MGMNS73QP5ASZPZHF3GLKMUZ':{name:'Mystery Box',price:100,img:'img/shop/mystery-box-1-800.jpg',max:1},
    'SPFFTCRADS6QDTJHN6455MUV':{name:'Mystery Box (3 items)',price:500,img:'img/shop/mystery-box-5-800.jpg',max:5},
    'KFFDUHELHYHA5MNJYNSLXK23':{name:'Mystery Box (6 items)',price:1000,img:'img/shop/mystery-box-10-800.jpg',max:5}
  };
  var BUSY='Checkout is busy, try Buy now.';
  var drawer=document.getElementById('cart-drawer'), overlay=document.querySelector('.cart-overlay'), btn=document.querySelector('.cart-btn');
  if(document.documentElement.getAttribute('data-shop')==='closed'){ try{ localStorage.removeItem(KEY); }catch(e){} return; } /* shop closed: no stale checkouts */
  if(!drawer||!btn) return;
  var linesEl=drawer.querySelector('.cd-lines'), emptyEl=drawer.querySelector('.cd-empty'), footEl=drawer.querySelector('.cd-foot'),
      subEl=drawer.querySelector('.cd-subtotal'), errEl=drawer.querySelector('.cd-error'), coBtn=drawer.querySelector('.cd-checkout'),
      closeBtn=drawer.querySelector('.cd-close'), toast=document.querySelector('.cart-toast'), countEl=btn.querySelector('.cart-count');
  var opener=null;
  function load(){ try{ var c=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(c)?c.filter(function(l){return CATALOG[l.id]&&l.qty>0;}):[]; }catch(e){ return []; } }
  function save(c){ try{ localStorage.setItem(KEY,JSON.stringify(c)); }catch(e){} }
  var cart=load();
  if(new URLSearchParams(location.search).get('order')==='thanks'){ cart=[]; save(cart); }
  function money(c){ return '$'+(c/100).toFixed(2); }
  function count(){ return cart.reduce(function(n,l){return n+l.qty;},0); }
  function setQty(id,q){
    var max=CATALOG[id].max, l=cart.filter(function(x){return x.id===id;})[0];
    q=Math.max(0,Math.min(max,q));
    if(!l&&q>0){ cart.push({id:id,qty:q}); } else if(l){ if(q===0) cart=cart.filter(function(x){return x.id!==id;}); else l.qty=q; }
    save(cart); render();
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function render(){
    var n=count(); countEl.textContent=n; btn.classList.toggle('has-items',n>0);
    btn.setAttribute('aria-label','Open cart, '+n+(n===1?' item':' items'));
    linesEl.innerHTML=cart.map(function(l){ var p=CATALOG[l.id];
      return '<li class="cd-line" data-id="'+l.id+'"><img src="'+p.img+'" alt="" width="64" height="64">'+
        '<div class="cd-info"><b>'+esc(p.name)+'</b><span>'+money(p.price)+' each</span>'+
        '<div class="cd-qty"><button type="button" class="q-dec" aria-label="Decrease quantity of '+esc(p.name)+'">&minus;</button>'+
        '<span aria-label="Quantity">'+l.qty+'</span>'+
        '<button type="button" class="q-inc" aria-label="Increase quantity of '+esc(p.name)+'"'+(l.qty>=p.max?' disabled':'')+'>+</button>'+
        '<button type="button" class="q-rm">Remove</button></div>'+(l.qty>=p.max?'<small class="cd-max">Max '+p.max+' per order</small>':'')+'</div>'+
        '<b class="cd-lt">'+money(p.price*l.qty)+'</b></li>'; }).join('');
    var sub=cart.reduce(function(s,l){return s+CATALOG[l.id].price*l.qty;},0);
    subEl.textContent=money(sub); emptyEl.hidden=n>0; footEl.hidden=n===0; errEl.hidden=true;
  }
  function focusables(){ return Array.prototype.slice.call(drawer.querySelectorAll('button:not([disabled]),a[href]')).filter(function(e){return e.offsetParent!==null;}); }
  function open(){ toast.classList.remove('show'); opener=document.activeElement; drawer.hidden=false; overlay.hidden=false; requestAnimationFrame(function(){drawer.classList.add('open');overlay.classList.add('open');});
    btn.setAttribute('aria-expanded','true'); document.body.classList.add('cart-open'); closeBtn.focus(); }
  function close(){ drawer.classList.remove('open'); overlay.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.body.classList.remove('cart-open');
    setTimeout(function(){ drawer.hidden=true; overlay.hidden=true; },250); (opener&&opener.focus?opener:btn).focus(); }
  btn.addEventListener('click',open); closeBtn.addEventListener('click',close); overlay.addEventListener('click',close);
  document.addEventListener('keydown',function(e){
    if(drawer.hidden) return;
    if(e.key==='Escape'){ e.preventDefault(); close(); }
    else if(e.key==='Tab'){ var f=focusables(); if(!f.length) return; var a=f[0], z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey&&document.activeElement===z){ e.preventDefault(); a.focus(); } }
  });
  linesEl.addEventListener('click',function(e){
    var li=e.target.closest('.cd-line'); if(!li) return; var id=li.getAttribute('data-id'), l=cart.filter(function(x){return x.id===id;})[0]; if(!l) return;
    var cls=e.target.className;
    if(cls==='q-inc') setQty(id,l.qty+1); else if(cls==='q-dec') setQty(id,l.qty-1); else if(cls==='q-rm') setQty(id,0); else return;
    var again=linesEl.querySelector('.cd-line[data-id="'+id+'"] .'+cls); (again&&!again.disabled?again:closeBtn).focus();
  });
  var toastT;
  document.querySelectorAll('.add-to-cart').forEach(function(b){ b.addEventListener('click',function(){
    var id=b.getAttribute('data-id'); if(!CATALOG[id]) return; var l=cart.filter(function(x){return x.id===id;})[0], before=l?l.qty:0;
    setQty(id,before+1); var after=(cart.filter(function(x){return x.id===id;})[0]||{}).qty||0;
    toast.textContent=after>before?(CATALOG[id].name+' added to cart.'):('Max '+CATALOG[id].max+' '+CATALOG[id].name+' per order.');
    toast.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){toast.classList.remove('show');},2600);
  }); });
  coBtn.addEventListener('click',function(){
    if(!cart.length) return; coBtn.disabled=true; var label=coBtn.textContent; coBtn.textContent='Opening checkout…'; errEl.hidden=true;
    var ctl=('AbortController' in window)?new AbortController():null; var t=setTimeout(function(){ if(ctl) ctl.abort(); },15000);
    fetch(WORKER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart.map(function(l){return {id:l.id,qty:l.qty};})}),signal:ctl?ctl.signal:undefined})
      .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })
      .then(function(x){ clearTimeout(t); if(x.ok&&x.d&&typeof x.d.url==='string'&&/^https:\/\/(square\.link|checkout\.square\.site)\//.test(x.d.url)){ location.href=x.d.url; } else { throw new Error('bad'); } })
      .catch(function(){ clearTimeout(t); errEl.textContent=BUSY; errEl.hidden=false; coBtn.disabled=false; coBtn.textContent=label; });
  });
  window.addEventListener('storage',function(e){ if(e.key===KEY){ cart=load(); render(); } });
  render();
})();
