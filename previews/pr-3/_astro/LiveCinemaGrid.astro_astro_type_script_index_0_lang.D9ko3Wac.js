import{l as c,C as o}from"./momo-client.CsPGe-CE.js";const e=a=>String(a??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);document.querySelectorAll("[data-live-cinemas]").forEach(async a=>{const t=Number(a.dataset.limit||8);try{const s=await c();if(!s.length)throw new Error("MoMo không trả về rạp nào");a.innerHTML=s.slice(0,t).map((n,i)=>{const l=o[n.chainId]||"Rạp";return`<a class="cinema-tile" href="/lich-chieu/momo/">
          <span class="cinema-tile__symbol cinema-tile__symbol--${i%4}">${e(l.slice(0,1))}</span>
          <span class="cinema-tile__body"><strong>${e(n.name)}</strong><small>${e(l)} · TP. Hồ Chí Minh</small></span>
          <span class="cinema-tile__arrow">↗</span>
        </a>`}).join(""),a.setAttribute("aria-busy","false")}catch(s){a.innerHTML=`<p class="live-status">Không tải được danh sách rạp từ MoMo (${e(s.message)}).</p>`,a.setAttribute("aria-busy","false")}});
