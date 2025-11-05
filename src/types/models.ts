// Base model interface to ensure consistency across all model types
export interface BaseModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  provider: string;
}

// Extend base interfaces with BaseModel
export interface TextModel extends BaseModel {
  context_length: number;
  supports_reasoning?: boolean;
}

export interface CodeModel extends BaseModel {
  context_length: number;
  specialty?: string;
  supports_reasoning?: boolean;
  display_name?: string; // Deprecated alias for displayName
}

export interface ImageModel extends BaseModel {
  max_width?: number;
  max_height?: number;
  supported_formats?: string[];
  features?: string[];
  color?: string; // For UI display
}