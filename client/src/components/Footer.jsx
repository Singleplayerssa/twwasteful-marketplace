import { ArrowUpRight, Instagram, Linkedin, Mail } from 'lucide-react';
import Brand from './Brand';
export default function Footer(){return <footer className="site-footer">
  <div className="footer-main"><div className="footer-brand-col"><Brand light/><p>Mengubah sisa produksi menjadi sumber daya baru. Menghubungkan industri untuk masa depan yang lebih sirkular.</p><div className="social-links"><a href="/#about"><Mail size={16}/></a><a href="#linkedin"><Linkedin size={16}/></a><a href="#instagram"><Instagram size={16}/></a></div></div>
    <div className="footer-links"><div><strong>Platform</strong><a href="/marketplace">Jelajahi material</a><a href="/sell">Jual material</a><a href="/#how-it-works">Cara kerja</a></div><div><strong>Perusahaan</strong><a href="/#about">Tentang kami</a><a href="/#about">Hubungi kami</a><a href="/login">Akun perusahaan</a></div><div className="footer-note"><span>BUILT FOR A CIRCULAR FUTURE</span><h3>Waste is not<br/><em>the end.</em></h3><a href="/marketplace">Mulai menjelajah <ArrowUpRight size={15}/></a></div></div>
  </div><div className="footer-bottom"><span>© 2026 T’wwasteful. All materials have a second value.</span><span>Karawang, Indonesia <i>·</i> Made for industry</span></div>
</footer>}
