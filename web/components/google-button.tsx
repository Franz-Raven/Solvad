"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentityApi = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    element: HTMLElement,
    options: {
      theme: "outline";
      size: "large";
      shape: "pill";
      text: "signin_with" | "signup_with";
      width: number;
      logo_alignment: "left";
    },
  ) => void;
};

type GoogleCredentialHandler = (credential: string) => void;

let initializedClientId: string | null = null;
let activeHandler: {
  owner: symbol;
  callback: GoogleCredentialHandler;
} | null = null;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdentityApi;
      };
    };
  }
}

function initializeGoogleIdentity(clientId: string) {
  if (!window.google) {
    return false;
  }

  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error("Google Identity Services is already initialized for another client.");
  }

  if (!initializedClientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          activeHandler?.callback(response.credential);
        }
      },
    });
    initializedClientId = clientId;
  }

  return true;
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with";
}

export function GoogleSignInButton({
  onCredential,
  text = "signin_with",
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef(Symbol("google-sign-in-button"));
  const onCredentialRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google) {
      return;
    }

    if (!initializeGoogleIdentity(clientId)) {
      return;
    }

    const owner = ownerRef.current;
    activeHandler = {
      owner,
      callback: (credential) => onCredentialRef.current(credential),
    };

    const button = buttonRef.current;
    button.replaceChildren();
    window.google.accounts.id.renderButton(button, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text,
      width: Math.min(button.clientWidth || 320, 320),
      logo_alignment: "left",
    });

    return () => {
      if (activeHandler?.owner === owner) {
        activeHandler = null;
      }
    };
  }, [clientId, scriptReady, text]);

  return (
    <div className="w-full">
      {clientId ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onReady={() => setScriptReady(true)}
          />
          <div className="mx-auto w-full sm:w-3/4">
            <div ref={buttonRef} className="flex min-h-10 w-full justify-center" />
          </div>
        </>
      ) : (
        <p className="text-center text-xs text-rose-600">
          Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.
        </p>
      )}
    </div>
  );
}
