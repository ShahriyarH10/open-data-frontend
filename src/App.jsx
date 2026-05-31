import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// ── Source definitions ────────────────────────────────────────────────────────
const COUNTRIES = [
  // North America
  { code:"us",  label:"United States",   flag:"🇺🇸", region:"Americas" },
  { code:"ca",  label:"Canada",          flag:"🇨🇦", region:"Americas" },
  { code:"mx",  label:"Mexico",          flag:"🇲🇽", region:"Americas" },
  { code:"br",  label:"Brazil",          flag:"🇧🇷", region:"Americas" },
  { code:"ar",  label:"Argentina",       flag:"🇦🇷", region:"Americas" },
  // Europe
  { code:"eu",  label:"European Union",  flag:"🇪🇺", region:"Europe" },
  { code:"uk",  label:"United Kingdom",  flag:"🇬🇧", region:"Europe" },
  { code:"de",  label:"Germany",         flag:"🇩🇪", region:"Europe" },
  { code:"fr",  label:"France",          flag:"🇫🇷", region:"Europe" },
  { code:"nl",  label:"Netherlands",     flag:"🇳🇱", region:"Europe" },
  { code:"it",  label:"Italy",           flag:"🇮🇹", region:"Europe" },
  { code:"es",  label:"Spain",           flag:"🇪🇸", region:"Europe" },
  // Asia-Pacific
  { code:"in",  label:"India",           flag:"🇮🇳", region:"Asia-Pacific" },
  { code:"jp",  label:"Japan",           flag:"🇯🇵", region:"Asia-Pacific" },
  { code:"sg",  label:"Singapore",       flag:"🇸🇬", region:"Asia-Pacific" },
  { code:"au",  label:"Australia",       flag:"🇦🇺", region:"Asia-Pacific" },
  { code:"nz",  label:"New Zealand",     flag:"🇳🇿", region:"Asia-Pacific" },
  { code:"pk",  label:"Pakistan",        flag:"🇵🇰", region:"Asia-Pacific" },
  // Africa
  { code:"za",  label:"South Africa",    flag:"🇿🇦", region:"Africa" },
  { code:"ke",  label:"Kenya",           flag:"🇰🇪", region:"Africa" },
];

const PLATFORMS = [
  { code:"wb",      label:"World Bank",        flag:"🌍", desc:"Global development indicators", cat:"Economics" },
  { code:"hf",      label:"Hugging Face",      flag:"🤗", desc:"AI & ML datasets", cat:"AI/ML" },
  { code:"zenodo",  label:"Zenodo",            flag:"🔬", desc:"Scientific research data", cat:"Research" },
  { code:"kaggle",  label:"Kaggle",            flag:"📊", desc:"Community ML datasets", cat:"AI/ML" },
  { code:"harvard", label:"Harvard Dataverse", flag:"🎓", desc:"Academic research data", cat:"Research" },
  { code:"who",     label:"WHO",               flag:"🏥", desc:"Global health statistics", cat:"Health" },
  { code:"figshare",label:"Figshare",          flag:"📁", desc:"Research articles & data", cat:"Research" },
  { code:"dryad",   label:"Dryad",             flag:"🌿", desc:"Curated scientific data", cat:"Research" },
  { code:"openml",  label:"OpenML",            flag:"🤖", desc:"ML benchmark datasets", cat:"AI/ML" },
  { code:"gbif",    label:"GBIF",              flag:"🦋", desc:"Biodiversity records", cat:"Science" },
  { code:"osf",     label:"OSF",               flag:"📂", desc:"Open Science Framework", cat:"Research" },
  { code:"pangaea", label:"PANGAEA",           flag:"🌊", desc:"Earth & environmental data", cat:"Science" },
  { code:"icpsr",   label:"ICPSR",             flag:"📚", desc:"Social science archive", cat:"Research" },
  { code:"nasa",    label:"NASA",              flag:"🚀", desc:"Space & earth science data", cat:"Science" },
  { code:"uci",     label:"UCI ML Repo",       flag:"🎯", desc:"Classic ML benchmark data", cat:"AI/ML" },
  { code:"noaa",    label:"NOAA",              flag:"🌦️", desc:"Climate & weather data", cat:"Science" },
  { code:"imf",     label:"IMF",               flag:"💹", desc:"International economic data", cat:"Economics" },
  { code:"oecd",    label:"OECD",              flag:"📈", desc:"Economic statistics", cat:"Economics" },
  { code:"fao",     label:"FAO",               flag:"🌾", desc:"Food & agriculture data", cat:"Science" },
  { code:"unicef",  label:"UNICEF",            flag:"👶", desc:"Child welfare statistics", cat:"Health" },
  { code:"cdc",     label:"CDC",               flag:"🏛️", desc:"US public health data", cat:"Health" },
  { code:"eurostat",label:"Eurostat",          flag:"📉", desc:"EU statistics", cat:"Economics" },
];

const REGIONS = ["Americas","Europe","Asia-Pacific","Africa"];

const PLATFORM_CATS = ["All", "AI/ML", "Research", "Science", "Economics", "Health"];

const FORMAT_COLORS = {
  CSV:"#22c55e",JSON:"#3b82f6",XML:"#f59e0b",XLS:"#22c55e",XLSX:"#22c55e",
  PDF:"#ef4444",SHP:"#8b5cf6",GEOJSON:"#06b6d4",ZIP:"#6b7280",TAB:"#22c55e",
  PARQUET:"#a855f7",HDF5:"#f97316",NC:"#06b6d4",RDATA:"#3b82f6",
};
const fmtColor = f => FORMAT_COLORS[f?.toUpperCase()] || "#6b7280";

function safeYear(v) {
  if (!v) return null;
  try { const y = new Date(v).getFullYear(); return isNaN(y) ? null : y; } catch { return null; }
}

function useDebounce(v, d) {
  
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}

// ── UI primitives ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#050d1a",
  surface:   "#0a1628",
  surfaceHover:"#0d1e38",
  border:    "#1a3050",
  borderHi:  "#2563eb",
  dim:       "#1a3050",
  text:      "#deeeff",
  textMid:   "#5a8aaa",
  textDim:   "#2a4a68",
  accent:    "#2563eb",
  accentSoft:"#1d4ed8",
  green:     "#22c55e",
};

function Shimmer() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {[1,2,3,4,5].map(i=>(
        <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"22px",
          animation:"pulse 1.6s ease infinite",animationDelay:`${i*0.1}s`}}>
          <div style={{height:"17px",background:C.dim,borderRadius:"4px",width:"52%",marginBottom:"11px"}}/>
          <div style={{height:"12px",background:C.dim,borderRadius:"3px",width:"86%",marginBottom:"7px"}}/>
          <div style={{height:"12px",background:C.dim,borderRadius:"3px",width:"63%",marginBottom:"16px"}}/>
          <div style={{display:"flex",gap:"6px"}}>
            {[1,2,3].map(j=><div key={j} style={{height:"20px",width:"48px",background:C.dim,borderRadius:"20px"}}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DatasetCard({ item, idx }) {
  const [exp, setExp] = useState(false);
  const desc = (item.description||"").replace(/\s+/g," ").trim();
  const short = desc.length > 180 ? desc.slice(0,180)+"…" : desc;
  const fmts = [...new Set((item.formats||[]).filter(Boolean).map(f=>f.toUpperCase()))].slice(0,6);
  const yr = safeYear(item.updatedAt);
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"13px",padding:"20px 22px",
      transition:"border-color .16s,background .16s",animation:`slideUp .35s ${idx*45}ms ease both`,position:"relative"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHi;e.currentTarget.style.background=C.surfaceHover;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface;}}>

      {/* Source badge */}
      <div style={{position:"absolute",top:"14px",right:"14px",background:"#081828",
        border:`1px solid ${C.border}`,borderRadius:"20px",padding:"3px 9px",display:"flex",
        alignItems:"center",gap:"4px",fontSize:"10.5px",color:C.textMid,fontFamily:"'JetBrains Mono',monospace",
        maxWidth:"150px",overflow:"hidden",whiteSpace:"nowrap"}}>
        <span>{item.sourceFlag}</span>
        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{item.source}</span>
      </div>

      {/* Country + title */}
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px",paddingRight:"160px"}}>
        <h3 style={{margin:0,fontSize:"14.5px",fontWeight:600,color:C.text,
          fontFamily:"'Sora',sans-serif",lineHeight:1.4}}>{item.title}</h3>
      </div>

      {item.organization && (
        <div style={{fontSize:"11px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace",
          marginBottom:"9px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>
          {item.organization}
        </div>
      )}

      {desc && (
        <p style={{margin:"0 0 12px",fontSize:"12.5px",color:C.textMid,lineHeight:1.65,fontFamily:"'Inter',sans-serif"}}>
          {exp ? desc : short}
          {desc.length>180 && (
            <button onClick={()=>setExp(!exp)} style={{background:"none",border:"none",
              color:C.accent,cursor:"pointer",fontSize:"11px",marginLeft:"5px",padding:0}}>
              {exp?"↑ less":"↓ more"}
            </button>
          )}
        </p>
      )}

      {item.tags?.length>0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"12px"}}>
          {item.tags.slice(0,7).map((t,i)=>(
            <span key={i} style={{background:"#070f1c",border:`1px solid ${C.border}`,borderRadius:"20px",
              padding:"2px 8px",fontSize:"10px",color:"#3a7a9a",fontFamily:"'JetBrains Mono',monospace"}}>{t}</span>
          ))}
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
          {fmts.map((f,i)=>(
            <span key={i} style={{borderRadius:"4px",padding:"1px 7px",fontSize:"10px",fontWeight:700,
              fontFamily:"'JetBrains Mono',monospace",background:fmtColor(f)+"1a",
              border:`1px solid ${fmtColor(f)}44`,color:fmtColor(f)}}>{f}</span>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
          {yr && <span style={{fontSize:"10.5px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{yr}</span>}
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            style={{background:`linear-gradient(135deg,${C.accentSoft},${C.accent})`,color:"#fff",
              padding:"5px 13px",borderRadius:"7px",fontSize:"11.5px",fontWeight:600,
              textDecoration:"none",fontFamily:"'Sora',sans-serif",display:"inline-flex",alignItems:"center",gap:"3px"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=".82"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>View ↗</a>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ flag, label, count, code }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",margin:"24px 0 10px",
      paddingBottom:"9px",borderBottom:`1px solid ${C.border}`}}>
      <span style={{fontSize:"17px"}}>{flag}</span>
      <span style={{fontSize:"13px",fontWeight:700,color:"#7bafd4",fontFamily:"'Sora',sans-serif"}}>{label}</span>
      <span style={{fontSize:"10.5px",color:C.textDim,background:"#0a1628",
        border:`1px solid ${C.border}`,borderRadius:"20px",padding:"1px 8px",
        fontFamily:"'JetBrains Mono',monospace"}}>{count} result{count!==1?"s":""}</span>
    </div>
  );
}

// ── Checkbox pill ─────────────────────────────────────────────────────────────
function CheckPill({ active, onClick, flag, label }) {
  return (
    <button onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:"5px",
      background: active ? "#0f2a50" : C.surface,
      border: `1px solid ${active ? C.accent : C.border}`,
      borderRadius:"8px",padding:"6px 11px",cursor:"pointer",transition:"all .14s",
      fontFamily:"'Sora',sans-serif",fontSize:"12px",
      color: active ? "#9ecfef" : C.textMid,
    }}
    onMouseEnter={e=>{ if(!active){ e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color="#7bb8e8"; }}}
    onMouseLeave={e=>{ if(!active){ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textMid; }}}>
      <span style={{fontSize:"14px"}}>{flag}</span>
      <span style={{lineHeight:1}}>{label}</span>
      {active && <span style={{fontSize:"9px",color:C.accent,marginLeft:"2px"}}>✓</span>}
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [query, setQuery]               = useState("");
  const [tab, setTab]                   = useState("countries");   // "countries" | "platforms"
  const [selCountries, setSelCountries] = useState([]);            // [] = worldwide
  const [selPlatforms, setSelPlatforms] = useState([]);
  const [regionFilter, setRegionFilter] = useState("All");
  const [countrySearch, setCountrySearch]   = useState("");
  const [platformSearch, setPlatformSearch] = useState("");
  const [platformCat, setPlatformCat]       = useState("All");
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [error, setError]               = useState(null);
  const inputRef = useRef(null);
  const dq = useDebounce(query, 700);

  const activeSources = useMemo(() => {
    const c = selCountries.length ? selCountries : [];
    const p = selPlatforms.length ? selPlatforms : [];
    return [...c, ...p];
  }, [selCountries, selPlatforms]);

  const isWorldwide = activeSources.length === 0;

  const doSearch = useCallback(async (q, sources) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    if (q.trim().length < 2) return; // wait for at least 2 chars
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ q, limit: 30 });
      if (sources.length) params.set("sources", sources.join(","));
      const res = await fetch(`${API_BASE}/search?${params}`);
      if (!res.ok) throw new Error("API " + res.status);
      const data = await res.json();
      setResults(data.results || []);
      setSearched(true);
    } catch(e) {
      setError("Cannot reach the backend. Make sure it's running on port 4000.");
      setResults([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { doSearch(dq, activeSources); }, [dq, activeSources, doSearch]);

  // group results by source when >1 source
  const grouped = useMemo(() => {
    if (activeSources.length === 1 && activeSources[0]) return null; // flat list for single source
    const map = {};
    for (const r of results) {
      if (!map[r.source]) map[r.source] = { flag: r.sourceFlag, items: [] };
      map[r.source].items.push(r);
    }
    return Object.keys(map).length > 1 ? map : null;
  }, [results, activeSources]);

  function toggleCountry(code) {
    setSelCountries(p => p.includes(code) ? p.filter(c => c!==code) : [...p, code]);
  }
  function togglePlatform(code) {
    setSelPlatforms(p => p.includes(code) ? p.filter(c => c!==code) : [...p, code]);
  }
  function clearAll() { setSelCountries([]); setSelPlatforms([]); }

  const filteredPlatforms = useMemo(() => {
    const ps = platformSearch.trim().toLowerCase();
    return PLATFORMS.filter(p => {
      const matchesCat = platformCat === "All" || p.cat === platformCat;
      const matchesSearch = !ps ||
        p.label.toLowerCase().includes(ps) ||
        p.desc.toLowerCase().includes(ps) ||
        p.cat.toLowerCase().includes(ps);
      return matchesCat && matchesSearch;
    });
  }, [platformCat, platformSearch]);

  const filteredCountries = useMemo(() => {
    const cs = countrySearch.trim().toLowerCase();
    return COUNTRIES.filter(c => {
      const matchesRegion = regionFilter === "All" || c.region === regionFilter;
      const matchesSearch = !cs ||
        c.label.toLowerCase().includes(cs) ||
        c.region.toLowerCase().includes(cs) ||
        c.code.toLowerCase().includes(cs);
      return matchesRegion && matchesSearch;
    });
  }, [regionFilter, countrySearch]);

  const totalSelected = activeSources.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};color:${C.text};font-family:'Sora',sans-serif;min-height:100vh;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px;}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
      `}</style>

      {/* Grid bg */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,
        backgroundImage:`linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`,
        backgroundSize:"48px 48px"}}/>

      <div style={{position:"relative",zIndex:1,maxWidth:"960px",margin:"0 auto",padding:"0 20px 80px"}}>

        {/* ── Header ── */}
        <header style={{textAlign:"center",padding:"48px 0 36px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"#081828",
            border:`1px solid ${C.border}`,borderRadius:"20px",padding:"4px 13px",marginBottom:"16px",
            fontSize:"10.5px",color:C.textMid,fontFamily:"'JetBrains Mono',monospace",animation:"fadeIn .5s ease"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.green,display:"inline-block"}}/>
            LIVE · 26 sources · 20 countries · 6 platforms
          </div>
          <h1 style={{fontSize:"clamp(32px,5vw,50px)",fontWeight:800,letterSpacing:"-.03em",lineHeight:1.1,
            marginBottom:"10px",animation:"slideUp .5s ease both"}}>
            Open Data{" "}
            <span style={{background:"linear-gradient(135deg,#2563eb,#38bdf8)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Universe</span>
          </h1>
          <p style={{color:C.textMid,fontSize:"14.5px",lineHeight:1.6,maxWidth:"440px",margin:"0 auto",
            animation:"slideUp .5s .08s ease both"}}>
            Search millions of open datasets across government portals, research platforms and international organisations.
          </p>
        </header>

        {/* ── Search bar ── */}
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"5px",
          display:"flex",gap:"5px",animation:"slideUp .5s .12s ease both",boxShadow:`0 0 40px #1d4ed810`}}>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&doSearch(query,activeSources)}
            placeholder="Search datasets — e.g. climate change, poverty, GDP, COVID-19…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",
              color:C.text,fontSize:"14.5px",fontFamily:"'Sora',sans-serif",padding:"11px 12px"}}/>
          {query&&<button onClick={()=>{setQuery("");setResults([]);setSearched(false);inputRef.current?.focus();}}
            style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:"16px",padding:"0 5px"}}>✕</button>}
          <button onClick={()=>doSearch(query,activeSources)}
            style={{background:`linear-gradient(135deg,${C.accentSoft},${C.accent})`,border:"none",borderRadius:"9px",
              color:"#fff",fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:"13.5px",
              padding:"11px 20px",cursor:"pointer",whiteSpace:"nowrap"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>Search ⌕</button>
        </div>

        {/* Query mode indicator — shows when typing multi-word queries */}
        {query.trim().split(/\s+/).filter(Boolean).length >= 2 && (
          <div style={{marginTop:"6px",padding:"5px 12px",background:"#071520",
            border:"1px solid #1a3a5a",borderRadius:"8px",fontSize:"11px",
            color:"#3a7aaa",fontFamily:"'JetBrains Mono',monospace",
            display:"flex",alignItems:"center",gap:"6px",animation:"fadeIn .2s ease"}}>
            <span style={{color:"#2563eb"}}>⌖</span>
            Phrase search: <span style={{color:"#7bb8e8",fontStyle:"italic"}}>"{query.trim()}"</span>
            <span style={{color:"#1e3a5f",marginLeft:"4px"}}>· {query.trim().split(/\s+/).filter(Boolean).length} words</span>
          </div>
        )}

        {/* Quick chips */}
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"10px",animation:"slideUp .5s .16s ease both"}}>
          {["climate","COVID-19","GDP","population","agriculture","energy","education","health","poverty","trade"].map(s=>(
            <button key={s} onClick={()=>setQuery(s)}
              style={{background:"#070f1c",border:`1px solid ${C.border}`,borderRadius:"20px",
                padding:"3px 11px",fontSize:"11px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color="#7bb8e8";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim;}}>{s}</button>
          ))}
        </div>

        {/* ── Filter Panel ── */}
        <div style={{background:"#070f1c",border:`1px solid ${C.border}`,borderRadius:"14px",
          padding:"16px",marginTop:"14px",animation:"slideUp .5s .2s ease both"}}>

          {/* Panel header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
            <div style={{display:"flex",gap:"3px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"9px",padding:"3px"}}>
              {[{id:"countries",label:"🗺 Countries"},{id:"platforms",label:"⚡ Platforms"}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding:"5px 14px",borderRadius:"6px",border:"none",cursor:"pointer",
                  fontSize:"12px",fontWeight:600,fontFamily:"'Sora',sans-serif",transition:"all .14s",
                  background: tab===t.id ? C.accent : "transparent",
                  color: tab===t.id ? "#fff" : C.textMid,
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              {totalSelected > 0 && (
                <>
                  <span style={{fontSize:"11px",color:C.textMid,fontFamily:"'JetBrains Mono',monospace"}}>
                    <span style={{color:"#7bb8e8",fontWeight:700}}>{totalSelected}</span> selected
                  </span>
                  <button onClick={clearAll} style={{background:"none",border:`1px solid ${C.border}`,
                    borderRadius:"6px",color:C.textDim,fontSize:"11px",padding:"3px 8px",cursor:"pointer",
                    fontFamily:"'JetBrains Mono',monospace"}}>Clear all</button>
                </>
              )}
              {isWorldwide && (
                <span style={{fontSize:"11px",color:C.green,fontFamily:"'JetBrains Mono',monospace",
                  background:"#052010",border:"1px solid #0a3020",borderRadius:"6px",padding:"3px 8px"}}>
                  🌐 Worldwide
                </span>
              )}
            </div>
          </div>

          {/* Countries tab */}
          {tab === "countries" && (
            <>
              {/* Country search input */}
              <div style={{position:"relative",marginBottom:"10px"}}>
                <span style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",
                  fontSize:"13px",color:C.textDim,pointerEvents:"none"}}>🔍</span>
                <input
                  value={countrySearch}
                  onChange={e=>{setCountrySearch(e.target.value); setRegionFilter("All");}}
                  placeholder="Type country or region name… e.g. Europe, Japan, Africa"
                  style={{width:"100%",background:C.surface,border:`1px solid ${countrySearch?C.accent:C.border}`,
                    borderRadius:"8px",padding:"7px 32px 7px 30px",fontSize:"12.5px",
                    color:C.text,fontFamily:"'Sora',sans-serif",outline:"none",
                    transition:"border-color .15s"}}
                  onFocus={e=>e.target.style.borderColor=C.accent}
                  onBlur={e=>e.target.style.borderColor=countrySearch?C.accent:C.border}
                />
                {countrySearch && (
                  <button onClick={()=>setCountrySearch("")}
                    style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:"14px",padding:"0 2px"}}>
                    ✕
                  </button>
                )}
              </div>

              {/* Region pills — hidden when typing */}
              {!countrySearch && (
                <div style={{display:"flex",gap:"5px",marginBottom:"10px",flexWrap:"wrap"}}>
                  {["All",...REGIONS].map(r=>(
                    <button key={r} onClick={()=>setRegionFilter(r)} style={{
                      padding:"3px 10px",borderRadius:"20px",
                      border:`1px solid ${regionFilter===r?C.accent:C.border}`,
                      background: regionFilter===r ? "#0f2a50" : "transparent",
                      color: regionFilter===r ? "#7bb8e8" : C.textDim,
                      fontSize:"11px",fontFamily:"'Sora',sans-serif",cursor:"pointer",transition:"all .13s",
                    }}>{r}</button>
                  ))}
                </div>
              )}

              {/* Country grid */}
              {filteredCountries.length > 0 ? (
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {filteredCountries.map(c=>(
                    <CheckPill key={c.code} active={selCountries.includes(c.code)}
                      onClick={()=>toggleCountry(c.code)} flag={c.flag} label={c.label}/>
                  ))}
                </div>
              ) : (
                <div style={{padding:"12px 0",fontSize:"12px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>
                  No countries match "<span style={{color:"#7bb8e8"}}>{countrySearch}</span>"
                </div>
              )}

              {/* Status hint */}
              <div style={{marginTop:"10px",fontSize:"10.5px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>
                {selCountries.length === 0
                  ? `Showing ${filteredCountries.length} of ${COUNTRIES.length} countries — none selected = worldwide`
                  : `Selected: ${selCountries.map(c=>COUNTRIES.find(x=>x.code===c)?.flag||c).join(" ")}`}
              </div>
            </>
          )}

          {/* Platforms tab */}
          {tab === "platforms" && (
            <>
              {/* Platform search input */}
              <div style={{position:"relative",marginBottom:"10px"}}>
                <span style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",
                  fontSize:"13px",color:C.textDim,pointerEvents:"none"}}>🔍</span>
                <input
                  value={platformSearch}
                  onChange={e=>{setPlatformSearch(e.target.value); setPlatformCat("All");}}
                  placeholder="Search platforms… e.g. health, economics, AI"
                  style={{width:"100%",background:C.surface,border:`1px solid ${platformSearch?C.accent:C.border}`,
                    borderRadius:"8px",padding:"7px 32px 7px 30px",fontSize:"12.5px",
                    color:C.text,fontFamily:"'Sora',sans-serif",outline:"none",
                    transition:"border-color .15s"}}
                />
                {platformSearch && (
                  <button onClick={()=>setPlatformSearch("")}
                    style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:"14px"}}>
                    ✕
                  </button>
                )}
              </div>

              {/* Category pills */}
              {!platformSearch && (
                <div style={{display:"flex",gap:"5px",marginBottom:"10px",flexWrap:"wrap"}}>
                  {PLATFORM_CATS.map(c=>(
                    <button key={c} onClick={()=>setPlatformCat(c)} style={{
                      padding:"3px 10px",borderRadius:"20px",
                      border:`1px solid ${platformCat===c?C.accent:C.border}`,
                      background: platformCat===c ? "#0f2a50" : "transparent",
                      color: platformCat===c ? "#7bb8e8" : C.textDim,
                      fontSize:"11px",fontFamily:"'Sora',sans-serif",cursor:"pointer",transition:"all .13s",
                    }}>{c}</button>
                  ))}
                </div>
              )}

              {/* Platform grid */}
              {filteredPlatforms.length > 0 ? (
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {filteredPlatforms.map(p=>(
                    <button key={p.code} onClick={()=>togglePlatform(p.code)} style={{
                      display:"flex",flexDirection:"column",alignItems:"flex-start",
                      padding:"12px 14px",borderRadius:"10px",cursor:"pointer",transition:"all .14s",
                      minWidth:"140px",flex:"1 1 140px",maxWidth:"180px",border:"none",
                      background: selPlatforms.includes(p.code) ? "#0e2545" : C.surface,
                      outline: `2px solid ${selPlatforms.includes(p.code) ? C.accent : C.border}`,
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>
                        <span style={{fontSize:"18px"}}>{p.flag}</span>
                        <span style={{fontSize:"9px",background:"#0a1a30",border:`1px solid ${C.border}`,
                          borderRadius:"4px",padding:"1px 5px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>
                          {p.cat}
                        </span>
                      </div>
                      <div style={{fontSize:"12px",fontWeight:700,fontFamily:"'Sora',sans-serif",
                        color:selPlatforms.includes(p.code)?"#9ecfef":C.textMid,marginBottom:"2px"}}>{p.label}</div>
                      <div style={{fontSize:"9.5px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace",
                        lineHeight:1.3}}>{p.desc}</div>
                      {selPlatforms.includes(p.code) && (
                        <div style={{marginTop:"5px",fontSize:"9px",color:C.accent,fontWeight:700}}>✓ Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{padding:"12px 0",fontSize:"12px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>
                  No platforms match "<span style={{color:"#7bb8e8"}}>{platformSearch}</span>"
                </div>
              )}

              <div style={{marginTop:"10px",fontSize:"10.5px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>
                {selPlatforms.length === 0
                  ? `Showing ${filteredPlatforms.length} of ${PLATFORMS.length} platforms — none selected = worldwide`
                  : `Selected: ${selPlatforms.map(p=>PLATFORMS.find(x=>x.code===p)?.flag||p).join(" ")}`}
              </div>
            </>
          )}
        </div>

        {/* ── Results ── */}
        <div style={{marginTop:"24px"}}>

          {/* Stats bar */}
          {searched && !loading && results.length > 0 && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:"14px",animation:"fadeIn .3s ease"}}>
              <div style={{fontSize:"12px",color:C.textMid,fontFamily:"'JetBrains Mono',monospace"}}>
                <span style={{color:"#7bb8e8",fontWeight:700}}>{results.length}</span> datasets
                {" · "}{isWorldwide ? "🌐 Worldwide" : activeSources.map(s=>{
                  const c=COUNTRIES.find(x=>x.code===s); const p=PLATFORMS.find(x=>x.code===s);
                  return (c||p)?.flag||s;
                }).join(" ")}
              </div>
              <div style={{fontSize:"10.5px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>"{query}"</div>
            </div>
          )}

          {error && (
            <div style={{background:"#180808",border:"1px solid #7f1d1d",borderRadius:"10px",
              padding:"16px",color:"#fca5a5",fontSize:"13px",animation:"fadeIn .3s ease"}}>⚠ {error}</div>
          )}

          {loading && <Shimmer/>}

          {/* Grouped results */}
          {!loading && results.length > 0 && grouped && (
            <div style={{animation:"fadeIn .3s ease"}}>
              {Object.entries(grouped).map(([src,{flag,items}])=>(
                <div key={src}>
                  <SectionHeader flag={flag} label={src} count={items.length}/>
                  <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                    {items.map((item,i)=><DatasetCard key={item.id} item={item} idx={i}/>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Flat list */}
          {!loading && results.length > 0 && !grouped && (
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {results.map((item,i)=><DatasetCard key={item.id} item={item} idx={i}/>)}
            </div>
          )}

          {/* Empty */}
          {!loading && searched && results.length === 0 && !error && (
            <div style={{textAlign:"center",padding:"50px 20px",animation:"fadeIn .3s ease"}}>
              <div style={{fontSize:"42px",marginBottom:"12px"}}>🔍</div>
              <div style={{color:C.textMid,fontSize:"14px",marginBottom:"5px"}}>
                No datasets found for "<span style={{color:"#7bb8e8"}}>{query}</span>"
              </div>
              <div style={{color:C.textDim,fontSize:"11.5px"}}>Try a broader term, or deselect filters to search worldwide</div>
            </div>
          )}

          {/* Landing */}
          {!loading && !searched && !error && (
            <div style={{textAlign:"center",padding:"50px 20px",animation:"fadeIn .5s .28s ease both"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",
                maxWidth:"500px",margin:"0 auto 24px"}}>
                {[{n:"20",l:"Countries"},{n:"6",l:"Platforms"},{n:"10M+",l:"Datasets"},{n:"Free",l:"Open access"}].map(s=>(
                  <div key={s.n} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"10px",padding:"16px 8px"}}>
                    <div style={{fontSize:"18px",fontWeight:700,color:C.accent,marginBottom:"3px"}}>{s.n}</div>
                    <div style={{fontSize:"10px",color:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <p style={{color:C.textDim,fontSize:"11.5px"}}>
                Select countries or platforms above, then type a topic to search
              </p>
            </div>
          )}
        </div>

        <footer style={{marginTop:"56px",textAlign:"center",fontSize:"10px",color:C.textDim,
          fontFamily:"'JetBrains Mono',monospace",borderTop:`1px solid ${C.dim}`,paddingTop:"20px",lineHeight:2}}>
          🇺🇸 data.gov · 🇬🇧 data.gov.uk · 🇨🇦 open.canada.ca · 🇦🇺 data.gov.au · 🇳🇿 data.govt.nz<br/>
          🇪🇺 data.europa.eu · 🇩🇪 govdata.de · 🇫🇷 data.gouv.fr · 🇳🇱 data.overheid.nl · 🇮🇹 dati.gov.it · 🇪🇸 datos.gob.es<br/>
          🇧🇷 dados.gov.br · 🇲🇽 datos.gob.mx · 🇦🇷 datos.gob.ar · 🇮🇳 data.gov.in · 🇯🇵 data.go.jp · 🇸🇬 data.gov.sg · 🇵🇰 data.gov.pk<br/>
          🇿🇦 data.gov.za · 🇰🇪 opendata.go.ke · 🌍 World Bank · 🤗 Hugging Face · 🔬 Zenodo · 📊 Kaggle · 🎓 Harvard Dataverse · 🏥 WHO
        </footer>
      </div>
    </>
  );
}
