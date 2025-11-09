import { Info, Heart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function WelcomeBanner() {
  return (
    <Alert className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold mb-2">
        Welcome to Left of Right
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-3">
        <p>
          I built this website to curate specific YouTube content without the
          distraction of the algorithm, and vet for intellectual honesty.
        </p>
        <p>
          <strong>Current Limitations:</strong> There is a 10,000 request limit
          per day on the free API plan. If you like this idea and want to
          donate, it can be expanded upon faster.
        </p>
        <p className="flex items-start gap-2">
          <Heart className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
          <span>
            Donations are not required, nor am I motivated by profit, but the
            operating costs of APIs combined with the lack of available
            employment due to AI mean that I cannot foot any more of the bill
            than I already am for hosting and traffic services.
          </span>
        </p>
      </AlertDescription>
    </Alert>
  );
}
