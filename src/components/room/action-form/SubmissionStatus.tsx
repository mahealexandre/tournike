import { Button } from "@/components/ui/button";

interface SubmissionStatusProps {
  submittedCount: number;
  totalPlayers: number;
  onStartGame: () => void;
  allPlayersSubmitted: boolean;
}

export const SubmissionStatus = ({
  submittedCount,
  totalPlayers,
  onStartGame,
  allPlayersSubmitted,
}: SubmissionStatusProps) => {
  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600">
        Vos actions ont été enregistrées. En attente des autres joueurs...
      </p>
      <Button
        onClick={onStartGame}
        className="w-full bg-[#2E1F47] hover:bg-[#000000]/90 text-white"
        disabled={!allPlayersSubmitted}
      >
        {allPlayersSubmitted ? "Commencer" : "En attente des autres joueurs..."}
      </Button>
    </div>
  );
};