"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3 } from "lucide-react";

export function BottomTabBar() {
  const pathname = usePathname();
  const activeTab = pathname === "/standings" ? "rankings" : "matches";

  const tabs = [
    { id: "matches" as const, label: "Matches", icon: Activity, href: "/" },
    { id: "rankings" as const, label: "Standings", icon: BarChart3, href: "/standings" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 px-4" style={{ pointerEvents: "none" }}>
      <div
        className="max-w-md mx-auto rounded-2xl"
        style={{
          backgroundColor: "rgba(26, 26, 34, 0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow:
            "0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.02)",
          pointerEvents: "auto"
        }}
      >
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center py-3.5 px-4 relative transition-colors duration-150"
                style={{
                  color: isActive ? "#00ff87" : "#6e6e73",
                  minHeight: "68px"
                }}
              >
                {isActive && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200"
                    style={{
                      width: "32px",
                      backgroundColor: "#00ff87",
                      boxShadow: "0 0 8px rgba(0, 255, 135, 0.3)"
                    }}
                  />
                )}

                <Icon size={24} strokeWidth={1.5} style={{ marginBottom: "6px" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    letterSpacing: "0.01em"
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
