   "use client";

   import ProtectedRoute from "@/components/ProtectedRoute";
   import { useTierTheme } from "@/context/TierThemeProvider";

   export default function Dashboard() {
     const theme = useTierTheme();

     return (
       <ProtectedRoute>
         <div className="p-8 bg-slate-950 min-h-screen text-white">
           <h1 className={`text-2xl font-bold ${theme.text}`}>
             Welcome, {theme.label}
           </h1>
         </div>
       </ProtectedRoute>
     );
   }
   