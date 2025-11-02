import React from "react";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  ChevronDown,
  Cpu,
  X,
  Lock,
  Globe,
  Menu,
  Plus,
  User
} from "lucide-react";

export const ArrowUpIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <ArrowUp size={size} {...props} />;
};

export const StopIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Square size={size} {...props} />;
};

export const PaperclipIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Paperclip size={size} className="-rotate-45" {...props} />;
};

export const ChevronDownIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <ChevronDown size={size} {...props} />;
};

export const CpuIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Cpu size={size} {...props} />;
};

export const CrossSmallIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <X size={size} {...props} />;
};

export const LockIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Lock size={size} {...props} />;
};

export const GlobeIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Globe size={size} {...props} />;
};

export const SidebarLeftIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Menu size={size} {...props} />;
};

export const PlusIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <Plus size={size} {...props} />;
};

export const SparklesIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    style={{ color: "currentcolor" }}
    viewBox="0 0 16 16"
    width={size}
  >
    <path
      d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z"
      fill="currentColor"
    />
    <path
      d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z"
      fill="currentColor"
    />
    <path
      d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z"
      fill="currentColor"
    />
  </svg>
);

export const UserIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return <User size={size} {...props} />;
};

export const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    style={{ color: "currentcolor" }}
    viewBox="0 0 16 16"
    width={size}
  >
    <path
      clipRule="evenodd"
      d="M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const PencilEditIcon = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      height={size}
      strokeLinejoin="round"
      style={{ color: "currentcolor" }}
      viewBox="0 0 16 16"
      width={size}
    >
      <path
        clipRule="evenodd"
        d="M11.75 0.189331L12.2803 0.719661L15.2803 3.71966L15.8107 4.24999L15.2803 4.78032L5.15901 14.9016C4.45575 15.6049 3.50192 16 2.50736 16H0.75H0V15.25V13.4926C0 12.4981 0.395088 11.5442 1.09835 10.841L11.2197 0.719661L11.75 0.189331ZM11.75 2.31065L9.81066 4.24999L11.75 6.18933L13.6893 4.24999L11.75 2.31065ZM2.15901 11.9016L8.75 5.31065L10.6893 7.24999L4.09835 13.841C3.67639 14.2629 3.1041 14.5 2.50736 14.5H1.5V13.4926C1.5 12.8959 1.73705 12.3236 2.15901 11.9016ZM9 16H16V14.5H9V16Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const VercelIcon = ({
  size = 14,
  ...props
}: { size?: number } & React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      height={size}
      viewBox="0 0 76 65"
      width={size}
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M25.7309 0L0.324951 65H11.431L25.7309 27.754L40.0308 65H51.1368L25.7309 0Z"
        fill="currentColor"
      />
      <path
        clipRule="evenodd"
        d="M56.2515 0L37.7572 47.25H48.8632L67.3575 0H56.2515Z"
        fill="currentColor"
        fillOpacity="0.7"
      />
    </svg>
  );
};

export const StopButton = ({ size, ...props }: ComponentProps<typeof Button> & { size?: number }) => {
  const buttonSize = size ?? 12;
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      {...props}
    >
      <StopIcon size={buttonSize} />
    </Button>
  );
};