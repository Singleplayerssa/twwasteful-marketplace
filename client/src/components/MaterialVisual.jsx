import { Boxes, FileText, Layers3, Package, Recycle, Shapes } from 'lucide-react';
const themes = {
  Plastik: { bg:'visual-plastic', Icon:Package, label:'POLYMER / PLASTIK' },
  Kertas: { bg:'visual-paper', Icon:FileText, label:'PAPER / KEMASAN' },
  Logam: { bg:'visual-metal', Icon:Shapes, label:'METAL / LOGAM' },
  Kayu: { bg:'visual-wood', Icon:Layers3, label:'WOOD / KAYU' },
  Tekstil: { bg:'visual-textile', Icon:Boxes, label:'TEXTILE / KAIN' }
};
export default function MaterialVisual({ category = 'Material', large = false }) {
  const theme = themes[category] || { bg:'visual-default',Icon:Recycle,label:'RECOVERED MATERIAL' };
  const Icon = theme.Icon;
  return <div className={`material-visual ${theme.bg} ${large?'material-visual-large':''}`}>
    <div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
    <span className="visual-kicker">{theme.label}</span>
    <div className="visual-icon"><Icon size={large?70:54} strokeWidth={1.2}/></div>
    <span className="visual-stamp">SECOND<br/>VALUE</span>
  </div>;
}
