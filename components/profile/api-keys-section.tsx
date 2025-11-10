"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Check, X, ExternalLink } from "lucide-react";
import { ApiKeyInstructions } from "./api-key-instructions";

interface ApiKeyData {
  hasPrimaryKey: boolean;
  hasBackupKey: boolean;
  maskedPrimaryKey?: string;
  maskedBackupKey?: string;
  apiKeyCreatedAt?: string;
  apiKeyLastUsed?: string;
  quotaStatus?: {
    primary: {
      requestsToday: number;
      isExhausted: boolean;
    };
    backup: {
      requestsToday: number;
      isExhausted: boolean;
    };
  };
}

export function ApiKeysSection({ userId }: { userId: string }) {
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [primaryKey, setPrimaryKey] = useState("");
  const [backupKey, setBackupKey] = useState("");
  const [showPrimaryKey, setShowPrimaryKey] = useState(false);
  const [showBackupKey, setShowBackupKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    primary?: { valid: boolean; message: string };
    backup?: { valid: boolean; message: string };
  }>({});
  const { toast } = useToast();

  // Load existing API key data
  useEffect(() => {
    loadApiKeyData();
  }, []);

  async function loadApiKeyData() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/api-keys");

      if (response.ok) {
        const data = await response.json();
        setApiKeyData(data);
      } else {
        throw new Error("Failed to load API key data");
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API key data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function validateKeys() {
    if (!primaryKey && !backupKey) {
      toast({
        title: "No keys to validate",
        description: "Please enter at least one API key",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({});

    try {
      const response = await fetch("/api/user/validate-youtube-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryKey: primaryKey || undefined,
          backupKey: backupKey || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setValidationResult(result);

        const allValid =
          (!primaryKey || result.primary?.valid) &&
          (!backupKey || result.backup?.valid);

        if (allValid) {
          toast({
            title: "Validation Successful",
            description: "All API keys are valid and working",
          });
        } else {
          toast({
            title: "Validation Failed",
            description: "One or more API keys are invalid",
            variant: "destructive",
          });
        }
      } else {
        throw new Error(result.error || "Validation failed");
      }
    } catch (error) {
      console.error("Error validating keys:", error);
      toast({
        title: "Validation Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to validate API keys",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }

  async function saveApiKeys() {
    if (
      !primaryKey &&
      !backupKey &&
      !apiKeyData?.hasPrimaryKey &&
      !apiKeyData?.hasBackupKey
    ) {
      toast({
        title: "No changes",
        description: "Please enter at least one API key",
        variant: "destructive",
      });
      return;
    }

    // Validate before saving if new keys are entered
    if (
      (primaryKey || backupKey) &&
      !validationResult.primary &&
      !validationResult.backup
    ) {
      toast({
        title: "Validate First",
        description: "Please validate your API keys before saving",
        variant: "destructive",
      });
      return;
    }

    // Check validation results
    if (validationResult.primary && !validationResult.primary.valid) {
      toast({
        title: "Invalid Primary Key",
        description: validationResult.primary.message,
        variant: "destructive",
      });
      return;
    }

    if (validationResult.backup && !validationResult.backup.valid) {
      toast({
        title: "Invalid Backup Key",
        description: validationResult.backup.message,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryKey: primaryKey || undefined,
          backupKey: backupKey || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "API keys saved successfully",
        });

        // Reload API key data
        await loadApiKeyData();

        // Clear input fields
        setPrimaryKey("");
        setBackupKey("");
        setValidationResult({});
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save API keys");
      }
    } catch (error) {
      console.error("Error saving keys:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save API keys",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteApiKey(type: "primary" | "backup") {
    if (!confirm(`Are you sure you want to delete your ${type} API key?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/user/api-keys?type=${type}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } API key deleted`,
        });

        await loadApiKeyData();
      } else {
        throw new Error("Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting key:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>YouTube API Keys</CardTitle>
          <CardDescription>
            Manage your personal YouTube Data API keys to sync your sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Using your own YouTube API keys is optional. If you don't provide
              your own keys, the platform will use shared keys with limited
              quota. Personal keys give you dedicated quota and better
              reliability.
            </AlertDescription>
          </Alert>

          {/* Quota Status */}
          {apiKeyData?.quotaStatus && (
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm">Quota Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Primary Key
                    </span>
                    {apiKeyData.quotaStatus.primary.isExhausted ? (
                      <Badge variant="destructive">Exhausted</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {apiKeyData.quotaStatus.primary.requestsToday.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    requests today
                  </p>
                </div>
                {apiKeyData.hasBackupKey && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        Backup Key
                      </span>
                      {apiKeyData.quotaStatus.backup.isExhausted ? (
                        <Badge variant="destructive">Exhausted</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold">
                      {apiKeyData.quotaStatus.backup.requestsToday.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      requests today
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Keys Display */}
          {(apiKeyData?.hasPrimaryKey || apiKeyData?.hasBackupKey) && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Current API Keys</h3>

              {apiKeyData.hasPrimaryKey && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Primary API Key</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey("primary")}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {apiKeyData.maskedPrimaryKey}
                  </p>
                  {apiKeyData.apiKeyLastUsed && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last used:{" "}
                      {new Date(apiKeyData.apiKeyLastUsed).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {apiKeyData.hasBackupKey && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Backup API Key</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteApiKey("backup")}
                    >
                      Delete
                    </Button>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {apiKeyData.maskedBackupKey}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Add/Update Keys Form */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">
              {apiKeyData?.hasPrimaryKey ? "Update" : "Add"} API Keys
            </h3>

            {/* Primary Key */}
            <div className="space-y-2">
              <Label htmlFor="primary-key">Primary API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="primary-key"
                    type={showPrimaryKey ? "text" : "password"}
                    value={primaryKey}
                    onChange={(e) => {
                      setPrimaryKey(e.target.value);
                      setValidationResult({});
                    }}
                    placeholder="AIza..."
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPrimaryKey(!showPrimaryKey)}
                  >
                    {showPrimaryKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {validationResult.primary && (
                <div className="flex items-center gap-2 text-sm">
                  {validationResult.primary.valid ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">
                        {validationResult.primary.message}
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">
                        {validationResult.primary.message}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Backup Key */}
            <div className="space-y-2">
              <Label htmlFor="backup-key">Backup API Key (Optional)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="backup-key"
                    type={showBackupKey ? "text" : "password"}
                    value={backupKey}
                    onChange={(e) => {
                      setBackupKey(e.target.value);
                      setValidationResult({});
                    }}
                    placeholder="AIza..."
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowBackupKey(!showBackupKey)}
                  >
                    {showBackupKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {validationResult.backup && (
                <div className="flex items-center gap-2 text-sm">
                  {validationResult.backup.valid ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">
                        {validationResult.backup.message}
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">
                        {validationResult.backup.message}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={validateKeys}
                disabled={(!primaryKey && !backupKey) || isValidating}
                variant="outline"
              >
                {isValidating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Validate Keys
              </Button>
              <Button
                onClick={saveApiKeys}
                disabled={(!primaryKey && !backupKey) || isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save API Keys
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <ApiKeyInstructions />
    </div>
  );
}
