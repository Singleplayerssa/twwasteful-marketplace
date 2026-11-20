import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ListingDetail from './pages/ListingDetail';
import Sell from './pages/Sell';
import Dashboard from './pages/Dashboard';
import { Login, Register } from './pages/AuthPages';

function ScrollToTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[pathname]);return null;}
export default function App(){return <><ScrollToTop/><Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/marketplace" element={<Marketplace/>}/>
  <Route path="/listing/:id" element={<ListingDetail/>}/>
  <Route path="/sell" element={<Sell/>}/>
  <Route path="/dashboard" element={<Dashboard/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/register" element={<Register/>}/>
  <Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></>}
