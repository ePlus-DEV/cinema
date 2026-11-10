import{C,s as N,m as x,l as R,f as S}from"./momo-client.BonufPqL.js";const l=document.querySelector("[data-momo-live]");if(l){let m=function(e,t){c.setAttribute("aria-busy","false"),c.innerHTML="";const n=document.createElement("p");if(n.className="momo-live__status",n.textContent=e,t){const a=document.createElement("button");a.type="button",a.textContent="Thử lại",a.addEventListener("click",t),n.append(a)}c.append(n)},M=function(e){c.innerHTML=`<div class="momo-live__loading-head skeleton" aria-hidden="true">
          <span class="skeleton__line" style="width:54%"></span>
          <span class="skeleton__line skeleton__line--short"></span>
        </div>
        <div class="momo-live__loading-programs" aria-hidden="true">
          ${Array.from({length:2},()=>`<div class="momo-live__loading-program skeleton">
            <span class="momo-live__loading-poster"></span>
            <div class="momo-live__loading-content">
              <span class="skeleton__line" style="width:75%"></span>
              <span class="skeleton__line skeleton__line--short"></span>
              <div class="momo-live__loading-times">
                ${Array.from({length:4},()=>'<span class="momo-live__loading-time"></span>').join("")}
              </div>
            </div>
          </div>`).join("")}
        </div>
        <p class="momo-live__status">${o(e)}</p>`,c.setAttribute("aria-busy","true")},T=function(){const e=new Map;for(const n of s.cinemas)e.set(n.chainId,(e.get(n.chainId)||0)+1);const t=[[0,`Tất cả (${s.cinemas.length})`]];for(const[n,a]of[...e.entries()].sort((d,i)=>i[1]-d[1]))t.push([n,`${C[n]||"Rạp"} (${a})`]);u.innerHTML=t.map(([n,a])=>`<button type="button" class="momo-live__chip" data-chain="${n}" aria-pressed="${s.chain===n}">${o(a)}</button>`).join(""),u.querySelectorAll("[data-chain]").forEach(n=>{n.addEventListener("click",()=>{s.chain=Number(n.dataset.chain),T(),h()})})},I=function(){return s.cinemas.filter(e=>(s.chain===0||e.chainId===s.chain)&&e.name.toLowerCase().includes(s.query))},h=function(){const e=I();if(!e.length){r.innerHTML='<p class="momo-live__status">Không tìm thấy rạp phù hợp.</p>';return}r.innerHTML=e.map(t=>`<button type="button" class="momo-live__cinema" data-cinema="${o(t.key)}" aria-current="${s.selected===t.key}">
           <strong>${o(t.name)}</strong><span>${o(C[t.chainId]||"")} · ${o(t.address)}</span>
         </button>`).join(""),r.querySelectorAll("[data-cinema]").forEach(t=>{t.addEventListener("click",()=>{s.selected=t.dataset.cinema;const n=new URL(window.location.href);n.searchParams.set("cinema",s.selected),window.history.replaceState(null,"",n),h(),y()})})},E=function(e,t,n){if(!n.length){v=[],m($?`Phim này chưa có suất chiếu tại ${e.name} ngày ${t.split("-").reverse().join("/")}. Hãy thử rạp hoặc ngày khác.`:`${e.name} chưa có suất chiếu ngày ${t.split("-").reverse().join("/")}.`);return}v=[];const a=t.split("-").reverse().join("/"),d=n.map(i=>{const A=(i.VersionsCaptions||[]).map(b=>{const H=(b.ShowTimes||[]).map(p=>{const k=String(p.ShowTime||"").slice(11,16);return`<button type="button" class="showtime" data-show-idx="${v.push({show:p,filmTitle:i.Title,format:S(b),cinemaName:e.name,dateLabel:a,timeLabel:`${k}${p.ShowTimeDuration?` (${p.ShowTimeDuration})`:""}`,screenName:p.ScreenName||""})-1}" title="Xem sơ đồ ghế suất ${o(k)}">${o(k)}</button>`}).join("");return`<div class="program__format"><span class="program__format-label">${o(S(b))}</span><div class="showtime-row">${H}</div></div>`}).join(""),j=[i.ApiGenreName,i.Duration?`${i.Duration} phút`:"",i.ApiRatingFormat].filter(Boolean).join(" · ");return`<article class="program">
          <div class="momo-live__program-head">
            ${i.poster?`<img class="momo-live__poster" src="${o(i.poster)}" alt="" loading="lazy" />`:""}
            <div class="program__movie">
              <h3><a class="momo-live__film-link" href="/previews/pr-4/phim/chi-tiet/?id=${encodeURIComponent(i.Id)}">${o(i.Title)}</a></h3>
              <p>${o(j)}</p>
            </div>
          </div>
          ${A}
        </article>`}).join("");c.setAttribute("aria-busy","false"),c.innerHTML=`<article class="theater-showtime">
        <header class="theater-showtime__header">
          <div><p class="eyebrow">${o(C[e.chainId]||"")}</p><h3>${o(e.name)}</h3><p>${o(e.address)}</p>${_?"":`<a class="momo-live__cinema-link" href="/previews/pr-4/rap/chi-tiet/?cinema=${encodeURIComponent(e.key)}">Chi tiết rạp ↗</a>`}</div>
          <span class="date-label">${o(t.split("-").reverse().join("/"))}</span>
        </header>
        <div class="program-list">${d}</div>
      </article>`};const u=l.querySelector("[data-momo-chips]"),r=l.querySelector("[data-momo-cinemas]"),c=l.querySelector("[data-momo-results]"),L=l.querySelector("[data-momo-search]"),g=new URLSearchParams(window.location.search),_=l.dataset.cinemaOnly==="true",q=window.location.pathname.includes("/phim/chi-tiet/"),f=g.get("movie")||(q?g.get("id"):null),$=f&&/^[0-9]+$/.test(f)?f:null,s={cinemas:[],chain:0,query:"",selected:null,dayOffset:0,sessionToken:0},o=e=>String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);let v=[];async function y(){const e=s.cinemas.find(a=>a.key===s.selected);if(!e)return;const t=++s.sessionToken,n=N(s.dayOffset);M(`Đang tải suất chiếu của ${e.name} ngày ${n.split("-").reverse().join("/")}…`);try{const a=await x("/v2/cinema/session",{Cineplex:e.chainId,ApiCinemaId:e.apiCinemaId,Date:n,RecaptchaToken:""});if(t!==s.sessionToken)return;for(const i of a.Films||[])i.poster=i.GraphicUrl||i.ImageUrl||"";const d=$?(a.Films||[]).filter(i=>String(i.Id)===$):a.Films||[];E(e,n,d)}catch(a){if(t!==s.sessionToken)return;m(`Không tải được suất chiếu từ MoMo (${a.message}).`,y)}}async function w(){try{if(s.cinemas=await R(),r.setAttribute("aria-busy","false"),!s.cinemas.length){r.innerHTML="",u.replaceChildren(),m("MoMo không trả về rạp nào cho TP. Hồ Chí Minh.",w);return}const e=g.get("cinema"),t=s.cinemas.find(n=>n.key===e);if(_&&!t){r.innerHTML="",m("Không tìm thấy cụm rạp này. Hãy quay lại danh sách rạp để chọn một cụm rạp khác.");return}s.selected=t?t.key:s.cinemas[0].key,_||(T(),h()),y()}catch(e){r.innerHTML="",u.replaceChildren(),r.setAttribute("aria-busy","false"),m(`Không tải được danh sách rạp từ MoMo (${e.message}).`,w)}}c.addEventListener("click",e=>{const t=e.target.closest("[data-show-idx]");if(!t)return;const n=v[Number(t.dataset.showIdx)];n&&window.dispatchEvent(new CustomEvent("eplus:open-seats",{detail:n}))}),L.addEventListener("input",()=>{s.query=L.value.trim().toLowerCase(),h()}),window.addEventListener("cinema:day",e=>{s.dayOffset=Number(e.detail?.offset??e.detail??0),y()}),w()}
