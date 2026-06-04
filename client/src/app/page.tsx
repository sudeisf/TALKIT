'use client';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Logo from '../../public/svg/logo.svg';
import {
  ArrowBigRight,
  ArrowRightFromLineIcon,
  ArrowUpRight,
  LocateIcon,
  Mail,
  MapPin,
  PhoneCall,
  PhoneIncoming,
  PinIcon,
  Moon,
  Sun,
} from 'lucide-react';
import {
  MessageCircle,
  BarChart,
  Bot,
  Rocket,
  BookOpen,
  Bell,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Lottie from 'lottie-react';
import animationData from '../../public/animate/manifest.json';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  selectThemePreference,
  setTheme,
  type ThemePreference,
} from '@/redux/slice/appearanceSlice';

const features = [
  {
    icon: MessageCircle,
    title: 'Live Chat Sessions',
    description:
      'Talk to real people, in real time. Ask questions and get unstuck instantly.',
  },
  {
    icon: BarChart,
    title: 'Personal Learning Dashboard',
    description:
      'Track what you’ve asked, what you’ve learned, and how you’re improving.',
  },
  {
    icon: Bot,
    title: 'AI + Human Collaboration',
    description:
      'AI helps guide and suggest, but real humans give the best answers.',
  },
  {
    icon: Rocket,
    title: 'Instant Matching',
    description:
      'No waiting. Get paired with a helper right after you submit your question.',
  },
  {
    icon: BookOpen,
    title: 'Topic Progress Tracker',
    description:
      'See how confident you are in topics like React, Python, or Data Structures.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description:
      'Be alerted when a helper joins your session or replies to your question.',
  },
];

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectThemePreference);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemePreference = isDarkMode ? 'light' : 'dark';
    dispatch(setTheme(nextTheme));
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <nav className="flex items-center justify-between p-4 border-b border-border bg-background/95 *:font-sans">
  <div className="flex items-center gap-2">
    <Image
      src={Logo}
      width={30}
      height={30}
      alt="logo"
      className="dark:brightness-0 dark:invert"
    />
    <p className="text-lg text-primary text-shadow-xs">Talkit</p>
  </div>

  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-9 w-9"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
    <Button
      onClick={() => router.push('/register')}
      variant="ghost"
      className="text-sm md:text-md px-3 md:px-4 text-foreground hover:bg-muted"
    >
      Sign up
    </Button>
    <Button
      onClick={() => router.push('/login')}
      className="rounded-sm text-sm md:text-md shadow-xs bg-primary text-primary-foreground px-4 md:px-6 hover:bg-primary/90"
    >
      Sign in
    </Button>
  </div>
</nav>
      <main>
        <div className="relative min-h-screen space-y-8 py-5 px-4 sm:px-6 bg-[url('/svg/wave-haikei-gray.svg')] bg-no-repeat bg-cover bg-bottom">

          {/* Main heading */}
          <div className="mx-auto text-center">
            <h1 className="inline-block text-primary bg-primary/10 text-sm sm:text-base md:text-lg py-2 px-6 rounded-full">
              Ask smarter. Learn faster. Never get stuck again.
            </h1>
          </div>

          {/* Content section */}
          <div className="max-w-5xl mx-auto space-y-8">
            <p className="text-2xl sm:text-3xl md:text-4xl font-medium text-center font-rubik  leading-tight">
              Whether you're debugging a tricky function, confused by async
              behavior, or just need a second brain<span className="text-primary"> - this platform connects you
              with real people, in real time.</span>
            </p>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground text-center leading-relaxed">
              No more endless Googling. No more waiting for forum replies.
              <br />
              Just ask, get matched instantly, and learn through live chat — one
              question at a time.
            </p>

            <p className="text-sm sm:text-base text-muted-foreground text-center underline">
              Start learning the way you always wanted:
              <span className="text-primary mx-1">fast</span>,
              <span className="text-primary mx-1">focused</span>, and
              <span className="text-primary mx-1 animate-in">human</span>.
            </p>
          </div>

          {/* CTA button */}
          <div className="flex justify-center mt-12">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base max-w-4xl rounded-md shadow-xs flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3">
              Ask a Question & Get Help <ArrowUpRight size={18} />
            </Button>
          </div>
        </div>
        <div className="min-h-screen max-w-[1400px] mx-auto p-5 space-y-8">
          <div className="flex flex-col md:flex-row justify-between mt-4 items-center gap-4">
    <h1 className="font-sans font-medium text-2xl sm:text-3xl md:text-4xl text-center md:text-left">
      Why Choose Us & <br /> What You Get
    </h1>
    <Button className="w-full sm:w-auto font-sans text-sm sm:text-base bg-primary text-primary-foreground py-3 sm:py-4 px-6 sm:px-8 rounded-md shadow-xs hover:bg-primary/90">
      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
      <span className="ml-2">Let's start learning</span>
    </Button>
  </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-4 rounded-md border border-border hover:shadow-lg hover:border-border transition-shadow animation-duration-initial duration-500 bg-card text-left"
              >
                <feature.icon className="w-8 h-8 text-primary mb-5" />
                <h3 className="text-lg sm:text-xl font-sans font-medium">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-screen p-3 sm:p-5 w-full">
          <div className="p-3 sm:p-4 bg-muted rounded-md space-y-5 border border-border">
            <h1 className="text-center uppercase font-medium text-primary text-xl sm:text-2xl font-sans mt-6">
              contact us
            </h1>
            <p className="text-center text-foreground text-xl sm:text-3xl md:text-4xl font-sans">
              We'd love to talk to you
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 sm:max-w-[80%] mx-auto mt-6">
              <div className="py-8 border border-border space-y-3 bg-card text-card-foreground px-6 rounded-md shadow-2xs">
                <div className="flex gap-4">
                  <PhoneIncoming className="w-8 h-8 text-primary" />
                  <div className="flex flex-col align-baseline">
                    <h1 className="uppercase font-sans text-muted-foreground text-xs sm:text-sm font-medium">
                      Call us
                    </h1>
                    <p className="font-sans font-medium text-base sm:text-lg">
                      +25111789089
                    </p>
                  </div>
                </div>
              </div>
              <div className="py-8 border border-border space-y-3 bg-card text-card-foreground px-6 rounded-md shadow-2xs">
                <div className="flex gap-4">
                  <Mail className="w-8 h-8 text-primary" />
                  <div className="flex flex-col align-baseline">
                    <h1 className="uppercase text-muted-foreground font-sans text-sm font-medium">
                      Email us
                    </h1>
                    <p className="font-sans font-medium text-md sm:text-lg">
                      sudeisfed@gmail.com
                    </p>
                  </div>
                </div>
              </div>
              <div className="py-8 border border-border space-y-3 bg-card text-card-foreground px-6 rounded-md shadow-2xs">
                <div className="flex gap-4">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div className="flex flex-col align-baseline">
                    <h1 className="uppercase text-sm text-muted-foreground font-medium font-sans">
                      Head Quarters
                    </h1>
                    <p className="font-sans font-medium text-lg">
                      Addis Abeba, Ethiopia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 mt-10 p-4 max-w-6xl mx-auto">
            <div className="w-full lg:w-2/5 flex flex-col justify-center gap-2">
              <p className="bg-primary/10 text-primary shadow-2xs rounded-full py-2 px-4 text-xs sm:text-sm font-sans">
                Our success number
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium">
                Lets Work Togather
              </h1>
              <p className="font-sans text-muted-foreground text-sm sm:text-base md:text-lg font-medium">
                share us improvements , features too add feedback , please
                contact us for basic questions. we're here to help!
              </p>
            </div>
            <div className="w-full lg:w-3/5">
              <form className="space-y-6 p-0 md:p-5" autoComplete="off">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <fieldset className="w-full">
                    <Input
                      placeholder="First Name"
                      className="py-3 sm:py-4 rounded-sm text-sm sm:text-base"
                    />
                  </fieldset>
                  <fieldset className="w-full">
                    <Input
                      placeholder="Last Name"
                      className="py-4 md:py-5 rounded-sm"
                    />
                  </fieldset>
                </div>
                <fieldset>
                  <Input placeholder="Email" className="py-5 rounded-sm" />
                </fieldset>
                <fieldset>
                  <Input placeholder="subject" className="py-5 rounded-sm" />
                </fieldset>
                <fieldset className="w-full">
                  <textarea
                    className="w-full border border-border bg-background text-foreground p-2 rounded-sm placeholder:text-muted-foreground"
                    rows={8}
                    placeholder="Tell us about your feedback , idea  , improvements..."
                  />
                </fieldset>
                <Button className="w-full py-3 sm:py-6 rounded-sm bg-primary text-primary-foreground text-sm sm:text-base md:text-lg font-sans hover:bg-primary/90">
                  Submit
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-16 py-10 px-4 sm:px-6 text-sm text-foreground *:font-sans *:font-medium">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-base sm:text-lg italic text-foreground max-w-xl mx-auto">
            "The right question asked at the right time can change everything."
          </p>

          <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-foreground font-medium">
            <a href="/terms" className="hover:text-primary transition">
              Terms
            </a>
            <a href="/privacy" className="hover:text-primary transition">
              Privacy
            </a>
            <a href="/about" className="hover:text-primary transition">
              About
            </a>
            <a href="/contact" className="hover:text-primary transition">
              Contact
            </a>
          </div>

          <p className="text-[11px] sm:text-xs text-muted-foreground">
            &copy; {currentYear || ''} Talktit. Built for learners. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
