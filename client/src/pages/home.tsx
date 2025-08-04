import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, Settings, Star, Trophy, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ClanConfiguration } from "@shared/schema";

export default function HomePage() {
  // Fetch clan configuration
  const { data: clanConfig, isLoading } = useQuery<ClanConfiguration>({
    queryKey: ["/api/clan-configuration"],
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento configurazione clan...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Clan Description Card */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-secondary rounded-full p-4">
                <Users className="text-white h-8 w-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Benvenuto nel CWL Manager</h2>
            <p className="text-gray-600 text-lg">Sistema di gestione per la Clan War League</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Descrizione del Clan</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">{clanConfig?.clanName || "Nome Clan"}</h4>
                <p className="text-gray-600">{clanConfig?.clanDescription || "Descrizione del clan non disponibile."}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="h-4 w-4 mr-2" />
                    <span>Lega: {clanConfig?.league || "Non specificata"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Membri Attivi: {clanConfig?.activeMembers || 0}/{clanConfig?.maxMembers || 50}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>War Win Rate: {clanConfig?.winRate || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border-l-4 border-primary">
                  <h5 className="font-medium text-gray-800">Requisiti per CWL</h5>
                  <p className="text-sm text-gray-600 mt-1">{clanConfig?.requirements || "Requisiti non specificati"}</p>
                </div>
                <div className="bg-white p-4 rounded border-l-4 border-success">
                  <h5 className="font-medium text-gray-800">Prossima CWL</h5>
                  <p className="text-sm text-gray-600 mt-1">{clanConfig?.nextCwlInfo || "Informazioni non disponibili"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/player">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-center mb-4">
                  <UserPlus className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Registrazione Player</h3>
                <p className="text-blue-100">Registrati per partecipare alla prossima Clan War League</p>
              </div>
            </Link>
            
            <Link href="/admin">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-center mb-4">
                  <Settings className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pannello Admin</h3>
                <p className="text-orange-100">Gestisci clan, crea messaggi e genera PDF per CWL</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
