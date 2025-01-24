import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WaitingRoom } from "@/components/room/WaitingRoom";
import { SpinGame } from "@/components/room/SpinGame";
import { Player } from "@/types/game";
import { useToast } from "@/hooks/use-toast";

const Room = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomStatus, setRoomStatus] = useState<string>("waiting");
  const [roomId, setRoomId] = useState<string>("");

  useEffect(() => {
    if (!code) {
      navigate("/");
      return;
    }

    const fetchPlayers = async () => {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select()
        .eq("code", code)
        .single();

      if (roomError || !room) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Cette salle n'existe pas.",
        });
        navigate("/");
        return;
      }

      setRoomId(room.id);

      const { data: playersData } = await supabase
        .from("players")
        .select()
        .eq("room_id", room.id);

      if (playersData) {
        setPlayers(playersData);
      }

      setRoomStatus(room.status);

      // Create game state if it doesn't exist
      const { data: gameState } = await supabase
        .from("game_state")
        .select()
        .eq("room_id", room.id)
        .single();

      if (!gameState) {
        await supabase.from("game_state").insert([
          {
            room_id: room.id,
            animation_state: "idle",
          },
        ]);
      }
    };

    fetchPlayers();

    const playersSubscription = supabase
      .channel("players_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        async () => {
          const { data: updatedPlayers } = await supabase
            .from("players")
            .select()
            .eq("room_id", roomId);

          if (updatedPlayers) {
            setPlayers(updatedPlayers);
          }
        }
      )
      .subscribe();

    const roomSubscription = supabase
      .channel("room_status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${code}`,
        },
        (payload: any) => {
          setRoomStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      playersSubscription.unsubscribe();
      roomSubscription.unsubscribe();
    };
  }, [code, navigate, toast, roomId]);

  const handleStartGame = async () => {
    if (!code) return;

    const { data: room } = await supabase
      .from("rooms")
      .select()
      .eq("code", code)
      .single();

    if (room) {
      await supabase
        .from("rooms")
        .update({ status: "playing" })
        .eq("id", room.id);
    }
  };

  if (roomStatus === "playing") {
    return <SpinGame players={players} roomId={roomId} />;
  }

  return (
    <WaitingRoom code={code || ""} players={players} onStartGame={handleStartGame} />
  );
};

export default Room;