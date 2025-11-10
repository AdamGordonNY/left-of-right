"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink } from "lucide-react";

export function ApiKeyInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to Get a YouTube API Key</CardTitle>
        <CardDescription>
          Follow these steps to create your own YouTube Data API v3 key from
          Google Cloud Console
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Why do I need my own API key?</strong>
            <br />
            YouTube has strict daily quota limits (10,000 units/day). By using
            your own API key, you get your own dedicated quota instead of
            sharing limited quota with all users.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              Step 1: Create a Google Cloud Project
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>
                Go to the{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Google Cloud Console
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Sign in with your Google account</li>
              <li>
                Click "Select a project" in the top bar, then "New Project"
              </li>
              <li>Name your project (e.g., "Left of Right YouTube API")</li>
              <li>Click "Create"</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Step 2: Enable YouTube Data API v3</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>
                With your project selected, go to{" "}
                <a
                  href="https://console.cloud.google.com/apis/library"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  API Library
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Search for "YouTube Data API v3"</li>
              <li>Click on "YouTube Data API v3" in the results</li>
              <li>Click the "Enable" button</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Step 3: Create API Credentials</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Credentials
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Click "Create Credentials" → "API key"</li>
              <li>Your API key will be created and displayed</li>
              <li>
                <strong>Important:</strong> Click "Restrict Key" to secure your
                API key
              </li>
              <li>Under "API restrictions", select "Restrict key"</li>
              <li>Choose "YouTube Data API v3" from the dropdown</li>
              <li>Click "Save"</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Step 4: Copy Your API Key</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
              <li>Copy your API key from the Google Cloud Console</li>
              <li>Paste it into the "Primary API Key" field above</li>
              <li>Click "Validate Keys" to test it</li>
              <li>Click "Save API Keys" to store it securely</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Optional: Create a Backup Key</h4>
            <p className="text-sm text-muted-foreground ml-4">
              For better reliability, you can create a second API key following
              the same steps above. This backup key will be used automatically
              if your primary key reaches its quota limit.
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Security Note:</strong> Your API keys are encrypted before
            being stored in our database. Never share your API keys with anyone
            else.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border p-4 bg-muted/50">
          <h4 className="font-medium mb-2 text-sm">Quota Information</h4>
          <p className="text-sm text-muted-foreground">
            The YouTube Data API has a quota limit of 10,000 units per day.
            Different operations cost different amounts:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 ml-4 space-y-1">
            <li>Reading channel information: ~1 unit</li>
            <li>Reading video list: ~1 unit per request</li>
            <li>Reading playlist items: ~1 unit per request</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Your quota resets at midnight Pacific Time. The system will
            automatically use your backup key if your primary key is exhausted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
