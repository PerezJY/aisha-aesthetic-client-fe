import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Clock3, Menu, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import beautyWoman from '../assets/img/beauty.png';
import { getServices } from '../api/services.api';
import { API_BASE_URL } from '../api/client';
import { getCurrentUser, getRoleDestination } from '../utils/auth';
import type { Service } from '../types';

function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = getCurrentUser();
  const primaryDestination = currentUser ? getRoleDestination(currentUser) : '/signup';

  useEffect(() => {
    let active = true;
    getServices()
      .then((data) => {
        if (!active) return;
        setServices((Array.isArray(data) ? data : []).filter((item) => item.status === 'active'));
      })
      .catch(() => { if (active) setError('Our treatment menu is temporarily unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const getImageUrl = (image?: string | null) => {
    if (!image) return beautyWoman;
    if (image.startsWith('http') || image.startsWith('data:')) return image;
    return `${API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
  };

  const featuredServices = useMemo(() => services.slice(0, 6), [services]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf9] text-[#4b343b]">
      <header className="sticky top-0 z-40 border-b border-[#f3e4e7]/80 bg-[#fffaf9]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2" aria-label="AishaEsthetics home">
            <BrandLogo className="h-10 w-10" /><span className="font-serif text-lg font-semibold tracking-wide">AishaEsthetics</span>
          </Link>
          <nav className={`absolute left-4 right-4 top-[72px] flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-5 shadow-[0_18px_45px_rgba(164,100,121,0.18)] transition duration-300 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none ${menuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100'}`}>
            <a href="#services" onClick={() => setMenuOpen(false)} className="text-sm text-[#80656d] hover:text-[#d77992]">Services</a>
            <a href="#why-us" onClick={() => setMenuOpen(false)} className="text-sm text-[#80656d] hover:text-[#d77992]">Why Aisha</a>
            <Link to="/signin" className="text-sm font-semibold text-[#80656d] hover:text-[#d77992]">Log in</Link>
            <Link to="/signup" className="rounded-full bg-[#d77992] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-[#c96882]">Create account</Link>
          </nav>
          <button type="button" className="rounded-lg p-2 md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:pb-28">
          <div className="relative z-10">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#b88a2c]"><Sparkles size={15} /> Beauty, aesthetics & wellness</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] text-[#4b343b] sm:text-6xl lg:text-7xl">Your glow, <em className="font-normal text-[#d77992]">beautifully yours</em> </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#80656d] sm:text-lg">Take a moment for yourself. You deserve to glow</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to={primaryDestination} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d77992] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-pink-200 transition hover:-translate-y-1 hover:bg-[#c96882]">{currentUser ? 'Go to your dashboard' : 'Book your experience'} <ArrowRight size={17} /></Link><a href="#services" className="inline-flex items-center justify-center rounded-full border border-[#e6c5cc] px-6 py-3.5 text-sm font-bold text-[#a9687d] transition hover:bg-white">Explore services</a></div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold text-[#92737c]"><span className="flex items-center gap-2"><Check size={15} className="text-[#b88a2c]" />Quality Services</span><span className="flex items-center gap-2"><Check size={15} className="text-[#b88a2c]" />Gentle Care</span><span className="flex items-center gap-2"><Check size={15} className="text-[#b88a2c]" />Easy booking</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-xl motion-safe:animate-[landing-float_6s_ease-in-out_infinite] lg:max-w-none"><div className="absolute -inset-5 motion-safe:animate-[landing-glow_6s_ease-in-out_infinite] rounded-[3rem] bg-[#f8dce3] blur-2xl" /><span className="absolute -right-3 top-10 h-7 w-7 rounded-full bg-[#e7c67b]/70 shadow-lg motion-safe:animate-[landing-float_5s_ease-in-out_infinite]" aria-hidden="true" /><span className="absolute -bottom-3 left-8 h-4 w-4 rounded-full bg-[#d77992]/50 shadow-md motion-safe:animate-[landing-float_7s_ease-in-out_infinite]" aria-hidden="true" /><div className="group relative aspect-[0.92] overflow-hidden rounded-[2.5rem] border-8 border-white bg-[#f8dce3] shadow-[0_28px_70px_rgba(164,100,121,0.28)] transition duration-500 hover:shadow-[0_34px_85px_rgba(164,100,121,0.38)]"><img src={beautyWoman} alt="Relaxing beauty treatment at AishaEsthetics" className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.025]" /><div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-lg backdrop-blur-md"><p className="font-serif text-lg">A softer kind of confidence.</p><p className="mt-1 text-xs text-[#92737c]">Your ritual starts here.</p></div></div></div>
        </section>

        <section id="why-us" className="border-y border-[#f3e4e7] bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3 sm:px-8 lg:px-10"><div className="landing-reveal rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:bg-[#fff8fa] hover:shadow-lg"><p className="font-serif text-2xl">01</p><h2 className="mt-2 font-semibold">Beautiful results</h2><p className="mt-2 text-sm leading-6 text-[#92737c]">Quality treatments designed to help you glow</p></div><div className="landing-reveal rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:bg-[#fff8fa] hover:shadow-lg [animation-delay:120ms]"><p className="font-serif text-2xl">02</p><h2 className="mt-2 font-semibold">Glow with confidence</h2><p className="mt-2 text-sm leading-6 text-[#92737c]">Feel refreshed, cared for, and beautifully you</p></div><div className="landing-reveal rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:bg-[#fff8fa] hover:shadow-lg [animation-delay:240ms]"><p className="font-serif text-2xl">03</p><h2 className="mt-2 font-semibold">Your time, your glow</h2><p className="mt-2 text-sm leading-6 text-[#92737c]">Book easily and keep your beauty journey in one place.</p></div></div></section>

        <section id="services" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b88a2c]">The treatment menu</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Find what makes you glow</h2></div><Link to={primaryDestination} className="text-sm font-bold text-[#d77992] hover:underline">Book an appointment <ArrowRight className="ml-1 inline" size={15} /></Link></div>
          {loading && <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-[#f7e8ec]" />)}</div>}
          {!loading && error && <p className="mt-10 rounded-2xl bg-white p-8 text-center text-sm text-[#92737c]">{error}</p>}
          {!loading && !error && featuredServices.length === 0 && <p className="mt-10 rounded-2xl bg-white p-8 text-center text-sm text-[#92737c]">No services are available right now. Please check back soon.</p>}
          {!loading && !error && featuredServices.length > 0 && <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredServices.map((service, index) => <article key={service.id} style={{ animationDelay: `${index * 100}ms` }} className="landing-reveal group landing-shimmer overflow-hidden rounded-3xl border border-[#f2e1e5] bg-white shadow-[0_10px_30px_rgba(164,100,121,0.08)] transition duration-300 hover:-translate-y-2 hover:border-[#e9c4ce] hover:shadow-[0_22px_45px_rgba(164,100,121,0.18)]"><div className="aspect-[1.35] overflow-hidden bg-[#f8e8ec]"><img src={getImageUrl(service.image)} alt={service.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /></div><div className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider text-[#b88a2c]">{service.category || 'Aesthetic care'}</p><span className="text-sm font-bold text-[#4b343b]">₱{Number(service.price || 0).toLocaleString()}</span></div><h3 className="mt-3 font-serif text-2xl">{service.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#92737c]">{service.description}</p>{service.duration && <p className="mt-4 flex items-center gap-1.5 text-xs text-[#92737c]"><Clock3 size={14} /> {service.duration}</p>}<Link to={primaryDestination} className="group/link mt-5 inline-flex items-center text-sm font-bold text-[#d77992]">Reserve this ritual <ArrowRight size={15} className="ml-1 transition-transform group-hover/link:translate-x-1" /></Link></div></article>)}</div>}
        </section>

        <section className="mx-5 mb-16 overflow-hidden rounded-[2rem] bg-[#4b343b] px-6 py-14 text-center text-white sm:mx-8 sm:px-10 lg:mx-auto lg:max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e7c67b]">A little time for you</p><h2 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">Reveal the best version of yourself</h2><Link to={primaryDestination} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#a9687d] transition hover:bg-[#fff2f4]">Start your journey <ArrowRight size={17} /></Link></section>
      </main>
      <footer className="border-t border-[#f3e4e7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          
          <p className="text-xs text-[#92737c]">
            Beauty • Aesthetics • Wellness
          </p>

        </div>
      </footer>
          </div>
  );
}

export default LandingPage;
