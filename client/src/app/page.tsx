'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '../../public/svg/logo.svg';

export default function Home() {
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 8);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealEls = document.querySelectorAll('.reveal');
    let io: IntersectionObserver | null = null;
    if (reduceMotion) {
      revealEls.forEach(el => el.classList.add('in-view'));
    } else {
      io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(el => io?.observe(el));
    }

    const bars = document.querySelectorAll('.prog-fill');
    const barIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.width = el.dataset.width + '%';
          barIo.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(b => barIo.observe(b));

    return () => {
      if (io) io.disconnect();
      barIo.disconnect();
    };
  }, []);

  const toggleNav = () => {
    if (linksRef.current) {
      const showing = linksRef.current.style.display === 'flex';
      linksRef.current.style.display = showing ? 'none' : 'flex';
      if (!showing) {
        linksRef.current.style.position = 'absolute';
        linksRef.current.style.top = '100%';
        linksRef.current.style.left = '0';
        linksRef.current.style.right = '0';
        linksRef.current.style.background = 'var(--paper)';
        linksRef.current.style.flexDirection = 'column';
        linksRef.current.style.padding = '20px 32px';
        linksRef.current.style.borderBottom = '1px solid var(--line)';
        linksRef.current.style.gap = '16px';
      } else {
        linksRef.current.style.cssText = '';
      }
    }
  };

  return (
    <div className="landing-wrapper" id="top">
      <style dangerouslySetInnerHTML={{
        __html: `
        html { scroll-behavior: smooth; }
        .blob { border-radius: 62% 38% 55% 45% / 45% 55% 40% 60%; }
        .annotate { position:relative; display:inline-block; font-style:italic; z-index:0; }
        .annotate .highlight {
          position:absolute; left:-8px; right:-8px; top:22%; bottom:6%;
          background:var(--color-mint); z-index:-1; transform:rotate(-1.6deg);
          border-radius:3px 8px 3px 8px;
        }
        .annotate svg { position:absolute; left:-14px; right:-14px; top:-18px; bottom:-14px; width:calc(100% + 28px); height:calc(100% + 32px); pointer-events:none; }
        .annotate path {
          fill:none; stroke:var(--color-ink); stroke-width:3.5; stroke-linecap:round; stroke-linejoin:round;
          stroke-dasharray:340; stroke-dashoffset:340;
          animation:draw 1.1s cubic-bezier(.4,0,.2,1) forwards .5s;
        }
        @keyframes draw { to { stroke-dashoffset:0; } }

        .tape {
          position:absolute; width:86px; height:30px; top:-16px;
          background:repeating-linear-gradient(45deg, var(--color-mint), var(--color-mint) 6px, var(--color-mint-deep) 6px, var(--color-mint-deep) 12px);
          opacity:.9; box-shadow:0 2px 6px rgba(14,59,44,0.08);
        }
        .tape.left { left:36px; transform:rotate(-8deg); }
        .tape.right { right:40px; transform:rotate(7deg); }

        .reveal { opacity:0; transform:translateY(18px); transition:opacity .7s ease, transform .7s ease; }
        .reveal.in-view { opacity:1; transform:translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .reveal { opacity:1; transform:none; transition:none; }
          .annotate path { animation:none; stroke-dashoffset:0; }
        }
      `}} />

      <style dangerouslySetInnerHTML={{ __html: `
        nav.scrolled .nav-pill {
          padding-top: 8px;
          padding-bottom: 8px;
          box-shadow: 0 8px 32px -8px rgba(14,59,44,0.22), 0 0 0 1.5px rgba(14,59,44,0.10);
        }
        .nav-link-dot { width: 5px; height: 5px; border-radius: 50%; background: #CFEBDA; display: inline-block; margin-right: 6px; opacity: 0; transition: opacity .15s; }
        .nav-link:hover .nav-link-dot, .nav-link.active .nav-link-dot { opacity: 1; }
      `}} />

      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300" ref={navRef}>
        <div className="nav-pill w-full max-w-[780px] flex items-center justify-between gap-4 bg-ink/90 backdrop-blur-xl rounded-full px-5 py-3.5 transition-all duration-300 shadow-[0_4px_24px_-8px_rgba(14,59,44,0.3),0_0_0_1px_rgba(255,255,255,0.08)]">

          {/* Logo */}
          <a className="flex items-center gap-2 font-display font-bold text-[17px] text-white shrink-0" href="#top">
            <span className="w-7 h-7 bg-mint rounded-full flex items-center justify-center shrink-0">
              <Image src={Logo} width={18} height={18} alt="Talkit Logo" />
            </span>
            Talkit
          </a>

          {/* Center nav links */}
          <ul className="hidden md:flex items-center gap-1" ref={linksRef}>
            <li>
              <a href="#how" className="nav-link flex items-center px-4 py-1.5 rounded-full text-[13.5px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150">
                <span className="nav-link-dot"></span>Features
              </a>
            </li>
            <li>
              <a href="#about" className="nav-link flex items-center px-4 py-1.5 rounded-full text-[13.5px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150">
                <span className="nav-link-dot"></span>About
              </a>
            </li>
            <li>
              <a href="#ask" className="nav-link flex items-center px-4 py-1.5 rounded-full text-[13.5px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150">
                <span className="nav-link-dot"></span>Contact
              </a>
            </li>
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-mint/15 text-mint text-[11.5px] font-mono font-semibold px-3 py-1 rounded-full border border-mint/20">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></span>
              500+ live
            </span>
            <a className="text-[13.5px] font-semibold text-white/70 hover:text-white transition-colors cursor-pointer px-3 py-1.5" onClick={() => router.push('/login')}>Sign In</a>
            <button
              className="inline-flex items-center gap-1.5 bg-mint text-ink text-[13.5px] font-bold px-4 py-2 rounded-full transition-all duration-150 hover:bg-mint-deep hover:scale-[1.03] active:scale-95"
              onClick={() => router.push('/register')}
            >
              Get started
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#0E3B2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {/* Mobile hamburger */}
            <button className="md:hidden p-1.5 text-white/70 hover:text-white" aria-label="Menu" onClick={toggleNav}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          </div>

        </div>
      </nav>

      {/* Spacer so hero doesn't hide under fixed nav */}
      <div className="h-20"></div>


      <section className="pt-20 pb-10 overflow-hidden">
        <div className="max-w-[760px] mx-auto px-8 text-center reveal w-full">
          <span className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.08em] uppercase text-ink-soft font-semibold before:content-[''] before:w-4 before:h-[1.5px] before:bg-mint-deep before:inline-block">Stuck happens. Staying stuck doesn't have to</span>
          <h1 className="text-[clamp(40px,6vw,68px)] leading-[1.06] tracking-[-0.02em] my-5 font-display font-semibold text-ink">Get <span className="annotate"><span className="highlight"></span>unstuck<svg viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M10,38 C4,14 46,-4 108,6 C162,14 172,42 132,52 C78,66 12,58 10,38 Z" /></svg></span><br />one question at a time.</h1>
          <p className="text-lg text-text-muted max-w-[560px] mx-auto">Skip the endless Googling and the forum thread that died in 2019. Ask a real question, get matched with someone who actually knows the answer, and talk it through live.</p>
          <div className="flex items-center justify-center gap-3.5 my-8 flex-wrap">
            <button className="group inline-flex items-center gap-2 px-6 py-[13px] rounded-sm font-bold text-[15px] border-[1.5px] border-transparent transition-all duration-150 bg-ink text-white shadow-landing hover:bg-ink-deep hover:-translate-y-0.5" onClick={() => router.push('/register')}>Ask a question <span className="transition-transform duration-150 group-hover:translate-x-[3px]">→</span></button>
            <a className="group inline-flex items-center gap-2 px-6 py-[13px] rounded-sm font-bold text-[15px] border-[1.5px] transition-all duration-150 bg-white text-ink border-line hover:border-ink hover:-translate-y-0.5" href="#how">See how it works</a>
          </div>
          <div className="flex items-center justify-center gap-5 flex-wrap font-mono text-[12.5px] text-text-muted">
            <span className="flex items-center gap-2">500+ active learners</span>
            <span className="w-1 h-1 rounded-full bg-mint-deep"></span>
            <span className="flex items-center gap-2">Matched in under 30s</span>
            <span className="w-1 h-1 rounded-full bg-mint-deep"></span>
            <span className="flex items-center gap-2">Free to start</span>
          </div>
        </div>

        <div className="max-w-[1180px] mx-auto px-8 w-full mt-16 flex justify-center relative reveal">
          <div className="relative w-[min(920px,100%)] -rotate-[1.1deg]">
            <div className="tape left"></div>
            <div className="tape right"></div>
            <Image
              src="/0.png"
              alt="Talkit app screenshot"
              width={920}
              height={580}
              className="w-full h-auto rounded-sm shadow-landing border border-line block"
              priority
            />
          </div>
        </div>
      </section>

      <section className="py-24 max-md:py-16" id="how">
        <div className="max-w-[1180px] mx-auto px-8 w-full text-center">
          <div className="reveal">
            <span className="inline-flex items-center justify-center gap-2 font-mono text-[12px] tracking-[.08em] uppercase text-ink-soft font-semibold before:content-[''] before:w-4 before:h-[1.5px] before:bg-mint-deep before:inline-block">How it works</span>
            <h2 className="text-[clamp(28px,3.6vw,40px)] mt-4 font-display font-semibold text-ink">Three steps to getting unstuck</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-9 mt-16 max-w-[320px] md:max-w-none mx-auto reveal">
            <div className="relative pt-3.5 group">
              <div className="absolute inset-[14px_10px_0_10px] bg-mint rounded-sm -rotate-3 z-0 transition-transform duration-200"></div>
              <div className="relative z-10 bg-white border border-line rounded-sm p-7 px-6 text-center shadow-landing rotate-1 transition-transform duration-200 group-hover:rotate-0 group-hover:-translate-y-1">
                <span className="font-mono text-mint-deep text-[13px] font-semibold">01</span>
                <div className="w-14 h-14 bg-ink my-3.5 mx-auto mb-4 flex items-center justify-center blob"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.67 4.67 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" stroke="#F4F9F6" strokeWidth="1.6" strokeLinejoin="round" /><path d="M20 5.5C20 4.67 19.33 4 18.5 4H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" stroke="#F4F9F6" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                <h3 className="text-lg mb-2 font-display font-semibold text-ink">Post your question</h3>
                <p className="text-[14px] text-text-muted">Describe what's tripping you up. Add tags, code, whatever gives context.</p>
              </div>
            </div>
            <div className="relative pt-3.5 group">
              <div className="absolute inset-[14px_10px_0_10px] bg-mint rounded-sm -rotate-3 z-0 transition-transform duration-200"></div>
              <div className="relative z-10 bg-white border border-line rounded-sm p-7 px-6 text-center shadow-landing rotate-1 transition-transform duration-200 group-hover:rotate-0 group-hover:-translate-y-1">
                <span className="font-mono text-mint-deep text-[13px] font-semibold">02</span>
                <div className="w-14 h-14 bg-ink my-3.5 mx-auto mb-4 flex items-center justify-center blob"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="#F4F9F6" strokeWidth="1.6" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#F4F9F6" strokeWidth="1.6" strokeLinecap="round" /><circle cx="17" cy="8" r="2.4" stroke="#F4F9F6" strokeWidth="1.6" /><path d="M15.5 14c2.5.2 4.5 2 4.5 5" stroke="#F4F9F6" strokeWidth="1.6" strokeLinecap="round" /></svg></div>
                <h3 className="text-lg mb-2 font-display font-semibold text-ink">Get matched</h3>
                <p className="text-[14px] text-text-muted">Our matching engine pairs you with a helper who knows the topic, fast.</p>
              </div>
            </div>
            <div className="relative pt-3.5 group">
              <div className="absolute inset-[14px_10px_0_10px] bg-mint rounded-sm -rotate-3 z-0 transition-transform duration-200"></div>
              <div className="relative z-10 bg-white border border-line rounded-sm p-7 px-6 text-center shadow-landing rotate-1 transition-transform duration-200 group-hover:rotate-0 group-hover:-translate-y-1">
                <span className="font-mono text-mint-deep text-[13px] font-semibold">03</span>
                <div className="w-14 h-14 bg-ink my-3.5 mx-auto mb-4 flex items-center justify-center blob"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="#F4F9F6" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                <h3 className="text-lg mb-2 font-display font-semibold text-ink">Learn, live</h3>
                <p className="text-[14px] text-text-muted">Jump into live chat. Ask follow-ups, share code, actually get it.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 max-md:py-16">
        <div className="max-w-[1180px] mx-auto px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-16 items-center mt-5">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.08em] uppercase text-ink-soft font-semibold before:content-[''] before:w-4 before:h-[1.5px] before:bg-mint-deep before:inline-block">What you get</span>
            <h2 className="text-[clamp(28px,3.4vw,38px)] leading-[1.15] my-4 font-display font-semibold text-ink">The tools that keep you moving</h2>
            <p className="text-text-muted text-[16px] mb-7 max-w-[440px]">Everything you need to actually track your progress, built into every session.</p>
            <div className="flex gap-4 mb-5.5">
              <div className="w-10.5 h-10.5 bg-mint shrink-0 flex items-center justify-center blob"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 20V10m6.5 10V4m6.5 16v-7" stroke="#0E3B2C" strokeWidth="1.7" strokeLinecap="round" /></svg></div>
              <div><h4 className="font-body font-bold text-[15.5px] text-ink mb-1">Topic progress tracker</h4><p className="text-[13.5px] text-text-muted">See how confident you're really getting in React, Python, or Data Structures.</p></div>
            </div>
            <div className="flex gap-4 mb-5.5">
              <div className="w-10.5 h-10.5 bg-mint shrink-0 flex items-center justify-center blob"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5a5 5 0 0 0-5 5v3.5L5 17h14l-2-3.5V10a5 5 0 0 0-5-5Z" stroke="#0E3B2C" strokeWidth="1.7" strokeLinejoin="round" /><path d="M10 20a2 2 0 0 0 4 0" stroke="#0E3B2C" strokeWidth="1.7" strokeLinecap="round" /></svg></div>
              <div><h4 className="font-body font-bold text-[15.5px] text-ink mb-1">Smart notifications</h4><p className="text-[13.5px] text-text-muted">Know the moment a helper joins or replies, so you're never left hanging.</p></div>
            </div>
            <a className="font-bold text-[14.5px] text-ink-soft inline-flex items-center gap-1.5 mt-4 group" href="#">Explore the platform <span className="transition-transform duration-150 group-hover:translate-x-1">→</span></a>
          </div>
          <div className="relative bg-white border border-line rounded-[16px_6px_16px_6px] p-8 shadow-landing overflow-hidden reveal before:content-[''] before:absolute before:w-[180px] before:h-[180px] before:bg-mint before:rounded-[62%_38%_55%_45%/45%_55%_40%_60%] before:-top-[70px] before:-right-[70px] before:opacity-60 before:blur-[2px]">
            <div className="relative mb-5">
              <div className="flex justify-between text-[13.5px] font-semibold text-ink mb-2"><span>React Hooks</span><b className="font-mono font-semibold text-ink-soft">85%</b></div>
              <div className="h-[9px] rounded-full bg-paper overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-ink-soft to-mint-deep w-0 transition-[width] duration-[1100ms] ease-[cubic-bezier(.4,0,.2,1)] prog-fill" data-width="85"></div></div>
            </div>
            <div className="relative mb-5">
              <div className="flex justify-between text-[13.5px] font-semibold text-ink mb-2"><span>Async / Await</span><b className="font-mono font-semibold text-ink-soft">60%</b></div>
              <div className="h-[9px] rounded-full bg-paper overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-ink-soft to-mint-deep w-0 transition-[width] duration-[1100ms] ease-[cubic-bezier(.4,0,.2,1)] prog-fill" data-width="60"></div></div>
            </div>
            <div className="relative">
              <div className="flex justify-between text-[13.5px] font-semibold text-ink mb-2"><span>Data Structures</span><b className="font-mono font-semibold text-ink-soft">45%</b></div>
              <div className="h-[9px] rounded-full bg-paper overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-ink-soft to-mint-deep w-0 transition-[width] duration-[1100ms] ease-[cubic-bezier(.4,0,.2,1)] prog-fill" data-width="45"></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink text-white py-24 max-md:py-16" id="about">
        <div className="max-w-[1180px] mx-auto px-8 w-full">
          <div className="flex justify-between items-end gap-10 flex-wrap mb-13 reveal">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[.08em] uppercase text-mint font-semibold before:content-[''] before:w-4 before:h-[1.5px] before:bg-mint before:inline-block">What's inside</span>
              <h2 className="text-white text-[clamp(30px,3.6vw,42px)] leading-[1.15] my-3.5 max-w-[480px] font-display font-semibold">Support that actually feels human</h2>
              <p className="text-cream-muted text-[16px] max-w-[420px]">Every question turns into a real conversation, kept in one place so you never lose track of what you've learned.</p>
              <a className="font-bold text-[14.5px] text-mint inline-flex items-center gap-1.5 mt-4 group" href="#">View more <span className="transition-transform duration-150 group-hover:translate-x-1">→</span></a>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-sm p-7 transition-transform duration-200 hover:-translate-y-1 reveal">
              <div className="w-11 h-11 flex items-center justify-center mb-4.5 bg-mint blob"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.67 16 4 15.33 4 14.5v-9Z" stroke="#0E3B2C" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
              <h3 className="text-lg mb-2 font-display font-semibold text-ink">Live chat sessions</h3>
              <p className="text-[14px] text-text-muted">Ask questions and get unstuck instantly with real-time, guided conversation.</p>
            </div>
            <div className="bg-ink-soft border border-white/10 rounded-sm p-7 transition-transform duration-200 hover:-translate-y-1 reveal">
              <div className="w-11 h-11 flex items-center justify-center mb-4.5 bg-mint blob"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19V5m6 14v-9m6 9V9" stroke="#0E3B2C" strokeWidth="1.7" strokeLinecap="round" /></svg></div>
              <h3 className="text-lg mb-2 font-display font-semibold text-white">Personal dashboard</h3>
              <p className="text-[14px] text-cream-muted">Track what you've asked, learned, and how you're improving over time.</p>
            </div>
            <div className="bg-ink-soft border border-white/10 rounded-sm p-7 transition-transform duration-200 hover:-translate-y-1 reveal">
              <div className="w-11 h-11 flex items-center justify-center mb-4.5 bg-mint blob"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3v4M12 17v4M5 12H3m18 0h-2M6.5 6.5l-1.5-1.5m14.5 1.5 1.5-1.5M6.5 17.5l-1.5 1.5m14.5-1.5 1.5 1.5" stroke="#0E3B2C" strokeWidth="1.6" strokeLinecap="round" /><circle cx="12" cy="12" r="4" stroke="#0E3B2C" strokeWidth="1.6" /></svg></div>
              <h3 className="text-lg mb-2 font-display font-semibold text-white">AI collaboration</h3>
              <p className="text-[14px] text-cream-muted">AI helps guide things along, but real humans give the nuanced answers.</p>
            </div>
            <div className="bg-white rounded-sm p-7 transition-transform duration-200 hover:-translate-y-1 reveal">
              <div className="w-11 h-11 flex items-center justify-center mb-4.5 bg-mint blob"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" stroke="#0E3B2C" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
              <h3 className="text-lg mb-2 font-display font-semibold text-ink">Instant matching</h3>
              <p className="text-[14px] text-text-muted">Get paired with a qualified helper right after you submit your question.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 max-md:py-16">
        <div className="max-w-[1180px] mx-auto px-8 w-full reveal">
          <div className="bg-ink rounded-sm p-16 px-12 text-center shadow-landing">
            <div className="font-display italic text-[64px] text-mint leading-none mb-2">&ldquo;</div>
            <p className="font-display text-[clamp(21px,2.6vw,29px)] leading-[1.45] text-white max-w-[720px] mx-auto mb-7">I was stuck on a recursive problem for 3 hours. Posted it on Talkit and had a helper walk me through it in 15 minutes — a genuine lifesaver for self-taught developers.</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10.5 h-10.5 rounded-full bg-mint text-ink font-mono font-bold text-[13px] flex items-center justify-center">AK</div>
              <div className="text-left">
                <div className="font-bold text-[14.5px] text-white">Abdi K.</div>
                <div className="text-[12.5px] text-cream-muted">Full-stack developer, Addis Ababa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 max-md:py-16" id="ask">
        <div className="max-w-[1180px] mx-auto px-8 w-full text-center">
          <div className="reveal">
            <span className="inline-flex items-center justify-center gap-2 font-mono text-[12px] tracking-[.08em] uppercase text-ink-soft font-semibold before:content-[''] before:w-4 before:h-[1.5px] before:bg-mint-deep before:inline-block">Contact us</span>
            <h2 className="text-[clamp(28px,3.6vw,40px)] mt-4 font-display font-semibold text-ink">We'd love to hear from you</h2>
          </div>
        </div>
        <div className="max-w-[1180px] mx-auto px-8 w-full grid grid-cols-1 md:grid-cols-3 gap-4.5 my-12 mb-19 reveal">
          <div className="rounded-sm p-5.5 px-6 flex gap-3.5 items-start bg-white border border-line">
            <div className="w-10 h-10 bg-ink shrink-0 flex items-center justify-center blob"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2C10.5 21 3 13.5 3 6a2 2 0 0 1 2-2Z" stroke="#F4F9F6" strokeWidth="1.5" strokeLinejoin="round" /></svg></div>
            <div><div className="font-mono text-[11px] uppercase tracking-[.06em] text-text-muted mb-1">Call us</div><div className="font-bold text-ink text-[15px]">+251 11 178 9089</div></div>
          </div>
          <div className="rounded-sm p-5.5 px-6 flex gap-3.5 items-start bg-mint border border-transparent">
            <div className="w-10 h-10 bg-ink shrink-0 flex items-center justify-center blob"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="#F4F9F6" strokeWidth="1.5" strokeLinejoin="round" /><path d="m4 7 8 6 8-6" stroke="#F4F9F6" strokeWidth="1.5" /></svg></div>
            <div><div className="font-mono text-[11px] uppercase tracking-[.06em] text-text-muted mb-1">Email us</div><div className="font-bold text-ink text-[15px]">sudeisfed@gmail.com</div></div>
          </div>
          <div className="rounded-sm p-5.5 px-6 flex gap-3.5 items-start bg-white border border-line">
            <div className="w-10 h-10 bg-ink shrink-0 flex items-center justify-center blob"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" stroke="#F4F9F6" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.2" stroke="#F4F9F6" strokeWidth="1.5" /></svg></div>
            <div><div className="font-mono text-[11px] uppercase tracking-[.06em] text-text-muted mb-1">Headquarters</div><div className="font-bold text-ink text-[15px]">Addis Ababa, Ethiopia</div></div>
          </div>
        </div>

        <div className="max-w-[1180px] mx-auto px-8 w-full grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-9 md:gap-15 items-center reveal">
          <div>
            <span className="inline-block font-mono text-[11.5px] bg-mint text-ink py-1.5 px-3.5 rounded-full mb-4">Our success story</span>
            <h2 className="text-[clamp(26px,3.2vw,34px)] leading-[1.2] mb-3.5 font-display font-semibold text-ink">Let's work together</h2>
            <p className="text-text-muted text-[15.5px] max-w-[400px]">Share your improvements, features, or feedback. We're building this in the open, so tell us what's working and what isn't.</p>
          </div>
          <div className="bg-white border border-line rounded-sm p-8 shadow-landing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
              <div className="mb-3.5"><label className="text-[12px] font-bold text-ink block mb-1.5">First name</label><input type="text" placeholder="Sude" className="w-full border-[1.5px] border-line bg-paper rounded-[10px] py-2.5 px-3.5 font-body text-[14px] text-text-body transition-colors duration-150 focus:border-ink focus:outline-none" /></div>
              <div className="mb-3.5"><label className="text-[12px] font-bold text-ink block mb-1.5">Last name</label><input type="text" placeholder="Fedlu" className="w-full border-[1.5px] border-line bg-paper rounded-[10px] py-2.5 px-3.5 font-body text-[14px] text-text-body transition-colors duration-150 focus:border-ink focus:outline-none" /></div>
            </div>
            <div className="mb-3.5"><label className="text-[12px] font-bold text-ink block mb-1.5">Email</label><input type="email" placeholder="you@example.com" className="w-full border-[1.5px] border-line bg-paper rounded-[10px] py-2.5 px-3.5 font-body text-[14px] text-text-body transition-colors duration-150 focus:border-ink focus:outline-none" /></div>
            <div className="mb-3.5"><label className="text-[12px] font-bold text-ink block mb-1.5">Subject</label><input type="text" placeholder="What's this about?" className="w-full border-[1.5px] border-line bg-paper rounded-[10px] py-2.5 px-3.5 font-body text-[14px] text-text-body transition-colors duration-150 focus:border-ink focus:outline-none" /></div>
            <div className="mb-3.5"><label className="text-[12px] font-bold text-ink block mb-1.5">Message</label><textarea placeholder="Tell us about your feedback, ideas, improvements..." className="w-full border-[1.5px] border-line bg-paper rounded-[10px] py-2.5 px-3.5 font-body text-[14px] text-text-body transition-colors duration-150 focus:border-ink focus:outline-none resize-y min-h-[90px]"></textarea></div>
            <button className="group w-full flex items-center justify-center gap-2 mt-1.5 px-6 py-[13px] rounded-sm font-bold text-[15px] border-[1.5px] border-transparent transition-all duration-150 bg-ink text-white shadow-landing hover:bg-ink-deep hover:-translate-y-0.5" type="button">Send it over <span className="transition-transform duration-150 group-hover:translate-x-[3px]">→</span></button>
          </div>
        </div>
      </section>

      <footer className="bg-ink-deep text-cream-muted py-10">
        <div className="max-w-[1180px] mx-auto px-8 w-full flex flex-col md:flex-row justify-between items-center flex-wrap gap-4.5 text-center md:text-left">
          <div>
            <div className="flex items-center gap-2.5 text-white font-display font-bold text-xl justify-center md:justify-start">
              <Image src={Logo} width={34} height={34} alt="Talkit Logo" />
              Talkit Platform
            </div>
          </div>
          <div className="font-display italic text-[13.5px] text-cream-muted">"The right question, asked at the right time, can change everything."</div>
          <div className="flex gap-5 text-[13px] font-semibold text-cream-muted flex-wrap justify-center">
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-white transition-colors" href="#">Help Center</a>
            <a className="hover:text-white transition-colors" href="#">Contact Us</a>
          </div>
        </div>
        <div className="max-w-[1180px] mx-auto px-8 w-full mt-5 text-center md:text-left">
          <div className="font-mono text-[11.5px] text-[#6E9481]">© 2026 Talkit. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
