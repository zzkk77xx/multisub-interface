import { useAccount, useReadContract } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFI_INTERACTOR_ABI } from "@/lib/contracts";
import { useContractAddresses } from "@/contexts/ContractAddressContext";

export function SafeStatus() {
  const { address, isConnected } = useAccount();
  const { addresses } = useContractAddresses();

  // Read pause status
  const pausedQuery = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: "paused",
  });
  const isPaused = pausedQuery.data;
  console.log(pausedQuery, isPaused);

  // Read Safe address from contract
  const safeAddressQuery = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: "safe",
  });
  const safeAddress = safeAddressQuery.data;
  console.log(safeAddressQuery, safeAddress);

  const isSafeOwner =
    isConnected &&
    safeAddress &&
    address?.toLowerCase() === safeAddress.toLowerCase();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Safe Status</CardTitle>
          <CardDescription>
            Connect your wallet to view Safe status
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Safe Status</CardTitle>
            <CardDescription>Morpho Smart Wallet system status</CardDescription>
          </div>
          {isPaused ? (
            <Badge variant="destructive">PAUSED</Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ACTIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Safe Address</p>
            <p className="font-mono text-sm mt-1">
              {safeAddress
                ? `${safeAddress.slice(0, 6)}...${safeAddress.slice(-4)}`
                : "Loading..."}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Your Address</p>
            <p className="font-mono text-sm mt-1">
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not connected"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Permission Level</p>
            <div className="mt-1">
              {isSafeOwner ? (
                <Badge>Safe Owner</Badge>
              ) : (
                <Badge variant="outline">Sub-Account / External</Badge>
              )}
            </div>
          </div>

          {isPaused && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-semibold">
                ⚠️ Emergency Mode Active
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All deposit and withdrawal operations are paused. Only Safe
                owners can unpause the system.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
