import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  ArrowRight, Search, Leaf, Plus, LogIn, LogOut, UserRound, Package, MapPin, X,
  ImagePlus, Recycle, Menu, LoaderCircle, Boxes, Building2, ChevronDown, Sprout,
  Heart, SlidersHorizontal, Sparkles, ArrowUpDown, ShieldCheck, Globe2, CheckCircle2
} from 'lucide-react';

const money = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0));
const categories = ['Semua kategori', 'Plastik', 'Logam', 'Kertas', 'Tekstil', 'Kayu', 'Lainnya'];
const demo = [
  { id:'sample-1', title:'Sisa potongan plastik PP', category:'Plastik', description:'Potongan PP bersih dari proses produksi kemasan. Kondisi kering dan sudah dipilah.', quantity:450, unit:'kg', price:6800, location:'Karawang, Jawa Barat', company_name:'PT Sirkular Polimer', image_url:'', is_demo:true },
  { id:'sample-2', title:'Scrap aluminium produksi', category:'Logam', description:'Sisa lembaran aluminium dari proses pemotongan, siap untuk didaur ulang.', quantity:220, unit:'kg', price:24500, location:'Bekasi, Jawa Barat', company_name:'CV Metal Kembali', image_url:'', is_demo:true },
  { id:'sample-3', title:'Kardus dan kertas kraft', category:'Kertas', description:'Kardus bekas kemasan industri, bersih, kering, dan dikumpulkan dalam satu lot.', quantity:800, unit:'kg', price:3200, location:'Bandung, Jawa Barat', company_name:'PT Kertas Lestari', image_url:'', is_demo:true },
  { id:'sample-4', title:'Palet kayu bekas layak pakai', category:'Kayu', description:'Palet kayu bekas yang masih kokoh. Cocok untuk penggunaan ulang atau pengolahan.', quantity:75, unit:'pcs', price:18000, location:'Purwakarta, Jawa Barat', company_name:'Industri Kayu Satu', image_url:'', is_demo:true }
];

function Brand(){return <a className="brand" href="#top"><span className="brand-icon"><Recycle size={19}/></span><span>T’wwasteful<small>INDUSTRIAL CIRCULAR MARKET</small></span></a>}

function AuthModal({mode,setMode,onClose,onAuth,busy,error}) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [company,setCompany]=useState('');
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal auth-modal"><button className="icon-btn close" onClick={onClose}><X/></button><div className="eyebrow"><span className="eyebrow-mark"/> MEMBER ACCESS</div><h2>{mode==='login'?'Selamat datang kembali':'Bangun koneksi industri baru'}</h2><p className="muted">{mode==='login'?'Masuk untuk mengelola listing dan menjelajahi peluang material.':'Daftarkan perusahaan dan mulai terhubung dengan ekosistem sirkular.'}</p>
    <form onSubmit={e=>{e.preventDefault();onAuth({email,password,company});}}>
      {mode==='register'&&<label>Nama perusahaan<input required value={company} onChange={e=>setCompany(e.target.value)} placeholder="Contoh: PT Industri Sejahtera"/></label>}
      <label>Email perusahaan<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@perusahaan.com"/></label>
      <label>Password<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter"/></label>
      {error&&<div className="error">{error}</div>}
      <button className="btn primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:null}{mode==='login'?'Masuk ke akun':'Buat akun perusahaan'}<ArrowRight size={16}/></button>
    </form>
    <p className="switch-auth">{mode==='login'?'Belum punya akun?':'Sudah terdaftar?'} <button onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Daftar sekarang':'Masuk'}</button></p>
  </section></div>
}

function ListingModal({onClose,onSave,busy,error}) {
  const [form,setForm]=useState({title:'',category:'Plastik',description:'',quantity:'',unit:'kg',price:'',location:''});
  const [file,setFile]=useState(null);
  const update=(k,v)=>setForm(p=>({...p,[k]:v}));
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal listing-modal"><button className="icon-btn close" onClick={onClose}><X/></button><div className="eyebrow"><span className="eyebrow-mark"/> PUBLISH MATERIAL</div><h2>Ubah sisa menjadi peluang.</h2><p className="muted">Beri informasi yang jelas agar calon mitra dapat menemukan materialmu.</p>
    <form onSubmit={e=>{e.preventDefault();onSave(form,file);}}>
      <label>Nama material<input required value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Contoh: Sisa potongan plastik PP"/></label>
      <div className="form-grid"><label>Kategori<select value={form.category} onChange={e=>update('category',e.target.value)}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>Lokasi<input required value={form.location} onChange={e=>update('location',e.target.value)} placeholder="Kota, Provinsi"/></label></div>
      <label>Deskripsi<textarea required rows="3" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Jelaskan kondisi, jenis, dan kualitas material..."/></label>
      <div className="form-grid"><label>Jumlah<input required type="number" min="0.01" step="0.01" value={form.quantity} onChange={e=>update('quantity',e.target.value)} placeholder="500"/></label><label>Satuan<select value={form.unit} onChange={e=>update('unit',e.target.value)}><option>kg</option><option>ton</option><option>pcs</option><option>karung</option></select></label></div>
      <label>Harga per satuan (Rp)<input required type="number" min="0" value={form.price} onChange={e=>update('price',e.target.value)} placeholder="5000"/></label>
      <label className="upload"><ImagePlus size={19}/><span>{file?file.name:'Tambah foto material (opsional)'}</span><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      {error&&<div className="error">{error}</div>}
      <button className="btn primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<Plus size={17}/>}Publikasikan listing<ArrowRight size={15}/></button>
    </form>
  </section></div>
}

function ProductCard({item,onOpen,saved,onSave}) {
  return <article className="product-card">
    <button className="product-open" onClick={()=>onOpen(item)} aria-label={`Lihat ${item.title}`}>
      <div className={`product-image ${item.category?.toLowerCase()}`}>{item.image_url?<img src={item.image_url} alt={item.title}/>:<div className="material-placeholder"><Boxes size={43}/><span>{item.category?.toUpperCase()||'MATERIAL'}</span></div>}<span className="category-tag">{item.category}</span><span className="image-corner"><ArrowUpDown size={13}/> MATERIAL LOT</span></div>
      <div className="product-body"><div className="product-company"><Building2 size={13}/>{item.company_name||'Perusahaan anggota'}</div><h3>{item.title}</h3><div className="product-location"><MapPin size={13}/>{item.location}</div><div className="product-bottom"><div><strong>{money(item.price)}</strong><small>/ {item.unit}</small></div><span className="quantity">{Number(item.quantity).toLocaleString('id-ID')} {item.unit}</span></div></div>
    </button>
    <button className={`save-btn ${saved?'is-saved':''}`} onClick={()=>onSave(item.id)} aria-label={saved?'Hapus dari tersimpan':'Simpan material'}><Heart size={16} fill={saved?'currentColor':'none'}/></button>
  </article>
}

function DetailModal({item,onClose,onSave,saved}) {
  if(!item)return null;
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal detail-modal"><button className="icon-btn close" onClick={onClose}><X/></button><div className="detail-visual">{item.image_url?<img src={item.image_url} alt={item.title}/>:<div className="material-placeholder"><Boxes size={58}/><span>{item.category?.toUpperCase()}</span></div>}</div><div className="eyebrow"><span className="eyebrow-mark"/> {item.category} · MATERIAL TERSEDIA</div><h2>{item.title}</h2><div className="product-company"><Building2 size={14}/>{item.company_name}</div><p>{item.description}</p><div className="detail-facts"><div><small>Harga per {item.unit}</small><strong>{money(item.price)}</strong></div><div><small>Jumlah tersedia</small><strong>{Number(item.quantity).toLocaleString('id-ID')} {item.unit}</strong></div><div><small>Lokasi</small><strong>{item.location}</strong></div></div><div className="demo-note"><ShieldCheck size={17}/> Untuk demo, hubungi perusahaan penjual secara langsung untuk membahas material dan pengambilan.</div><button className={`btn ${saved?'outline':'primary'} full detail-save`} onClick={()=>onSave(item.id)}><Heart size={16} fill={saved?'currentColor':'none'}/>{saved?'Tersimpan':'Simpan material'}</button></section></div>
}

export default function App(){
  const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[items,setItems]=useState(demo),[loading,setLoading]=useState(true);
  const [authOpen,setAuthOpen]=useState(false),[authMode,setAuthMode]=useState('login'),[listingOpen,setListingOpen]=useState(false),[detail,setDetail]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState(''),[category,setCategory]=useState('Semua kategori'),[menuOpen,setMenuOpen]=useState(false),[notice,setNotice]=useState('');
  const [sort,setSort]=useState('newest'),[saved,setSaved]=useState([]),[savedOnly,setSavedOnly]=useState(false),[mobileOpen,setMobileOpen]=useState(false);
  useEffect(()=>{
    if(!supabase){setLoading(false);return;}
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(session?.user){setProfile({company:session.user.user_metadata?.company_name||session.user.email,email:session.user.email});}else setProfile(null);},[session]);
  async function loadItems(){
    if(!supabase){setItems(demo);return;}
    const {data,error}=await supabase.from('listings_demo').select('*').order('created_at',{ascending:false});
    if(error){setNotice('Data marketplace belum dapat dimuat: '+error.message);setItems(demo);return;}
    setItems([...(data||[]),...demo]);
  }
  useEffect(()=>{loadItems().finally(()=>setLoading(false));},[]);
  async function handleAuth(values){
    if(!supabase){setError('Supabase belum terhubung.');return;}
    setBusy(true);setError('');
    try{
      if(authMode==='register'){
        const {data,error}=await supabase.auth.signUp({email:values.email,password:values.password,options:{data:{company_name:values.company}}});
        if(error)throw error;
        if(data.session){setNotice('Akun berhasil dibuat. Selamat datang!');setAuthOpen(false);}
        else setError('Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.');
      }else{
        const {error}=await supabase.auth.signInWithPassword({email:values.email,password:values.password});
        if(error)throw error;setAuthOpen(false);setNotice('Berhasil masuk.');
      }
    }catch(e){setError(e.message||'Terjadi kesalahan.');}finally{setBusy(false);}
  }
  async function handleSave(form,file){
    if(!session){setError('Silakan masuk terlebih dahulu.');return;}
    setBusy(true);setError('');
    try{
      let image_url=null;
      if(file){
        const ext=file.name.split('.').pop();const path=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from('twwasteful-materials').upload(path,file,{upsert:false});
        if(uploadError)throw uploadError;
        const {data}=supabase.storage.from('twwasteful-materials').getPublicUrl(path);image_url=data.publicUrl;
      }
      const payload={owner_id:session.user.id,company_name:session.user.user_metadata?.company_name||session.user.email,title:form.title,category:form.category,description:form.description,quantity:Number(form.quantity),unit:form.unit,price:Number(form.price),location:form.location,image_url};
      const {error:insertError}=await supabase.from('listings_demo').insert(payload);
      if(insertError)throw insertError;
      await loadItems();setListingOpen(false);setNotice('Listing berhasil dipublikasikan dan dapat dilihat pengguna lain.');
    }catch(e){setError(e.message||'Gagal menyimpan listing.');}finally{setBusy(false);}
  }
  const filtered=useMemo(()=>{
    let result=items.filter(x=>(category==='Semua kategori'||x.category===category)&&`${x.title} ${x.company_name} ${x.location} ${x.description}`.toLowerCase().includes(query.toLowerCase()));
    if(savedOnly) result=result.filter(x=>saved.includes(x.id));
    if(sort==='price-low') result.sort((a,b)=>Number(a.price)-Number(b.price));
    if(sort==='price-high') result.sort((a,b)=>Number(b.price)-Number(a.price));
    if(sort==='quantity') result.sort((a,b)=>Number(b.quantity)-Number(a.quantity));
    return result;
  },[items,query,category,savedOnly,saved,sort]);
  const toggleSaved=id=>setSaved(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  async function logout(){await supabase?.auth.signOut();setNotice('Kamu sudah keluar dari akun.');}
  const openListing=()=>{if(!session){setAuthMode('login');setAuthOpen(true)}else setListingOpen(true);setMobileOpen(false)};
  return <div className="app-shell" id="top">
    <div className="announcement"><span><Sparkles size={13}/> INDUSTRIAL CIRCULARITY, MADE PRACTICAL</span><span>Give materials a second value <ArrowRight size={13}/></span></div>
    <header className="header"><div className="nav-wrap"><Brand/><nav><a href="#marketplace">Marketplace</a><a href="#how">Cara kerja</a><a href="#impact">Dampak</a></nav><div className="nav-right">{profile?<><button className="account-chip" onClick={()=>setMenuOpen(!menuOpen)}><span className="avatar">{(profile.company||'U').slice(0,1).toUpperCase()}</span><span>{profile.company}</span><ChevronDown size={14}/></button>{menuOpen&&<div className="account-menu"><small>{profile.email}</small><button onClick={()=>{setMenuOpen(false);setListingOpen(true)}}><Plus size={15}/> Buat listing</button><button onClick={logout}><LogOut size={15}/> Keluar</button></div>}</>:<button className="btn outline" onClick={()=>{setAuthMode('login');setAuthOpen(true)}}><LogIn size={16}/> Masuk</button>}<button className="btn primary nav-cta" onClick={openListing}><Plus size={16}/> Jual material</button></div><button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu/></button></div>
      {mobileOpen&&<div className="mobile-panel"><a href="#marketplace" onClick={()=>setMobileOpen(false)}>Marketplace</a><a href="#how" onClick={()=>setMobileOpen(false)}>Cara kerja</a><a href="#impact" onClick={()=>setMobileOpen(false)}>Dampak</a><button onClick={openListing}>+ Jual material</button></div>}
    </header>
    <main>
      <section className="hero"><div className="hero-grid"><div className="hero-copy"><div className="eyebrow light"><span className="eyebrow-mark"/> INDUSTRIAL CIRCULAR MARKETPLACE</div><h1>Waste is not<br/><em>the end of value.</em></h1><p>Material sisa bukan akhir dari proses produksi. Temukan peluang baru dengan mempertemukan industri yang memiliki surplus material dan industri yang membutuhkannya.</p><div className="hero-actions"><a className="btn cream" href="#marketplace">Jelajahi material <ArrowRight size={16}/></a><button className="btn ghost" onClick={()=>{if(!session){setAuthMode('register');setAuthOpen(true)}else setListingOpen(true)}}>Mulai menjual <Plus size={16}/></button></div><div className="hero-points"><span><Leaf size={15}/> Ekonomi sirkular</span><span><Building2 size={15}/> Antarperusahaan</span><span><ShieldCheck size={15}/> Material terpilah</span></div></div>
        <div className="hero-art"><div className="art-grid"/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orbit-core"><Recycle size={65}/></div><div className="orbit-caption top">RESOURCE / REIMAGINED</div><div className="orbit-caption bottom">MATERIAL · VALUE · CIRCULARITY</div><div className="floating-stat"><Sprout size={21}/><span><b>Keep value in motion</b><small>One industry's surplus, another's resource.</small></span></div><div className="art-index">TW / 001</div></div></div>
        <div className="hero-foot"><span>01 — DISCOVER</span><span>02 — CONNECT</span><span>03 — CIRCULATE</span></div></section>
      <section className="trust-strip" id="impact"><div><span className="strip-icon"><Globe2 size={18}/></span><span><b>Industrial network</b><small>Terhubung lintas sektor</small></span></div><div><span className="strip-icon"><Recycle size={18}/></span><span><b>Resource recovery</b><small>Memaksimalkan nilai material</small></span></div><div><span className="strip-icon"><ShieldCheck size={18}/></span><span><b>Clear information</b><small>Spesifikasi lebih transparan</small></span></div><div className="strip-note">LESS WASTE.<br/><em>MORE VALUE.</em></div></section>
      <section className="market-section" id="marketplace"><div className="section-top"><div><div className="eyebrow"><span className="eyebrow-mark"/> THE MATERIAL EXCHANGE</div><h2>Find what industry<br/><em>leaves behind.</em></h2><p>Jelajahi material yang tersedia dan temukan peluang untuk proses produksimu.</p></div><div className="market-count"><strong>{filtered.length.toString().padStart(2,'0')}</strong><small>LISTING TERSEDIA</small></div></div>
        <div className="market-controls"><div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari material, perusahaan, atau lokasi..."/>{query&&<button onClick={()=>setQuery('')} aria-label="Hapus pencarian"><X size={15}/></button>}</div><label className="sort-control"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Terbaru</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option><option value="quantity">Jumlah terbanyak</option></select></label><button className={`saved-filter ${savedOnly?'active':''}`} onClick={()=>setSavedOnly(!savedOnly)}><Heart size={15} fill={savedOnly?'currentColor':'none'}/> Tersimpan <span>{saved.length}</span></button></div>
        <div className="category-row">{categories.map(c=><button key={c} className={`category-pill ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
        {!isSupabaseConfigured&&<div className="setup-warning">Mode pratinjau: hubungkan Supabase untuk mengaktifkan login dan listing lintas perangkat. Produk contoh tetap ditampilkan.</div>}
        <div className="results-line"><span>{savedOnly?'MATERIAL TERSIMPAN':'MATERIAL EXPLORER'}</span><span>{filtered.length} hasil ditemukan</span></div>
        {loading?<div className="loading"><LoaderCircle className="spin"/> Memuat marketplace...</div>:filtered.length?<div className="product-grid">{filtered.map(item=><ProductCard key={item.id} item={item} onOpen={setDetail} saved={saved.includes(item.id)} onSave={toggleSaved}/>)}</div>:<div className="empty"><Package size={35}/><h3>{savedOnly?'Belum ada material tersimpan':'Tidak ada material yang cocok'}</h3><p>{savedOnly?'Tekan ikon hati pada kartu material untuk menyimpannya.':'Coba kata kunci atau kategori lain.'}</p><button className="btn outline" onClick={()=>{setQuery('');setCategory('Semua kategori');setSavedOnly(false)}}>Reset pencarian</button></div>}
      </section>
      <section className="how-section" id="how"><div className="how-heading"><div><div className="eyebrow"><span className="eyebrow-mark"/> SIMPLE BY DESIGN</div><h2>A better loop<br/><em>starts with a connection.</em></h2></div><p>Proses sederhana untuk mengubah material berlebih menjadi peluang kolaborasi antarindustri.</p></div><div className="steps"><article><span className="step-no">01 / REGISTER</span><div className="step-icon"><Building2/></div><h3>Daftarkan perusahaan</h3><p>Buat akun untuk mulai terhubung dengan ekosistem industri sirkular.</p><ArrowRight className="step-arrow"/></article><article><span className="step-no">02 / LIST</span><div className="step-icon"><Package/></div><h3>Publikasikan material</h3><p>Tambahkan deskripsi, jumlah, harga, lokasi, dan foto material yang tersedia.</p><ArrowRight className="step-arrow"/></article><article><span className="step-no">03 / CONNECT</span><div className="step-icon"><Recycle/></div><h3>Temukan mitra baru</h3><p>Perusahaan lain dapat menemukan listing dan menghubungi penjual.</p><ArrowRight className="step-arrow"/></article></div></section>
      <section className="closing-cta"><div><div className="eyebrow light"><span className="eyebrow-mark"/> THE NEXT CYCLE STARTS HERE</div><h2>Your surplus<br/><em>has somewhere to go.</em></h2><p>Temukan mitra yang tepat dan mulai maksimalkan nilai material industri.</p></div><button className="btn cream" onClick={openListing}>Tawarkan material <ArrowRight size={16}/></button><div className="cta-orbit"><Recycle size={110}/></div></section>
    </main><footer><Brand/><span>© 2026 T’wwasteful · Give waste a second value.</span><a href="#top">Kembali ke atas ↑</a></footer>
    {authOpen&&<AuthModal mode={authMode} setMode={m=>{setAuthMode(m);setError('')}} onClose={()=>setAuthOpen(false)} onAuth={handleAuth} busy={busy} error={error}/>}
    {listingOpen&&<ListingModal onClose={()=>{setListingOpen(false);setError('')}} onSave={handleSave} busy={busy} error={error}/>}
    {detail&&<DetailModal item={detail} onClose={()=>setDetail(null)} onSave={toggleSaved} saved={saved.includes(detail.id)}/>}
  </div>
}
