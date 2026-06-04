"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type React from "react"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { SpinnerInfinity } from "spinners-react"
import { useSetRoleMutation } from "@/query/authMutation"
import { toast } from "sonner"

interface RoleCardProps {
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
  illustration: React.ReactNode
  accentColor: string
  badgeColor: string
}

function RoleCard({ title, description, isSelected, onClick, illustration, accentColor, badgeColor }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg p-5 text-left",
        "border border-border",
        "bg-card text-card-foreground shadow-sm hover:shadow-[0_8px_10px_rgba(3,98,76,0.25)]",
        isSelected ? "border-primary bg-primary/5" : "border-border",
         "transition-all duration-200"
      )}
    >
      {/* Content wrapper */}
      <div className="relative z-10">

        {/* <span className={cn(badgeColor, "inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4")}>
          {title}
        </span> */}

        {/* Illustration */}
        <div className="h-16 w-16 mb-4 mx-auto opacity-90">{illustration}</div>

        {/* Text Content */}
        <h3 className="text-xl font-semibold text-foreground mb-1 font-sans">{title}</h3>
        <p className="text-sm text-foreground/75 mb-4 leading-relaxed font-sans">{description}</p>

        {/* Selection indicator */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
              isSelected ? "border-primary bg-primary" : "border-border",
            )}
          >
            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
          <span className="text-sm font-medium text-muted-foreground font-sans">
            {isSelected ? "Selected" : "Select"}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function CompleteProfile() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const setRoleMutation = useSetRoleMutation();
  const router = useRouter();

  const handleContinue = () => {
    if (!selectedRole) return;
    setRoleMutation.mutate({ role: selectedRole },
      {
        onSuccess: () => {
          if (selectedRole === "learner") {
            router.replace("/learner-dashboard");
          } else {
            router.replace("/dashboard");
          }
        },
        onError: () => {
          toast.error("Could not update role. Please try again.");
        }
      }
    )
  };


  if (setRoleMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <SpinnerInfinity
          thickness={100}
          secondaryColor="var(--muted)"
          color="var(--primary)"
          size={90}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-6 py-12 bg-background font-sans min-h-[calc(100vh-6rem)]">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            <span className="text-balance font-sans">Complete your profile</span>
          </h1>
          <p className="text-md text-foreground/70">Choose your role to personalize your learning experience</p>
        </div>

        {/* Cards Section */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <RoleCard
            title="Helper"
            description="Share your knowledge and help others learn"
            isSelected={selectedRole === "helper"}
            onClick={() => setSelectedRole("helper")}
            illustration={
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Helper illustration - mentor/teacher figure */}
                <circle cx="100" cy="50" r="25" fill="var(--primary)" opacity="0.8" />
                <path
                  d="M75 80 Q100 95 125 80 L130 140 Q115 160 100 165 Q85 160 70 140 Z"
                  fill="var(--primary)"
                  opacity="0.7"
                />
                <circle cx="60" cy="85" r="8" fill="var(--primary)" opacity="0.6" />
                <circle cx="140" cy="85" r="8" fill="var(--primary)" opacity="0.6" />
                {/* Knowledge rays */}
                <line x1="100" y1="20" x2="100" y2="5" stroke="var(--primary)" strokeWidth="2" opacity="0.5" />
                <line x1="130" y1="30" x2="140" y2="20" stroke="var(--primary)" strokeWidth="2" opacity="0.5" />
                <line x1="70" y1="30" x2="60" y2="20" stroke="var(--primary)" strokeWidth="2" opacity="0.5" />
              </svg>
            }
            accentColor="from-accent to-muted"
            badgeColor="bg-muted text-muted-foreground"
          />

          <RoleCard
            title="Learner"
            description="Expand your skills and grow with community support"
            isSelected={selectedRole === "learner"}
            onClick={() => setSelectedRole("learner")}
            illustration={
              <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Learner illustration - student figure */}
                <path d="M60 40 L100 20 L140 40 L120 55 L100 45 L80 55 Z" fill="var(--primary)" opacity="0.8" />
                <circle cx="100" cy="70" r="22" fill="var(--primary)" opacity="0.7" />
                <path
                  d="M80 95 Q100 105 120 95 L125 145 Q110 165 100 170 Q90 165 75 145 Z"
                  fill="var(--primary)"
                  opacity="0.6"
                />
                <circle cx="70" cy="100" r="7" fill="var(--primary)" opacity="0.5" />
                <circle cx="130" cy="100" r="7" fill="var(--primary)" opacity="0.5" />
                {/* Book/growth elements */}
                <rect x="55" y="115" width="20" height="25" fill="var(--primary)" opacity="0.5" />
                <rect x="125" y="115" width="20" height="25" fill="var(--primary)" opacity="0.5" />
              </svg>
            }
            accentColor="from-accent to-muted"
            badgeColor="bg-muted text-muted-foreground"
          />
        </div>

        {/* Footer Section */}
        <div className="flex flex-col font-sans font-semibold sm:flex-row gap-3 justify-between items-center pt-2">
          <p className="text-sm text-foreground/70">
            {selectedRole
              ? `You selected -> ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              : "Select a role to continue"}
          </p>
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            size="lg"
            className="w-full sm:w-auto rounded-sm shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary"
          >
            Continue <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
