import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { db, isConfigValid, isFirebaseReady } from "@/lib/firebase";
import { collection, query as fbQuery, where, getDocs } from "firebase/firestore";
import { AlertCircle, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface User {
  displayName: string;
  email: string;
  role: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo credentials for the panels
const credentials: Record<string, { password: string; role: string; redirectPath: string }> = {
  "company@admin": { password: "company123", role: "company", redirectPath: "/company" },
  "super@admin": { password: "super123", role: "super-admin", redirectPath: "/super-admin" },
  "sub@admin": { password: "sub123", role: "sub-admin", redirectPath: "/sub-admin" },
  "agency@user": { password: "agency123", role: "agency", redirectPath: "/agency" },
  "reseller@user": { password: "reseller123", role: "reseller", redirectPath: "/reseller" },
  "topup@agent": { password: "topup123", role: "topup-agent", redirectPath: "/topup-agent" },
  "host@user": { password: "host123", role: "host", redirectPath: "/host" },
  "user@test": { password: "user123", role: "user", redirectPath: "/user" },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const storedUser = localStorage.getItem("globilive_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.role && parsed.username) {
            setUser(parsed);
          } else {
            localStorage.removeItem("globilive_user");
          }
        } catch (e) {
          console.error("Failed to parse stored user", e);
          localStorage.removeItem("globilive_user");
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Detect if we are in "Demo Mode" due to placeholder configuration
    const isDemoMode = import.meta.env.VITE_FIREBASE_API_KEY?.includes("your_") || 
                       !import.meta.env.VITE_FIREBASE_API_KEY;

    if (!isDemoMode && username.includes("@") && db) {
      // Check Firestore only if Firebase is probably configured
      try {
        const colRef = collection(db, "globiliveSuperAdmins");
        const q = fbQuery(colRef, where("email", "==", username));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData: any = snap.docs[0].data();
          if (docData.status && docData.status !== "Active") return false;
          const newUser = { role: "super-admin", username, email: username, displayName: docData.name || username };
          setUser(newUser);
          localStorage.setItem("globilive_user", JSON.stringify(newUser));
          navigate("/super-admin");
          return true;
        }
      } catch (e) {
        console.error("AuthContext: Super-admin check failed:", e);
      }

      // Check sub-admins stored in Firestore
      try {
        const subCol = collection(db, "globiliveSubAdmins");
        const qSub = fbQuery(subCol, where("email", "==", username));
        const subSnap = await getDocs(qSub);
        if (!subSnap.empty) {
          const data: any = subSnap.docs[0].data();
          if (data.status && data.status !== "Active") return false;
          if (data.password === password) {
            const newUser = { role: "sub-admin", username, email: username, displayName: data.name || username };
            setUser(newUser);
            localStorage.setItem("globilive_user", JSON.stringify(newUser));
            navigate("/sub-admin");
            return true;
          }
          return false;
        }
      } catch (e) {
        console.error("AuthContext: Sub-admin check failed:", e);
      }

      // Check agency owners from Firestore
      try {
        const agencyCol = collection(db, "globiliveAgencies");
        const agencyQ = fbQuery(agencyCol, where("contactEmail", "==", username));
        const agencySnap = await getDocs(agencyQ);
        if (!agencySnap.empty) {
          const agencyDoc = agencySnap.docs[0];
          const data: any = agencyDoc.data();
          if (data.status && data.status !== "Active") return false;
          if (data.password === password) {
            const newUser = { role: "agency", username, email: username, displayName: data.agencyName || username };
            setUser(newUser);
            localStorage.setItem("globilive_user", JSON.stringify(newUser));
            navigate("/agency");
            return true;
          }
          return false;
        }
      } catch (e) {
        console.error("AuthContext: Agency check failed:", e);
      }
    }

    // Always fallback to static (Demo) credentials
    const cred = credentials[username];
    if (cred && cred.password === password) {
      const newUser = { 
        role: cred.role, 
        username, 
        email: username, 
        displayName: username.split("@")[0].toUpperCase() 
      };
      setUser(newUser);
      localStorage.setItem("globilive_user", JSON.stringify(newUser));
      navigate(cred.redirectPath);
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("globilive_user");
    navigate("/login");
  };

  if (!isConfigValid || !isFirebaseReady) {
    const missingVars = [];
    if (!import.meta.env.VITE_FIREBASE_API_KEY) missingVars.push("API_KEY");
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missingVars.push("PROJECT_ID");
    if (!import.meta.env.VITE_FIREBASE_APP_ID) missingVars.push("APP_ID");
    if (!import.meta.env.VITE_FIREBASE_DATABASE_URL) missingVars.push("DATABASE_URL");

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center flex-col items-center">
             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
             </div>
             <h1 className="text-2xl font-bold text-white mb-2">System Configuration Error</h1>
             <p className="text-slate-400 mb-6">
               {!isConfigValid 
                 ? "Firebase configuration is missing or invalid in your environment."
                 : "Firebase initialized but some services failed to start. Check your console for details."}
             </p>
          </div>
          
          {missingVars.length > 0 && (
            <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 text-left">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Missing Variables</AlertTitle>
              <AlertDescription>
                The following required variables are missing in Vercel:
                <ul className="list-disc list-inside mt-2 text-xs font-mono">
                  {missingVars.map(v => <li key={v} className="text-red-400">{v}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 space-y-3">
            <Button 
              variant="default" 
              className="w-full gradient-primary"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Check Vercel Project Settings {" > "} Environment Variables
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
