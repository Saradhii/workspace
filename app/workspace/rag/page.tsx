"use client";

import { Database, FileText, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";

export default function RAGPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12 px-2">

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 px-2">
            Vector Search &<br />
            <AuroraText
              colors={["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"]}
              speed={1.5}
            >
              Augmented Generation
            </AuroraText>
            <br />
            on Your Data
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto text-center">
            <span className="text-blue-400"> Coming soon!</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Upload className="h-6 w-6" />}
            title="Data Ingestion"
            description="Convert documents into vector embeddings for semantic search"
            disabled
          />
          <FeatureCard
            icon={<Search className="h-6 w-6" />}
            title="Semantic Retrieval"
            description="Query your knowledge base with context-aware AI responses"
            disabled
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Source Attribution"
            description="Retrieve responses with precise source document references"
            disabled
          />
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Under Development</span>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            This feature will allow you to create embeddings from your documents using Ollama Cloud
          </p>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}

function FeatureCard({ icon, title, description, disabled = false }: FeatureCardProps) {
  return (
    <div className={`relative group ${
      disabled ? 'opacity-50' : ''
    }`}>
      <div className="relative h-full p-6 rounded-2xl border border-gray-600/30 bg-gradient-to-b from-gray-900/50 to-black/50 transition-all duration-300 hover:border-blue-500/30">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-3 rounded-xl border ${
            disabled
              ? 'border-gray-600 bg-gray-800/50'
              : 'border-blue-500/30 bg-blue-500/10'
          } transition-all duration-300`}>
            <div className={disabled ? 'text-gray-500' : 'text-blue-400'}>
              {icon}
            </div>
          </div>

          <h3 className={`text-lg font-semibold ${
            disabled ? 'text-gray-500' : 'text-white'
          }`}>
            {title}
          </h3>

          <p className="text-sm text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}