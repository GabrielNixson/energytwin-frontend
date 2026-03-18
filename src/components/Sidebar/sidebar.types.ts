import React from "react";

export type SidebarOption = {
  label: string;
  route: string;
  icon: React.ComponentType;
};

export type OptionsType = SidebarOption[];
