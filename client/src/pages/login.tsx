
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simula una piccola attesa per l'autenticazione
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === "ClanWarMaker") {
      // Salva lo stato di autenticazione nel localStorage
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("authTimestamp", Date.now().toString());
      
      toast({
        title: "Login effettuato",
        description: "Accesso autorizzato al pannello amministratore",
      });
      
      setLocation("/admin");
    } else {
      toast({
        title: "Errore di autenticazione",
        description: "Password non corretta",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Accesso Amministratore
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Inserisci la password per accedere al pannello admin
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la password"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Autenticazione..." : "Accedi"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Solo gli amministratori autorizzati possono accedere
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
