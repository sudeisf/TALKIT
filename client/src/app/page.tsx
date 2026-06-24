'use client';
import Image from 'next/image';
import Logo from '../../public/svg/logo.svg';
import { ArrowUpRight, MessageCircle, BarChart, Bot, Rocket, BookOpen, Bell, Phone, Mail, MapPin, Moon, Sun, Users, Zap, CheckCircle, Quote } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectThemePreference, setTheme, type ThemePreference } from '@/redux/slice/appearanceSlice';

const features = [
  { icon: MessageCircle, title: 'Live Chat Sessions', description: 'Ask questions and get unstuck instantly with guided real-time conversation.' },
  { icon: BarChart, title: 'Personal Dashboard', description: "Track what you've asked, learned, and how you're improving over time." },
  { icon: Bot, title: 'AI Collaboration', description: 'AI helps guide, but real humans give the nuanced, contextual answers.' },
  { icon: Rocket, title: 'Instant Matching', description: 'Get paired with a qualified helper right after you submit your question.' },
];

const toolsList = [
  { icon: BookOpen, title: 'Topic Progress Tracker', description: 'See how confident you are in topics like React, Python, or Data Structures.' },
  { icon: Bell, title: 'Smart Notifications', description: 'Be alerted when a helper joins your session or replies to your questions.' },
];

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectThemePreference);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const isDarkMode = theme === 'dark';
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addReveal = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      revealRefs.current.push(el);
    }
  };

  const toggleTheme = () => {
    const nextTheme: ThemePreference = isDarkMode ? 'light' : 'dark';
    dispatch(setTheme(nextTheme));
  };

  return (
    <div className="bg-[#f9f9f7] text-[#1a1c1b] min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAVBAR */}
      <nav className="w-full top-0 sticky z-50 bg-[#004a39] shadow-sm">
        <div className="flex justify-between items-center h-20 px-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <Image
              src={Logo}
              width={32}
              height={32}
              alt="Talkit Logo"
              className="brightness-0 invert"
            />
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Talkit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
            <a className="text-white/80 hover:text-white transition-colors" href="#features">Features</a>
            <a className="text-white/80 hover:text-white transition-colors" href="#about">About</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="text-white/70 hover:text-white p-1.5 rounded transition-colors hidden sm:block" aria-label="Toggle theme">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => router.push('/login')} className="hidden md:block text-sm font-semibold tracking-wide text-white/80 hover:text-white transition-colors">Sign In</button>
            <button onClick={() => router.push('/register')} className="bg-white text-[#004a39] text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-white/90 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="pt-24 pb-64 text-center px-6 relative overflow-hidden bg-[#004a39] text-white">
        <div ref={addReveal} className="max-w-4xl mx-auto relative z-10">
          <div className="inline-block bg-[#00644e] text-white text-sm font-semibold tracking-widest px-5 py-2 rounded-full mb-8">
            Ask smarter. Learn faster. Never get stuck again.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[64px] font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
            Master your learning<br />with Talkit.
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            No more endless Googling. No more waiting for forum replies. Just ask, get matched instantly, and learn through live chat — one question at a time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
            <button onClick={() => router.push('/register')} className="bg-white text-[#004a39] text-sm font-bold px-8 py-4 rounded-lg hover:bg-white/95 hover:scale-105 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
              Ask a Question &amp; Get Help <ArrowUpRight className="w-5 h-5" />
            </button>
            <button onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="border border-white/30 text-white text-sm font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-all duration-300">
              See How It Works
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> <span>500+ Active Learners</span></div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="hidden sm:flex items-center gap-1.5"><Zap className="w-4 h-4" /> <span>{"<"}30s Avg Match Time</span></div>
            <div className="hidden md:block w-px h-4 bg-white/20" />
            <div className="hidden md:flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> <span>Free to Start</span></div>
          </div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[150px]" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,115.1,188.75,102.5,234.33,92.51,277.67,73.19,321.39,56.44Z" fill="#f9f9f7" />
          </svg>
        </div>
      </header>

      {/* HERO PRODUCT SHOWCASE */}
      <div ref={addReveal} className="relative z-10 max-w-5xl mx-auto px-6 -mt-40 mb-20">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,42,30,0.3)] hover:-translate-y-2 transition-all duration-700 aspect-auto flex flex-col">
          {/* Browser Chrome */}
          <div className="bg-[#f4f4f1] border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white border border-gray-200 rounded-md h-6 max-w-sm mx-auto flex items-center justify-center text-xs text-gray-400 font-mono shadow-sm">
                talkit.app/dashboard
              </div>
            </div>
          </div>
          {/* App Screenshot */}
          <div className="w-full relative">
            <Image 
              src="/0.png" 
              alt="Talkit Dashboard Interface" 
              width={1920} 
              height={1080} 
              className="w-full h-auto object-cover object-top"
              priority
            />
            {/* Subtle Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* HOW IT WORKS - 3 Steps */}
      <section className="px-6 py-24 bg-[#f9f9f7]">
        <div className="max-w-5xl mx-auto text-center mb-16" ref={addReveal}>
          <span className="text-[#004a39] text-sm font-bold tracking-widest uppercase block mb-4">How it works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1c1b]" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Three steps to getting unstuck</h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Post Your Question', desc: 'Describe your problem with context and tags. Our system instantly categorizes it.', icon: BookOpen },
            { step: '02', title: 'Get Matched', desc: 'Our matching engine finds the perfect helper based on expertise and availability.', icon: Users },
            { step: '03', title: 'Learn Live', desc: 'Jump into a live chat session. Get answers, share code, and truly understand.', icon: MessageCircle },
          ].map((s, i) => (
            <div ref={addReveal} key={i} className="relative text-center group">
              <div className="text-6xl font-bold text-[#004a39]/[0.06] absolute -top-4 left-1/2 -translate-x-1/2" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>{s.step}</div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#004a39] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#1a1c1b] mb-2" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              {i < 2 && <div className="hidden md:block absolute top-8 -right-4 w-8 text-[#004a39]/20 text-2xl">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE TOOLS SECTION */}
      <section id="features" className="px-6 bg-[#f9f9f7] overflow-hidden py-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div ref={addReveal}>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1c1b] mb-6" style={{ fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
              The tools you get<br />with Talkit
            </h2>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              Everything you need to accelerate your learning journey, built into one seamless experience.
            </p>
            <div className="space-y-6 mb-8">
              {toolsList.map((tool, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#004a39]/10 flex items-center justify-center flex-shrink-0">
                    <tool.icon className="w-5 h-5 text-[#004a39]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1a1c1b] mb-1" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>{tool.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="#how-it-works" className="inline-flex items-center gap-2 text-[#004a39] font-semibold text-sm hover:underline transition-all">
              <ArrowUpRight className="w-4 h-4" /> Explore the Platform
            </a>
          </div>
          <div ref={addReveal} className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 aspect-[4/3] flex items-center justify-center overflow-hidden hover:scale-[1.02] transition-transform duration-500 p-8">
              <div className="w-full space-y-4">
                {['React Hooks', 'Async/Await', 'Data Structures'].map((topic, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-32">{topic}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className="bg-[#004a39] h-2.5 rounded-full transition-all duration-700" style={{ width: `${[85, 60, 45][i]}%` }} />
                    </div>
                    <span className="text-sm font-bold text-[#004a39]">{[85, 60, 45][i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section id="how-it-works" className="px-6 bg-[#004a39] text-white overflow-hidden py-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div ref={addReveal} className="lg:col-span-5">
            <p className="text-[#86d6ba] text-sm font-bold tracking-widest uppercase mb-4">How it Works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
              Discover effortless learning support
            </h2>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              Convert your questions into answers and keep them organized in one place. Never leave a developer question unanswered.
            </p>
            <button onClick={() => router.push('/register')} className="bg-white text-[#004a39] text-sm font-bold px-6 py-3 rounded-lg hover:bg-white/90 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex items-center gap-2">
              View more <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div ref={addReveal} className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className={`bg-white p-8 rounded-xl text-center shadow-lg hover:-translate-y-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 ${i % 2 === 1 ? 'md:mt-8' : ''}`}>
                <div className="w-12 h-12 mx-auto rounded-full bg-[#004a39]/10 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-[#004a39]" />
                </div>
                <h3 className="font-bold text-lg text-[#004a39] mb-2" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="px-6 py-24 bg-[#f9f9f7]">
        <div ref={addReveal} className="max-w-3xl mx-auto text-center">
          <Quote className="w-10 h-10 text-[#004a39]/20 mx-auto mb-6" />
          <blockquote className="text-xl md:text-2xl text-[#1a1c1b] font-medium leading-relaxed mb-6" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
            &ldquo;I was stuck on a recursive problem for 3 hours. Posted it on Talkit and had a helper walk me through it in 15 minutes. This platform is a game-changer for self-taught developers.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#004a39] flex items-center justify-center text-white font-bold text-sm">AK</div>
            <div className="text-left">
              <p className="font-semibold text-sm text-[#1a1c1b]">Abdi K.</p>
              <p className="text-xs text-gray-400">Full-stack Developer, Addis Ababa</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="about" className="px-6 bg-[#f4f4f1] overflow-hidden py-32">
        <div className="max-w-6xl mx-auto">
          <div ref={addReveal} className="text-center mb-16">
            <span className="text-[#004a39] text-sm font-bold tracking-widest uppercase mb-4 block">Contact Us</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1c1b]" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>We'd love to talk to you</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Phone, label: 'CALL US', value: '+25111789089' },
              { icon: Mail, label: 'EMAIL US', value: 'sudeisfed@gmail.com' },
              { icon: MapPin, label: 'HEADQUARTERS', value: 'Addis Abeba, Ethiopia' },
            ].map((c, i) => (
              <div ref={addReveal} key={i} className="bg-white p-8 rounded-xl border border-gray-200 flex items-start gap-4 hover:border-[#004a39]/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-[#004a39]/10 flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5 text-[#004a39]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{c.label}</h4>
                  <p className="font-medium text-[#1a1c1b]">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div ref={addReveal}>
              <div className="inline-block bg-[#004a39]/10 text-[#004a39] text-sm font-bold px-4 py-2 rounded-full mb-6">Our success story</div>
              <h3 className="text-4xl font-bold text-[#1a1c1b] mb-5" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Let's Work Together</h3>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Share your improvements, features, or feedback. Contact us for questions — we're here to help!
              </p>

            </div>
            <div ref={addReveal} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <form className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#004a39] focus:ring-1 focus:ring-[#004a39] outline-none transition-all hover:border-[#004a39]/40" placeholder="First Name" type="text" />
                  <input className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#004a39] focus:ring-1 focus:ring-[#004a39] outline-none transition-all hover:border-[#004a39]/40" placeholder="Last Name" type="text" />
                </div>
                <input className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#004a39] focus:ring-1 focus:ring-[#004a39] outline-none transition-all hover:border-[#004a39]/40" placeholder="Email" type="email" />
                <input className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#004a39] focus:ring-1 focus:ring-[#004a39] outline-none transition-all hover:border-[#004a39]/40" placeholder="Subject" type="text" />
                <textarea className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[#004a39] focus:ring-1 focus:ring-[#004a39] outline-none transition-all hover:border-[#004a39]/40 resize-none" placeholder="Tell us about your feedback, ideas, improvements..." rows={4} />
                <button type="submit" className="w-full bg-[#004a39] text-white text-sm font-bold px-6 py-4 rounded-lg hover:bg-[#004a39]/90 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-12 px-6 bg-[#004a39] text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Image
              src={Logo}
              width={24}
              height={24}
              alt="Talkit Logo"
              className="brightness-0 invert"
            />
            <span className="font-bold" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Talkit Platform</span>
          </div>
          <div className="text-center">
            <p className="text-white/70 italic mb-4 text-sm">"The right question asked at the right time can change everything."</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
              {['Privacy Policy', 'Terms of Service', 'Help Center', 'Contact Us'].map((l) => (
                <a key={l} href="#" className="text-white/70 hover:text-white transition-colors hover:underline">{l}</a>
              ))}
            </div>
          </div>
          <div className="text-white/50 text-sm">© {currentYear || 2024} Talkit. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
