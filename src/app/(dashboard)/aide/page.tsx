import { Sparkles } from "lucide-react";
import { AideChat } from "./AideChat";

export default function AidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-light tracking-tight text-slate-900">
          <Sparkles className="h-6 w-6 text-accent/70" />
          Aide
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Posez une question sur l&apos;utilisation de l&apos;application ou sur les documents de
          la résidence. Cet assistant ne remplace pas la direction et ne donne pas de conseil
          médical ou de soins.
        </p>
      </div>

      <AideChat />
    </div>
  );
}
