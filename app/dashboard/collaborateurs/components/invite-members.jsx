"use client";

import { useId, useRef, useState } from "react";
import { CheckIcon, CopyIcon, UserRoundPlusIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { InputEmail } from "@/src/components/ui/input";

export default function InviteMembers({ open, onOpenChange }) {
  const id = useId();
  const [emails, setEmails] = useState([
    "mark@yourcompany.com",
    "jane@yourcompany.com",
    "",
  ]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const lastInputRef = useRef(null);

  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">
          Inviter des membres
        </Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          lastInputRef.current?.focus();
        }}
      >
        <div className="flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <UserRoundPlusIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Inviter des membres</DialogTitle>
            <DialogDescription className="text-left">
              Inviter des membres pour qu'ils puissent utiliser les composants
              gratuitement.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-4">
            <div className="*:not-first:mt-2">
              <Label>Inviter via email</Label>
              <div className="space-y-3">
                {emails.map((email, index) => (
                  <InputEmail
                    key={index}
                    id={`team-email-${index + 1}`}
                    placeholder="hi@yourcompany.com"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    ref={index === emails.length - 1 ? lastInputRef : undefined}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={addEmail}
              className="text-sm underline hover:no-underline"
            >
              + Ajouter un autre
            </button>
          </div>
          <Button type="button" className="w-full">
            Envoyer les invitations
          </Button>
        </form>

        {/* <hr className="my-1 border-t" /> */}

        {/* <div className="*:not-first:mt-2">
          <Label htmlFor={id}>Invite via magic link</Label>
          <div className="relative">
            <Input
              ref={inputRef}
              id={id}
              className="pe-9"
              type="text"
              defaultValue="https://originui.com/refer/87689"
              readOnly
            />
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopy}
                    className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed"
                    aria-label={copied ? "Copied" : "Copy to clipboard"}
                    disabled={copied}
                  >
                    <div
                      className={cn(
                        "transition-all",
                        copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                      )}
                    >
                      <CheckIcon
                        className="stroke-emerald-500"
                        size={16}
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className={cn(
                        "absolute transition-all",
                        copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                      )}
                    >
                      <CopyIcon size={16} aria-hidden="true" />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="px-2 py-1 text-xs">
                  Copy to clipboard
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}
