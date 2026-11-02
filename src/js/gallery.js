export function initGallery() {
  const dialog=document.querySelector('#lightbox'), img=dialog.querySelector('img'), count=dialog.querySelector('.lightbox-count');
  const items=[...document.querySelectorAll('.gallery-item')]; let index=0, previous=null;
  const show=i=>{index=(i+items.length)%items.length; img.src=new URL(items[index].dataset.image, document.baseURI).href; img.alt=items[index].querySelector('img').alt; count.textContent=`${index+1} / ${items.length}`;};
  items.forEach((item,i)=>item.addEventListener('click',()=>{previous=item;show(i);dialog.showModal();dialog.querySelector('.lightbox-close').focus();}));
  dialog.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('.lightbox-prev').addEventListener('click',()=>show(index-1)); dialog.querySelector('.lightbox-next').addEventListener('click',()=>show(index+1));
  dialog.addEventListener('close',()=>previous?.focus());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(index-1);if(e.key==='ArrowRight')show(index+1);});
  let swipeStart = null;
  const beginSwipe = event => { const point = event.changedTouches?.[0] ?? event; swipeStart = { x: point.clientX, y: point.clientY }; };
  const finishSwipe = event => {
    if (!swipeStart) return;
    const point = event.changedTouches?.[0] ?? event;
    const dx = point.clientX - swipeStart.x, dy = point.clientY - swipeStart.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) show(index + (dx < 0 ? 1 : -1));
    swipeStart = null;
  };
  dialog.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') beginSwipe(event); }, { passive: true });
  dialog.addEventListener('pointerup', event => { if (event.pointerType === 'touch') finishSwipe(event); }, { passive: true });
  if (!('PointerEvent' in window)) {
    dialog.addEventListener('touchstart', beginSwipe, { passive: true });
    dialog.addEventListener('touchend', finishSwipe, { passive: true });
  }
}

