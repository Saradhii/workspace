"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Loader2, CheckCircle, XCircle, Upload, Image, FileText, Settings, Eye } from "lucide-react";
import { toast } from "sonner";

interface OCRModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  supported_formats: string[];
  max_image_size: number;
  features: string[];
  output_formats: string[];
  languages?: string[];
}

interface OCRResult {
  success: boolean;
  text?: string;
  markdown?: string;
  confidence?: number;
  model_used?: string;
  processing_time_ms?: number;
  request_id?: string;
  error?: string;
  error_type?: string;
}

interface ModelStatus {
  available: boolean;
  lastTested?: string;
  error?: string;
}

export default function OCRTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState("deepseek-ai/DeepSeek-OCR");
  const [prompt, setPrompt] = useState("Convert this document to markdown:");
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<OCRModel[]>([]);
  const [modelStatus, setModelStatus] = useState<Record<string, ModelStatus>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available OCR models on mount
  useEffect(() => {
    fetchOCRModels();
  }, []);

  async function fetchOCRModels() {
    try {
      const response = await fetch('/api/ocr/models');
      const data = await response.json();

      if (data.success) {
        setModels(data.models);

        // Initialize model status
        const status: Record<string, ModelStatus> = {};
        data.models.forEach((model: OCRModel) => {
          status[model.id] = { available: false };
        });
        setModelStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch OCR models:', error);
      toast.error('Failed to fetch available OCR models');
    }
  }

  async function testModel(modelId: string) {
    setModelStatus(prev => ({
      ...prev,
      [modelId]: { ...prev[modelId], available: false, lastTested: new Date().toISOString() }
    }));

    try {
      // Create a simple test image (1x1 pixel)
      const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: testImage,
          model: modelId,
          prompt: modelId.includes('DeepSeek') ? 'Test OCR' : 'Extract text:'
        })
      });

      const result = await response.json();

      setModelStatus(prev => ({
        ...prev,
        [modelId]: {
          available: result.success || result.error?.includes('too small'),
          lastTested: new Date().toISOString(),
          error: !result.success && !result.error?.includes('too small') ? result.error : undefined
        }
      }));

      if (result.success) {
        toast.success(`${modelId} is working!`);
      } else {
        toast.error(`${modelId} test failed`);
      }
    } catch (error) {
      setModelStatus(prev => ({
        ...prev,
        [modelId]: {
          available: false,
          lastTested: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Test failed'
        }
      }));
      toast.error(`Failed to test ${modelId}`);
    }
  }

  async function testAllModels() {
    for (const model of models) {
      await testModel(model.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileSelect(fakeEvent);
    }
  }

  async function processOCR() {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    setOcrResult(null);

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          model: selectedModel,
          prompt: prompt
        })
      });

      const result: OCRResult = await response.json();
      setOcrResult(result);

      if (result.success) {
        toast.success('OCR processing completed!');
      } else {
        toast.error(`OCR failed: ${result.error}`);
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Failed to process image');
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OCR Test Page</h1>
        <p className="text-muted-foreground">
          Test optical character recognition with different models and images
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">OCR Test</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Input
                </CardTitle>
                <CardDescription>
                  Upload an image and configure OCR settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-md shadow-sm"
                      />
                      <p className="text-sm text-muted-foreground">
                        Click or drag to replace image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click or drag image here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: JPEG, PNG, WebP (max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Model Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prompt Input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter OCR prompt..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "Convert this document to markdown:" or "Free OCR."
                  </p>
                </div>

                {/* Process Button */}
                <Button
                  onClick={processOCR}
                  disabled={!selectedFile || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Extract Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Output
                </CardTitle>
                <CardDescription>
                  Extracted text and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ocrResult ? (
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {ocrResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {ocrResult.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    {/* Metadata */}
                    {ocrResult.success && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Model:</span>
                          <Badge variant="secondary">{ocrResult.model_used}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Processing Time:</span>
                          <span>{ocrResult.processing_time_ms}ms</span>
                        </div>
                        {ocrResult.confidence && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Confidence:</span>
                            <span>{(ocrResult.confidence * 100).toFixed(1)}%</span>
                          </div>
                        )}
                        {ocrResult.truncated && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-yellow-600">Warning:</span>
                            <span className="text-yellow-600">Response truncated</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {!ocrResult.success && ocrResult.error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{ocrResult.error}</p>
                      </div>
                    )}

                    {/* Extracted Text */}
                    {(ocrResult.text || ocrResult.markdown) && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm">
                          {ocrResult.markdown ? 'Markdown Output:' : 'Text Output:'}
                        </h4>
                        {ocrResult.warning && (
                          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <span className="text-yellow-700">⚠️ {ocrResult.warning}</span>
                          </div>
                        )}
                        <div className="border rounded-md p-3 max-h-96 overflow-y-auto bg-muted/30">
                          {ocrResult.markdown ? (
                            <MarkdownRenderer content={ocrResult.markdown} />
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm">
                              {ocrResult.text}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Upload an image and click "Extract Text" to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Available OCR Models
                </div>
                <Button variant="outline" size="sm" onClick={testAllModels}>
                  Test All
                </Button>
              </CardTitle>
              <CardDescription>
                Test and check status of available OCR models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {models.length > 0 ? (
                <div className="space-y-3">
                  {models.map((model) => {
                    const status = modelStatus[model.id];
                    return (
                      <Card key={model.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-medium">{model.display_name}</h4>
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {model.features.map((feature) => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {status?.available ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : status?.lastTested ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <span className="text-muted-foreground text-sm">Not tested</span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testModel(model.id)}
                            >
                              Test
                            </Button>
                          </div>
                        </div>
                        {status?.error && (
                          <p className="text-sm text-red-500 mt-2">{status.error}</p>
                        )}
                        {status?.lastTested && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last tested: {new Date(status.lastTested).toLocaleString()}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No OCR models available. Check your configuration.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw API Response</CardTitle>
              <CardDescription>
                Complete response from OCR API for debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs max-h-96">
                {ocrResult ? JSON.stringify(ocrResult, null, 2) : 'No results yet'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}