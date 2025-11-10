"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, Brain, Search, Sparkles, ExternalLink, Key } from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  timestamp: string;
  results: {
    availableModels?: Array<{
      id: string;
      name: string;
      description: string;
      dimensions: number;
    }>;
    freeTierInfo?: {
      provider: string;
      freeRequestsPerMonth: string;
      rateLimit: string;
      modelsAvailable: number;
      note: string;
    };
    [modelName: string]: any;
  };
  errors: string[];
  summary: {
    totalModels: number;
    workingModels: number;
    failedModels: number;
  };
  provider: string;
}

interface SimilarityResult {
  provider: string;
  model: string;
  texts: string[];
  similarityMatrix: number[][];
  mostSimilar: Array<{
    text1: string;
    text2: string;
    similarity: number;
  }>;
  embeddingDimensions: number;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export default function HFEmbeddingTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [similarityResult, setSimilarityResult] = useState<SimilarityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testTexts, setTestTexts] = useState([
    "What is artificial intelligence?",
    "Machine learning is a subset of AI",
    "Deep learning uses neural networks",
    "The sky is blue during daytime",
    "Python is a programming language"
  ]);

  async function runEmbeddingTest() {
    setLoading(true);
    try {
      const response = await fetch('/api/test-hf-embeddings');
      const result = await response.json();

      if (response.ok) {
        setTestResult(result);

        if (result.summary.workingModels > 0) {
          toast.success(`✅ ${result.summary.workingModels}/${result.summary.totalModels} HF models working!`);
        } else {
          toast.error('❌ No Hugging Face models are working. Check API key.');
        }
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to run Hugging Face embedding test.');
    }
    setLoading(false);
  }

  async function testSimilarity() {
    if (!testTexts || testTexts.length < 2) {
      toast.error('Please provide at least 2 texts to compare');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-hf-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: testTexts,
          model: 'sentence-transformers/all-MiniLM-L6-v2'
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSimilarityResult(result);
        toast.success('Similarity test completed!');
      } else {
        toast.error(`Similarity test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Similarity test error:', error);
      toast.error('Failed to test similarity');
    }
    setLoading(false);
  }

  useEffect(() => {
    // Run test on page load
    runEmbeddingTest();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Hugging Face Embeddings Test</h1>
        <p className="text-muted-foreground">
          Test free embedding models from Hugging Face Inference API
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Model Test</TabsTrigger>
          <TabsTrigger value="similarity">Similarity Test</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Hugging Face Embedding Models
              </CardTitle>
              <CardDescription>
                Test free embedding models from Hugging Face
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runEmbeddingTest}
                disabled={loading}
                className="mb-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Run HF Embedding Test'
                )}
              </Button>

              {/* Free Tier Info */}
              {testResult?.results?.freeTierInfo && (
                <Card className="mb-4 border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      Free Tier Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium">Provider:</span>
                        <p>{testResult.results.freeTierInfo.provider}</p>
                      </div>
                      <div>
                        <span className="font-medium">Free Requests:</span>
                        <p>{testResult.results.freeTierInfo.freeRequestsPerMonth}/month</p>
                      </div>
                      <div>
                        <span className="font-medium">Rate Limit:</span>
                        <p>{testResult.results.freeTierInfo.rateLimit}</p>
                      </div>
                      <div>
                        <span className="font-medium">Models:</span>
                        <p>{testResult.results.freeTierInfo.modelsAvailable} available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {testResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{testResult.summary.totalModels}</div>
                        <div className="text-sm text-muted-foreground">Total Models</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{testResult.summary.workingModels}</div>
                        <div className="text-sm text-muted-foreground">Working</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{testResult.summary.failedModels}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Model Results */}
                  {['sentence-transformers/all-MiniLM-L6-v2', 'BAAI/bge-small-en-v1.5', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'].map(modelName => {
                    const model = testResult.results[modelName];
                    if (!model) return null;

                    return (
                      <Card key={modelName}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span className="text-base">{model.modelName}</span>
                            {model.embeddingGenerated ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {model.embeddingGenerated ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm">Dimensions:</span>
                                <Badge variant="secondary">{model.dimensions}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Sample values:</span>
                                <span className="text-xs font-mono">
                                  [{model.sampleValues?.slice(0, 3).join(', ')}...]
                                </span>
                              </div>
                              {model.similarityTest && (
                                <div>
                                  <span className="text-sm">Similarity test:</span>
                                  <div className="text-xs mt-1">
                                    "{model.similarityTest.text1}" vs "{model.similarityTest.text2}"
                                  </div>
                                  <Badge variant="outline" className="mt-1">
                                    Score: {model.similarityTest.score}
                                  </Badge>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-red-500">{model.error}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Available Models List */}
                  {testResult.results.availableModels && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Available HF Models</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {testResult.results.availableModels.map((model: any) => (
                          <div key={model.id} className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium">{model.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{model.dimensions}D</Badge>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="similarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Text Similarity Test
              </CardTitle>
              <CardDescription>
                Test semantic similarity between texts using HF embeddings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Test Texts</label>
                {testTexts.map((text, index) => (
                  <input
                    key={index}
                    type="text"
                    value={text}
                    onChange={(e) => {
                      const newTexts = [...testTexts];
                      newTexts[index] = e.target.value;
                      setTestTexts(newTexts);
                    }}
                    className="w-full p-2 border rounded-md mb-2"
                    placeholder={`Text ${index + 1}`}
                  />
                ))}
              </div>

              <Button onClick={testSimilarity} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Similarity with HF'
                )}
              </Button>

              {similarityResult && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Similarity Matrix</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th></th>
                            {similarityResult.texts.map((_, i) => (
                              <th key={i} className="px-2 py-1">Text {i + 1}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {similarityResult.similarityMatrix.map((row, i) => (
                            <tr key={i}>
                              <td className="font-medium px-2 py-1">Text {i + 1}</td>
                              {row.map((val, j) => (
                                <td
                                  key={j}
                                  className={`px-2 py-1 text-center ${
                                    i === j ? 'bg-green-100 dark:bg-green-900/30' : ''
                                  }`}
                                >
                                  {val.toFixed(3)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Most Similar Pairs</h4>
                    {similarityResult.mostSimilar.map((pair, index) => (
                      <Card key={index} className="mb-2">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="text-sm">"{pair.text1}"</p>
                              <p className="text-sm">"{pair.text2}"</p>
                            </div>
                            <Badge variant={pair.similarity > 0.8 ? 'default' : 'secondary'}>
                              {pair.similarity.toFixed(3)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {similarityResult.usage && (
                    <div className="text-sm text-muted-foreground">
                      <p>Tokens used: {similarityResult.usage.prompt_tokens.toFixed(0)} (prompt)</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Test Results (Raw JSON)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}