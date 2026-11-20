import { ArrowUpRight, MapPin, ShieldCheck, Weight } from 'lucide-react';
import { Link } from 'react-router-dom';
import MaterialVisual from './MaterialVisual';
import { money, number } from '../api';
export default function ListingCard({ item }) {
  return <Link to={`/listing/${item.id}`} className="listing-card">
    <div className="listing-image-wrap">{item.image_path ? <img className="listing-photo" src={item.image_path} alt={item.title} loading="lazy"/> : <MaterialVisual category={item.category}/> }<span className="listing-category">{item.category}</span><span className="listing-arrow"><ArrowUpRight size={17}/></span></div>
    <div className="listing-content">
      <div className="listing-company-row"><span>{item.company_name}</span>{item.verification_status==='verified' && <ShieldCheck size={14} className="verified-icon"/>}</div>
      <h3>{item.title}</h3>
      <p className="listing-spec">{item.material}</p>
      <div className="listing-meta"><span><MapPin size={13}/>{item.city}</span><span><Weight size={13}/>{number(item.quantity_kg)} kg tersedia</span></div>
      <div className="listing-bottom"><div><strong>{money(item.price_per_kg)}</strong><small>/ kg</small></div><span className="min-order">Min. {number(item.min_order_kg)} kg</span></div>
    </div>
  </Link>;
}
