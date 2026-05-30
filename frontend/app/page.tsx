import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, Shield, Video, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar - Minimal */}
      <header className="px-6 lg:px-8 h-20 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center gap-2 group outline-none focus-visible:ring-4 ring-primary/50 rounded-lg p-1" href="/">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground font-heading">WC Telehealth</span>
        </Link>
        <div className="flex items-center gap-4">
            <Link href="/login" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-4 ring-primary/50 rounded-md px-2 py-1">
                Log in
            </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32">
        {/* Single Column Hero & CTA Focus */}
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
            
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-2">
                <span className="relative flex h-2.5 w-2.5 mr-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                Accessible Virtual Healthcare
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground font-heading leading-tight">
                Healthcare that fits <br className="hidden sm:block" /> your life.
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Connect securely with certified medical professionals from the comfort of your home. High-quality care is just one click away.
            </p>

            <div className="pt-8 w-full max-w-sm">
                <Link href="/register" className="block w-full outline-none focus-visible:ring-4 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-full">
                    <Button size="lg" className="w-full h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-semibold shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer">
                        Start your visit
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <div className="mt-4 text-sm text-muted-foreground">
                    Are you a medical professional? <Link href="/register/doctor" className="text-primary font-medium hover:underline focus-visible:ring-4 ring-primary/50 rounded outline-none">Join our network</Link>
                </div>
            </div>

        </div>

        {/* 3 Benefit Bullets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-32 max-w-5xl mx-auto w-full text-left">
            <div className="flex flex-col gap-3 group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Video className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading">Secure Video Calls</h3>
                <p className="text-muted-foreground text-base leading-relaxed">Consult with doctors face-to-face using our encrypted, accessible video platform—no downloads required.</p>
            </div>
            
            <div className="flex flex-col gap-3 group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading">Flexible Scheduling</h3>
                <p className="text-muted-foreground text-base leading-relaxed">Book appointments at times that work for you, with real-time availability from our network of providers.</p>
            </div>

            <div className="flex flex-col gap-3 group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading">Private Records</h3>
                <p className="text-muted-foreground text-base leading-relaxed">Your medical history and prescriptions are securely stored and accessible to you 24/7 in your patient portal.</p>
            </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-12 bg-white">
        <div className="container flex flex-col md:flex-row items-center justify-between px-6 lg:px-8 mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-foreground font-heading">WC Telehealth</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
             <span className="cursor-pointer hover:text-foreground transition-colors focus-visible:ring-4 ring-primary/50 rounded outline-none">Privacy Policy</span>
             <span className="cursor-pointer hover:text-foreground transition-colors focus-visible:ring-4 ring-primary/50 rounded outline-none">Terms of Service</span>
             <span className="cursor-pointer hover:text-foreground transition-colors focus-visible:ring-4 ring-primary/50 rounded outline-none">Accessibility</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
