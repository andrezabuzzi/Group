import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background decorations - High-end SaaS blur */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      
      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="glass-card shadow-2xl rounded-[3rem] p-10 sm:p-12 text-center transform transition-all border border-border/50 bg-white/70">
          <div className="mb-10 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/30 relative">
              <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] glass"></div>
              <Sparkles size={36} className="relative z-10" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-3">
            Confecção<span className="text-primary">Pro</span>
          </h1>
          <p className="text-muted-foreground mb-12 text-sm font-medium tracking-wide">
            Controle de produção inteligente e premium.
          </p>
          
          <Button 
            onClick={signInWithGoogle} 
            size="lg" 
            className="w-full h-14 rounded-2xl text-base bg-foreground hover:bg-foreground/90 transition-all group flex items-center justify-between px-6 shadow-xl shadow-foreground/10"
          >
            <span className="flex items-center gap-3 text-white font-bold">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white bg-white rounded-full p-[2px]" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </span>
            <ArrowRight size={20} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
          </Button>

          <p className="text-xs text-muted-foreground/70 mt-10 font-medium">
            Sistema de gestão de confecção e parceiros.
          </p>
        </div>
      </div>
    </div>
  );
}
