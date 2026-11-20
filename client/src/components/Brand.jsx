import { Recycle } from 'lucide-react';
export default function Brand({ light = false, compact = false }) {
  return <span className={`brand-mark ${light ? 'brand-light' : ''}`}>
    <span className="brand-symbol"><Recycle size={compact ? 18 : 21} strokeWidth={2.25}/></span>
    <span className="brand-word">t’wwasteful<span className="brand-dot">.</span>{!compact && <small>INDUSTRIAL CIRCULAR MARKET</small>}</span>
  </span>;
}
