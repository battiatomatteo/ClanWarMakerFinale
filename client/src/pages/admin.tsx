import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, FileText, Download, Trash2, Users, PlusCircle, ArrowLeftRight, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PlayerRegistration, ClanConfiguration } from "@shared/schema";

interface ClanForm {
  name: string;
  participants: number;
  league: string;
}

interface ClanWithPlayers extends ClanForm {
  id: string;
  players: PlayerRegistration[];
}

export default function AdminPage() {
  const [clans, setClans] = useState<ClanForm[]>([]);
  const [clansWithPlayers, setClansWithPlayers] = useState<ClanWithPlayers[]>([]);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [showClanConfig, setShowClanConfig] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Verifica autenticazione
  useEffect(() => {
    const checkAuthentication = () => {
      const authenticated = localStorage.getItem("adminAuthenticated");
      const authTimestamp = localStorage.getItem("authTimestamp");
      
      if (authenticated === "true" && authTimestamp) {
        // Controlla se la sessione è ancora valida (24 ore)
        const now = Date.now();
        const authTime = parseInt(authTimestamp);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - authTime < twentyFourHours) {
          setIsAuthenticated(true);
        } else {
          // Sessione scaduta, pulisci il localStorage
          localStorage.removeItem("adminAuthenticated");
          localStorage.removeItem("authTimestamp");
          setLocation("/login");
        }
      } else {
        setLocation("/login");
      }
      setIsLoading(false);
    };

    checkAuthentication();
  }, [setLocation]);

  const form = useForm<ClanForm>({
    defaultValues: {
      name: "",
      participants: 15,
      league: "",
    },
  });

  const clanConfigForm = useForm<ClanConfiguration>({
    defaultValues: {
      clanName: "",
      clanDescription: "",
      league: "",
      activeMembers: 45,
      maxMembers: 50,
      winRate: 85,
      requirements: "",
      nextCwlInfo: "",
    },
  });

  // Fetch player registrations
  const { data: registrations = [] } = useQuery<PlayerRegistration[]>({
    queryKey: ["/api/player-registrations"],
  });

  // Fetch clan configuration
  const { data: clanConfig } = useQuery<ClanConfiguration>({
    queryKey: ["/api/clan-configuration"],
    onSuccess: (data) => {
      clanConfigForm.reset(data);
    },
  });

  // Fetch file status
  const { data: fileStatus } = useQuery({
    queryKey: ["/api/registrations-file"],
    refetchInterval: 5000, // Aggiorna ogni 5 secondi
  });

  // Clear registrations mutation
  const clearRegistrationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/player-registrations");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Registrazioni cancellate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/player-registrations"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la cancellazione delle registrazioni",
        variant: "destructive",
      });
    },
  });

  // Delete single player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const response = await apiRequest("DELETE", `/api/player-registrations/${playerId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Player eliminato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/player-registrations"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione del player",
        variant: "destructive",
      });
    },
  });

  // Generate message mutation
  const generateMessageMutation = useMutation({
    mutationFn: async (clansData: ClanForm[]) => {
      const response = await apiRequest("POST", "/api/generate-message", { clans: clansData });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.message);
      toast({
        title: "Messaggio generato",
        description: "Il messaggio CWL è stato generato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante la generazione del messaggio",
        variant: "destructive",
      });
    },
  });

  // Save clan configuration mutation
  const saveClanConfigMutation = useMutation({
    mutationFn: async (configData: ClanConfiguration) => {
      const response = await apiRequest("POST", "/api/clan-configuration", configData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione salvata",
        description: "La configurazione del clan è stata aggiornata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clan-configuration"] });
      setShowClanConfig(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio della configurazione",
        variant: "destructive",
      });
    },
  });

  // Export PDF mutation
  const exportPdfMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/export-pdf", { message });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "cwl-message.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "PDF esportato",
        description: "Il PDF è stato scaricato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore durante l'esportazione del PDF",
        variant: "destructive",
      });
    },
  });

  const addClan = (data: ClanForm) => {
    setClans([...clans, data]);
    form.reset();
  };

  const removeClan = (index: number) => {
    setClans(clans.filter((_, i) => i !== index));
  };

  // Gestione player tra liste
  const assignPlayersToClans = () => {
    if (clans.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un clan prima di assegnare i player",
        variant: "destructive",
      });
      return;
    }

    const newClansWithPlayers: ClanWithPlayers[] = clans.map((clan, index) => ({
      ...clan,
      id: `clan-${index}`,
      players: []
    }));

    // Distribuisci i player registrati tra i clan
    registrations.forEach((player, index) => {
      const clanIndex = index % clans.length;
      newClansWithPlayers[clanIndex].players.push(player);
    });

    setClansWithPlayers(newClansWithPlayers);
    setShowPlayerManager(true);
  };

  const movePlayer = (playerId: string, fromClanId: string, toClanId: string) => {
    setClansWithPlayers(prev => {
      const updated = [...prev];
      const fromClan = updated.find(c => c.id === fromClanId);
      const toClan = updated.find(c => c.id === toClanId);
      
      if (fromClan && toClan) {
        const playerIndex = fromClan.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          const player = fromClan.players.splice(playerIndex, 1)[0];
          toClan.players.push(player);
        }
      }
      
      return updated;
    });
  };

  const movePlayerUp = (clanId: string, playerIndex: number) => {
    if (playerIndex === 0) return;
    
    setClansWithPlayers(prev => {
      const updated = [...prev];
      const clan = updated.find(c => c.id === clanId);
      if (clan) {
        const players = [...clan.players];
        [players[playerIndex], players[playerIndex - 1]] = [players[playerIndex - 1], players[playerIndex]];
        clan.players = players;
      }
      return updated;
    });
  };

  const movePlayerDown = (clanId: string, playerIndex: number) => {
    setClansWithPlayers(prev => {
      const updated = [...prev];
      const clan = updated.find(c => c.id === clanId);
      if (clan && playerIndex < clan.players.length - 1) {
        const players = [...clan.players];
        [players[playerIndex], players[playerIndex + 1]] = [players[playerIndex + 1], players[playerIndex]];
        clan.players = players;
      }
      return updated;
    });
  };

  const handleGenerateMessage = () => {
    const dataToUse = showPlayerManager && clansWithPlayers.length > 0 ? clansWithPlayers : clans;
    
    if (dataToUse.length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un clan prima di generare il messaggio",
        variant: "destructive",
      });
      return;
    }
    
    if (showPlayerManager) {
      generateMessageFromAssignedPlayers();
    } else {
      generateMessageMutation.mutate(clans);
    }
  };

  const generateMessageFromAssignedPlayers = () => {
    let message = "";
    
    clansWithPlayers.forEach((clan) => {
      message += `${clan.league}\n\n`;
      message += `${clan.name} ${clan.participants} partecipanti\n\n`;
      
      clan.players.forEach((player, index) => {
        message += `${index + 1}) ${player.playerName} ${player.thLevel}\n`;
      });
      
      const missingPlayers = Math.max(0, clan.participants - clan.players.length);
      if (missingPlayers > 0) {
        message += `\nMancano ancora ${missingPlayers} player\n`;
      }
      
      message += "\n---\n\n";
    });
    
    setGeneratedMessage(message);
    toast({
      title: "Messaggio generato",
      description: "Il messaggio CWL è stato generato con successo",
    });
  };

  const handleExportPdf = () => {
    if (!generatedMessage) {
      toast({
        title: "Errore",
        description: "Genera prima un messaggio da esportare",
        variant: "destructive",
      });
      return;
    }
    exportPdfMutation.mutate(generatedMessage);
  };

  const handleClearRegistrations = () => {
    if (window.confirm("Sei sicuro di voler cancellare tutte le registrazioni?")) {
      clearRegistrationsMutation.mutate();
    }
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il player "${playerName}"?`)) {
      deletePlayerMutation.mutate(playerId);
    }
  };

  const handleSaveClanConfig = (data: ClanConfiguration) => {
    saveClanConfigMutation.mutate(data);
  };

  const getTHBadgeColor = (thLevel: number) => {
    if (thLevel >= 15) return "bg-blue-100 text-blue-800";
    if (thLevel >= 12) return "bg-green-100 text-green-800";
    if (thLevel >= 9) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("authTimestamp");
    toast({
      title: "Logout effettuato",
      description: "Sei stato disconnesso dal pannello admin",
    });
    setLocation("/login");
  };

  // Mostra loading durante la verifica dell'autenticazione
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifica autenticazione...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se non autenticato, non mostrare nulla (verrà reindirizzato)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Admin Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Pannello Amministratore</h2>
              <p className="text-gray-600">Gestisci clan, genera messaggi CWL e visualizza statistiche player</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowClanConfig(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifica Clan
              </Button>
              <Button
                variant="outline"
                onClick={handleClearRegistrations}
                disabled={clearRegistrationsMutation.isPending || registrations.length === 0}
                className="bg-warning text-white hover:bg-yellow-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {clearRegistrationsMutation.isPending ? "Cancellando..." : "Svuota Registrazioni"}
              </Button>
              <Button
                onClick={handleExportPdf}
                disabled={exportPdfMutation.isPending || !generatedMessage}
                className="bg-error text-white hover:bg-red-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Esporta PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CWL Message Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Creazione Messaggio CWL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(addClan)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Clan</FormLabel>
                          <FormControl>
                            <Input placeholder="Eclipse" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partecipanti</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="15" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="league"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lega</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona Lega" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Bronze League">Bronze League</SelectItem>
                              <SelectItem value="Silver League">Silver League</SelectItem>
                              <SelectItem value="Gold League">Gold League</SelectItem>
                              <SelectItem value="Crystal League">Crystal League</SelectItem>
                              <SelectItem value="Master League">Master League</SelectItem>
                              <SelectItem value="Champion League">Champion League</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Aggiungi Clan
                  </Button>
                </form>
              </Form>

              {/* Added Clans List */}
              {clans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Clan Aggiunti:</h4>
                  {clans.map((clan, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span>{clan.name} - {clan.participants} partecipanti - {clan.league}</span>
                      <Button variant="outline" size="sm" onClick={() => removeClan(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={assignPlayersToClans}
                  disabled={clans.length === 0 || registrations.length === 0}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Gestisci Player tra Clan
                </Button>
                
                <Button 
                  onClick={handleGenerateMessage}
                  disabled={generateMessageMutation.isPending}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Genera Messaggio
                </Button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Anteprima Messaggio
              </h4>
              <div className="bg-white rounded border p-4 font-mono text-sm min-h-[200px]">
                {generatedMessage ? (
                  <pre className="whitespace-pre-wrap">{generatedMessage}</pre>
                ) : (
                  <div className="text-gray-600 italic">Il messaggio apparirà qui dopo aver inserito i dati del clan...</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Management Section */}
      {showPlayerManager && clansWithPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowLeftRight className="mr-2 h-5 w-5" />
                Gestione Player tra Clan
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPlayerManager(false)}
              >
                Chiudi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {clansWithPlayers.map((clan) => (
                <Card key={clan.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {clan.name} - {clan.league}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {clan.players.length}/{clan.participants} player
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {clan.players.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{index + 1}.</span>
                            <div>
                              <div className="font-medium">{player.playerName}</div>
                              <div className="text-xs text-gray-600">{player.thLevel}</div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => movePlayerUp(clan.id, index)}
                              disabled={index === 0}
                              className="p-1 h-6 w-6"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => movePlayerDown(clan.id, index)}
                              disabled={index === clan.players.length - 1}
                              className="p-1 h-6 w-6"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Select
                              onValueChange={(toClanId) => movePlayer(player.id, clan.id, toClanId)}
                            >
                              <SelectTrigger className="h-6 w-16 text-xs">
                                <SelectValue placeholder="→" />
                              </SelectTrigger>
                              <SelectContent>
                                {clansWithPlayers
                                  .filter(c => c.id !== clan.id)
                                  .map(targetClan => (
                                    <SelectItem key={targetClan.id} value={targetClan.id}>
                                      {targetClan.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                      {clan.players.length === 0 && (
                        <div className="text-center text-gray-500 py-4 text-sm">
                          Nessun player assegnato
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button
                onClick={handleGenerateMessage}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                Genera Messaggio con Liste Personalizzate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clan Configuration Section */}
      {showClanConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Edit className="mr-2 h-5 w-5" />
                Configurazione Clan
              </div>
              <Button
                variant="outline"
                onClick={() => setShowClanConfig(false)}
              >
                Chiudi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...clanConfigForm}>
              <form onSubmit={clanConfigForm.handleSubmit(handleSaveClanConfig)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={clanConfigForm.control}
                    name="clanName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Clan</FormLabel>
                        <FormControl>
                          <Input placeholder="Eclipse Clan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clanConfigForm.control}
                    name="league"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lega</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona Lega" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bronze League I">Bronze League I</SelectItem>
                            <SelectItem value="Bronze League II">Bronze League II</SelectItem>
                            <SelectItem value="Bronze League III">Bronze League III</SelectItem>
                            <SelectItem value="Silver League I">Silver League I</SelectItem>
                            <SelectItem value="Silver League II">Silver League II</SelectItem>
                            <SelectItem value="Silver League III">Silver League III</SelectItem>
                            <SelectItem value="Gold League I">Gold League I</SelectItem>
                            <SelectItem value="Gold League II">Gold League II</SelectItem>
                            <SelectItem value="Gold League III">Gold League III</SelectItem>
                            <SelectItem value="Crystal League I">Crystal League I</SelectItem>
                            <SelectItem value="Crystal League II">Crystal League II</SelectItem>
                            <SelectItem value="Crystal League III">Crystal League III</SelectItem>
                            <SelectItem value="Master League I">Master League I</SelectItem>
                            <SelectItem value="Master League II">Master League II</SelectItem>
                            <SelectItem value="Master League III">Master League III</SelectItem>
                            <SelectItem value="Champion League I">Champion League I</SelectItem>
                            <SelectItem value="Champion League II">Champion League II</SelectItem>
                            <SelectItem value="Champion League III">Champion League III</SelectItem>
                            <SelectItem value="Titan League I">Titan League I</SelectItem>
                            <SelectItem value="Titan League II">Titan League II</SelectItem>
                            <SelectItem value="Titan League III">Titan League III</SelectItem>
                            <SelectItem value="Legend League">Legend League</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clanConfigForm.control}
                    name="activeMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membri Attivi</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="45" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clanConfigForm.control}
                    name="maxMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Massimo Membri</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clanConfigForm.control}
                    name="winRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Win Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="85" 
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={clanConfigForm.control}
                  name="clanDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione Clan</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrivi il tuo clan..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={clanConfigForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisiti per CWL</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Specifica i requisiti per partecipare alla CWL..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={clanConfigForm.control}
                  name="nextCwlInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Informazioni Prossima CWL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Registrazioni aperte fino al 28 del mese"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={saveClanConfigMutation.isPending}
                >
                  {saveClanConfigMutation.isPending ? "Salvando..." : "Salva Configurazione"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Player Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Player Registrati ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Registrations Summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-blue-800">Registrazioni Attuali</h5>
                    <p className="text-blue-600 text-sm">{registrations.length} player registrati</p>
                    <p className="text-xs text-blue-500 mt-1">
                      🗄️ Dati salvati automaticamente in database SQLite
                    </p>
                  </div>
                  <div className="text-sm text-blue-600">
                    <div>Ultimo aggiornamento: {new Date().toLocaleString()}</div>
                    <div className="text-xs mt-1">
                      Database: data/database.db
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h5 className="font-semibold text-green-800">Stato Persistenza</h5>
                <div className="text-sm text-green-700">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${fileStatus?.isEmpty === false ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span>Database: {fileStatus?.isEmpty === false ? `${fileStatus?.count || 0} record` : 'Vuoto'}</span>
                  </div>
                  <div className="text-xs mt-2 text-green-600">
                    I dati vengono salvati automaticamente nel database SQLite ad ogni registrazione e sono persistenti tra i riavvii del server.
                  </div>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome Player</TableHead>
                    <TableHead>Livello TH</TableHead>
                    <TableHead>Data Registrazione</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((player: PlayerRegistration, index) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{player.playerName}</TableCell>
                      <TableCell>
                        <Badge className={getTHBadgeColor(parseInt(player.thLevel.replace('th', '').replace('TH', '')))}>
                          {player.thLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(player.createdAt || Date.now()).toLocaleString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePlayer(player.id, player.playerName)}
                          disabled={deletePlayerMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-12 w-12 text-gray-300" />
                          <p>Nessun player registrato ancora</p>
                          <p className="text-xs">Le registrazioni appariranno qui quando i player si iscriveranno</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
