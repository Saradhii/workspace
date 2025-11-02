"use client";

import { motion } from "framer-motion";
import { Code, Sparkles, Database, Zap, Lightbulb, Shield, TrendingUp } from "lucide-react";

interface SuggestedActionsProps {
  onActionClick: (action: string) => void;
  className?: string;
}

export function SuggestedActions({ onActionClick, className }: SuggestedActionsProps) {
  const suggestions = [
    {
      icon: <Code className="h-4 w-4" />,
      text: "Create a React component with hooks",
      action: "Create a React component with useState, useEffect, and custom hooks for state management",
    },
    {
      icon: <Database className="h-4 w-4" />,
      text: "Build a REST API server",
      action: "Build an Express.js server with CRUD operations for a database",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      text: "Sort an array using algorithms",
      action: "Implement quick sort, bubble sort, merge sort, and binary search algorithms",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      text: "Add authentication middleware",
      action: "Create JWT authentication with login, registration, and protected routes",
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      text: "Create a responsive dashboard",
      action: "Build a responsive admin dashboard with charts and data visualization",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      text: "Implement lazy loading",
      action: "Add React.lazy, Suspense, and error boundaries for better performance",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      text: "Add unit tests",
      action: "Write unit tests for your components using Jest or React Testing Library",
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={suggestion.text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onActionClick(suggestion.action)}
          className="group cursor-pointer"
        >
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl border border-border bg-background hover:bg-muted transition-all duration-200 hover:scale-105">
            <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10">
              {suggestion.icon}
            </div>
            <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
              {suggestion.text}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {suggestion.action}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}