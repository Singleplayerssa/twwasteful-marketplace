import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, Factory, Leaf, PackageCheck, Search, ShieldCheck, Sparkles, Truck, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import { api } from '../api';

const categories = [
  {name:'Plastik',en:'Plastic & polymer',count:'Jelajahi material',symbol:'01'},
  {name:'Kertas',en:'Paper & packaging',count:'Jelajahi material',symbol:'02'},
  {name:'Logam',en:'Metal & machining',count:'Jelajahi material',symbol:'03'},
  {name:'Kayu',en:'Wood & furniture',count:'Jelajahi material',symbol:'04'},
  {name:'Tekstil',en:'Textile & garment',count:'Jelajahi material',symbol:'05'}
];
export default function Home(){
  const [listings,setListings] = useState([]); const [apiError,setApiError] = useState(''); const [query,setQuery] = useState(''); const navigate=useNavigate();
  useEffect(()=>{api('/listings?limit=4').then(r=>setListings(Array.isArray(r.listings)?r.listings:[])).catch(e=>setApiError(e.message));},[]);
  function search(e){e.preventDefault();navigate(`/marketplace${query?`?q=${encodeURIComponent(query)}`:''}`);}
  return <><Navbar/>
    <main>
      <section className="hero-section">
        <div className="hero-grain"/><div className="hero-inner page-container">
          <div className="hero-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-line"/>INDUSTRIAL CIRCULAR MARKETPLACE</div>
            <h1>Give waste<br/>a <em>second value.</em></h1>
            <p className="hero-description">Sisa produksi satu pabrik bisa menjadi bahan baku berharga bagi pabrik lainnya. Temukan, tawarkan, dan manfaatkan kembali melalui satu ekosistem.</p>
            <form className="hero-search" onSubmit={search}><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari plastik, logam, kertas, dan lainnya..."/><button type="submit">Cari material <ArrowUpRight size={16}/></button></form>
            <div className="hero-trust"><span><ShieldCheck size={15}/> Perusahaan terkurasi</span><span><PackageCheck size={15}/> Material terstruktur</span><span><Leaf size={15}/> Ekonomi sirkular</span></div>
          </div>
          <div className="hero-art" aria-label="Ilustrasi material sirkular"><div className="hero-art-top"><span>RESOURCE LOOP / 001</span><span>EST. 2026</span></div><div className="hero-art-center"><div className="hero-ring ring-outer"/><div className="hero-ring ring-middle"/><div className="hero-ring ring-inner"><Leaf size={74} strokeWidth={1}/></div><span className="ring-label label-top">RECOVER</span><span className="ring-label label-right">REUSE</span><span className="ring-label label-bottom">REVALUE</span><span className="ring-label label-left">RECONNECT</span></div><div className="hero-art-bottom"><span>FROM SURPLUS</span><ArrowDownRight size={17}/><span>TO NEW SUPPLY</span></div><div className="hero-floating-card"><span className="floating-icon"><Sparkles size={18}/></span><div><strong>Material, not waste.</strong><small>One industry's surplus.<br/>Another industry's resource.</small></div></div></div>
        </div>
        <div className="hero-bottom-strip"><div className="page-container strip-inner"><span>AN INDUSTRIAL EXCHANGE PLATFORM</span><span className="strip-dot"/><span>BUILT FOR A MORE RESOURCEFUL FUTURE</span><span className="strip-end">01 — 05</span></div></div>
      </section>

      <section className="section intro-section" id="about"><div className="page-container intro-grid"><div><div className="eyebrow"><span className="eyebrow-line"/>THE IDEA</div><h2>Yang tersisa<br/>bukan berarti <em>tak bernilai.</em></h2></div><div className="intro-copy"><p>Setiap proses produksi menghasilkan material berlebih. Di satu tempat, material itu menjadi beban penyimpanan. Di tempat lain, material serupa justru dibutuhkan sebagai bahan baku.</p><p>T’wwasteful mempertemukan keduanya melalui marketplace B2B yang lebih terstruktur, transparan, dan mudah dijangkau.</p><Link className="text-link" to="/marketplace">Jelajahi marketplace <ArrowUpRight size={16}/></Link></div></div></section>

      <section className="stats-band"><div className="page-container stats-grid"><div className="stats-intro"><span>WHY CIRCULAR?</span><strong>Nilai baru<br/>dari yang tersisa.</strong></div><div className="stat-item"><strong>01</strong><span>Temukan material<br/>yang dibutuhkan</span></div><div className="stat-item"><strong>02</strong><span>Hubungkan pabrik<br/>secara langsung</span></div><div className="stat-item"><strong>03</strong><span>Manfaatkan sumber daya<br/>dengan lebih efisien</span></div></div></section>

      <section className="section category-section"><div className="page-container"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>EXPLORE BY CATEGORY</div><h2>Material untuk<br/><em>putaran berikutnya.</em></h2></div><Link className="text-link" to="/marketplace">Lihat semua material <ArrowUpRight size={16}/></Link></div>
        <div className="category-grid">{categories.map((c,i)=><Link to={`/marketplace?category=${encodeURIComponent(c.name)}`} className={`category-tile category-tile-${i+1}`} key={c.name}><span className="category-number">{c.symbol}</span><div><span>{c.en}</span><h3>{c.name}</h3><small>{c.count}</small></div><ArrowUpRight size={18} className="category-arrow"/></Link>)}</div>
      </div></section>

      <section className="section listings-section"><div className="page-container"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>AVAILABLE ON THE MARKET</div><h2>Material pilihan<br/><em>untuk produksimu.</em></h2></div><Link className="text-link" to="/marketplace">Jelajahi semua listing <ArrowUpRight size={16}/></Link></div>
        <div className="listing-grid">{listings.length?listings.map(item=><ListingCard item={item} key={item.id}/>):<div className="empty-market"><PackageCheck size={28}/><p>{apiError || 'Listing material akan ditampilkan di sini.'}</p></div>}</div>
      </div></section>

      <section className="how-section" id="how-it-works"><div className="page-container"><div className="how-header"><div><div className="eyebrow eyebrow-light"><span className="eyebrow-line"/>HOW IT WORKS</div><h2>Sederhana untuk<br/><em>dimulai bersama.</em></h2></div><p>Ruang kerja digital yang menghubungkan dua kebutuhan industri: melepas sisa produksi dan menemukan material yang tepat.</p></div>
        <div className="steps-grid"><div className="step-card"><span>01 / JOIN</span><Factory size={28}/><h3>Daftarkan perusahaan</h3><p>Buat profil bisnis dan lengkapi data perusahaan agar mitra dapat mengenal usahamu.</p></div><div className="step-card"><span>02 / DISCOVER</span><Search size={28}/><h3>Temukan atau tawarkan</h3><p>Unggah material sisa produksi atau cari bahan yang sesuai dengan kebutuhan pabrik.</p></div><div className="step-card"><span>03 / CONNECT</span><WalletCards size={28}/><h3>Ajukan penawaran</h3><p>Sepakati volume dan harga melalui alur penawaran yang tercatat di platform.</p></div><div className="step-card"><span>04 / REUSE</span><Truck size={28}/><h3>Atur pengambilan</h3><p>Konfirmasi pembayaran dan koordinasikan pengambilan material antarperusahaan.</p></div></div>
      </div></section>

      <section className="cta-section"><div className="page-container cta-panel"><div><div className="eyebrow"><span className="eyebrow-line"/>YOUR NEXT RESOURCE IS HERE</div><h2>Mulai dari material<br/>yang <em>tersedia.</em></h2></div><div className="cta-right"><p>Jadilah bagian dari rantai pasok industri yang lebih efisien. Buat akun perusahaan dan temukan peluang baru dari material sisa produksi.</p><Link to="/register" className="button-dark">Daftarkan perusahaan <ArrowUpRight size={17}/></Link></div><div className="cta-pattern">t’</div></div></section>
    </main><Footer/></>;
}
