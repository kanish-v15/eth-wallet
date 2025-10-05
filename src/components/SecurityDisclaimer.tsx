import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const SecurityDisclaimer = () => {
  return (
    <Card className="p-6 bg-destructive/10 border-destructive/30 mb-8">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-destructive mb-2">
            Demo/Prototype Notice
          </h3>
          <div className="text-sm text-destructive/90 space-y-2">
            <p>
              <strong>This is a demonstration wallet for hackathon purposes only.</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Do not use real funds or real Ethereum addresses</li>
              <li>Private keys are stored in browser localStorage (not secure for production)</li>
              <li>Transactions are simulated and not broadcast to any blockchain</li>
              <li>Authentication is mock-only with no backend validation</li>
              <li>This demo is for educational and testing purposes only</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
