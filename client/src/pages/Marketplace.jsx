import { useEffect, useState } from 'react';
import { ArrowUpRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import { api } from '../api';

const categories=['Semua','Plastik','Kertas','Logam','Kayu','Tekstil'];
export default function Marketplace(){
  const [params,setParams]=useSearchParams();
  const [search,setSearch]=useState(params.get('q')||'');
  const [category,setCategory]=useState(params.get('category')||'Semua');
  const [city,setCity]=useState(''); const [sort,setSort]=useState('newest');
  const [listings,setListings]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{setSearch(params.get('q')||'');setCategory(params.get('category')||'Semua');},[params]);
  useEffect(()=>{let alive=true;setLoading(true);const p=new URLSearchParams({q:search,category,city,sort});api(`/listings?${p}`).then(r=>{if(alive)setListings(r.listings)}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[search,category,city,sort]);
  return <><Navbar/><main className="market-page"><div className="page-container"><div className="market-breadcrumb">HOME <span>/</span> MARKETPLACE</div><div className="market-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>THE RESOURCE DIRECTORY</div><h1>Temukan material<br/><em>untuk produksi berikutnya.</em></h1><p>Jelajahi material sisa produksi dari perusahaan dan industri di sekitar Indonesia.</p></div><div className="market-count"><strong>{listings.length.toString().padStart(2,'0')}</strong><span>LISTING<br/>TERSEDIA</span></div></div>
    <div className="market-search-row"><div className="market-search"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari material, kategori, atau nama perusahaan..."/>{search&&<button onClick={()=>setSearch('')}><X size={16}/></button>}</div><div className="market-selects"><label><Filter size={15}/><select value={city} onChange={e=>setCity(e.target.value)}><option value="">Semua lokasi</option><option>Karawang</option><option>Bekasi</option><option>Cikarang</option></select></label><label><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Terbaru</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option></select></label></div></div>
    <div className="filter-row"><div className="filter-label">KATEGORI MATERIAL</div><div className="category-filters">{categories.map(cat=><button key={cat} onClick={()=>setCategory(cat)} className={category===cat?'filter-chip selected':'filter-chip'}>{cat}</button>)}</div></div>
    <div className="market-result-head"><span>Menampilkan <strong>{listings.length} material</strong></span><span>HARGA DALAM RUPIAH / KG</span></div>
    {loading?<div className="loading-grid">{[1,2,3,4].map(i=><div className="loading-card" key={i}/>)}</div>:error?<div className="empty-market">{error}</div>:listings.length?<div className="listing-grid market-listing-grid">{listings.map(item=><ListingCard item={item} key={item.id}/>)}</div>:<div className="empty-market"><Search size={30}/><h3>Material belum ditemukan</h3><p>Coba ubah kata kunci, kategori, atau lokasi pencarian.</p><button className="button-outline" onClick={()=>{setSearch('');setCity('');setCategory('Semua')}}>Hapus semua filter</button></div>}
    <div className="market-bottom-note"><span>01 — RESOURCE MATCHING</span><p>Menemukan material yang tepat dimulai dari informasi yang jelas.</p><ArrowUpRight size={17}/></div>
  </div></main><Footer/></>;
}
