   import ProtectedRoute from "@/components/ProtectedRoute";

   export default function Dashboard() {
     return (
       <ProtectedRoute>
         <div className="text-white p-8">You're logged in — this is protected.</div>
       </ProtectedRoute>
     );
   }
   