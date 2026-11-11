"use client";

import React from "react";
import { Icon, IconName } from "./Icon";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  count?: number;
  disabled?: boolean;
}

interface TabsNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabsNav({ tabs, activeTab, onChange, className = "" }: TabsNavProps) {
  return (
    <div
      className={`bg-white rounded-[12px] border border-[#E5E7EB] shadow-xs px-4 pt-1 flex items-center ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`relative py-3 px-1 text-[13px] leading-[20px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? "text-[#7C3AED] font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab.icon && (
                <Icon
                  name={tab.icon}
                  size={18}
                  className={isActive ? "text-[#7C3AED]" : "text-[#6B7280]"}
                />
              )}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[11px] leading-[14px] font-semibold px-1.5 py-0.5 rounded-full font-mono ${
                    isActive
                      ? "bg-[#EDE9FE] text-[#7C3AED]"
                      : "bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
