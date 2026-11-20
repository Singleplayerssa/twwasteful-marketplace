import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Menu, Search, Store, UserRound, X } from 'lucide-react';
import Brand from './Brand';
import { useAuth } from '../AuthContext';
export default function Navbar({ searchValue = '', onSearchChange }) {
  const { user, signOut } = useAuth();
  const [mobileOpen,setMobileOpen] = useState(false);
  const [profileOpen,setProfileOpen] = useState(false);
  const navigate = useNavigate();
  async function logout() { await signOut(); setProfileOpen(false); navigate('/'); }
  return <header className="site-header">
    <div className="nav-inner">
      <Link to="/" className="brand-link"><Brand/></Link>
      <nav className="desktop-nav">
        <NavLink to="/marketplace" className={({isActive})=>isActive?'nav-link active':'nav-link'}>Jelajahi material</NavLink>
        <a href="/#how-it-works" className="nav-link">Cara kerja</a>
        <a href="/#about" className="nav-link">Tentang kami</a>
      </nav>
      <div className="nav-actions">
        <Link to="/sell" className="nav-sell"><Store size={16}/> Jual material</Link>
        {user ? <div className="profile-wrap">
          <button className="avatar-button" onClick={()=>setProfileOpen(!profileOpen)}><span className="avatar-initial">{(user.name || 'U').charAt(0).toUpperCase()}</span><ChevronDown size={15}/></button>
          {profileOpen && <div className="profile-menu">
            <div className="profile-menu-head"><strong>{user.company_name || user.name}</strong><small>{user.email}</small></div>
            <Link to="/dashboard" onClick={()=>setProfileOpen(false)}>Dashboard</Link>
            <Link to="/sell" onClick={()=>setProfileOpen(false)}>Buat listing</Link>
            <button onClick={logout}>Keluar akun</button>
          </div>}
        </div> : <Link to="/login" className="nav-login">Masuk <ArrowRight size={15}/></Link>}
        <button className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Buka menu">{mobileOpen?<X/>:<Menu/>}</button>
      </div>
    </div>
    {onSearchChange && <div className="mobile-search-wrap"><div className="search-shell mobile-search"><Search size={17}/><input value={searchValue} onChange={e=>onSearchChange(e.target.value)} placeholder="Cari material, jenis limbah, perusahaan..."/><span>⌘ K</span></div></div>}
    {mobileOpen && <div className="mobile-menu"><Link to="/marketplace" onClick={()=>setMobileOpen(false)}>Jelajahi material</Link><a href="/#how-it-works" onClick={()=>setMobileOpen(false)}>Cara kerja</a><a href="/#about" onClick={()=>setMobileOpen(false)}>Tentang kami</a>{user ? <Link to="/dashboard" onClick={()=>setMobileOpen(false)}>Dashboard</Link> : <Link to="/login" onClick={()=>setMobileOpen(false)}>Masuk / Daftar</Link>}</div>}
  </header>;
}
