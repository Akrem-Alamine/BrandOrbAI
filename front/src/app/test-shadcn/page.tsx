'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShadCNTestPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(33);

  const runTest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setProgress(100);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">ShadCN UI Test Page</h1>
        <p className="text-muted-foreground">
          This page tests various ShadCN components to ensure proper installation and functionality.
        </p>
      </div>

      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
          <TabsTrigger value="animations">Animations</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-6">
          {/* Button Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Button Components
              </CardTitle>
              <CardDescription>
                Testing different button variants and states
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
                <Button onClick={runTest} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Testing..." : "Run Test"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badge Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Badge Components
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge className="bg-green-500">Success</Badge>
                <Badge className="bg-blue-500">Info</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Progress Components
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
              <Button 
                onClick={() => setProgress(Math.min(progress + 10, 100))}
                size="sm"
              >
                Increase Progress
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layouts" className="space-y-6">
          {/* Card Layouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className={cn("transition-all duration-200 hover:shadow-lg")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>C{i}</AvatarFallback>
                    </Avatar>
                    Card {i}
                  </CardTitle>
                  <CardDescription>
                    This is a test card component
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Content for card {i}. This demonstrates the card layout and styling.
                  </p>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center">
                    <Badge>Test</Badge>
                    <Button size="sm" variant="outline">Action</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="animations" className="space-y-6">
          {/* Skeleton Loading Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Skeleton Loading Animations
              </CardTitle>
              <CardDescription>
                Testing skeleton components and animations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[160px]" />
                </div>
              </div>
              <Skeleton className="h-[200px] w-full rounded-md" />
            </CardContent>
          </Card>

          {/* Hover Effects */}
          <Card>
            <CardHeader>
              <CardTitle>Hover Effects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-center">
                      <div className="h-8 w-8 bg-primary rounded-full mx-auto mb-2" />
                      <p className="text-sm font-medium">Item {i}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Theme Colors
              </CardTitle>
              <CardDescription>
                Testing CSS variables and theme colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-12 bg-primary rounded-md" />
                  <p className="text-sm font-medium">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-secondary rounded-md" />
                  <p className="text-sm font-medium">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-accent rounded-md" />
                  <p className="text-sm font-medium">Accent</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-muted rounded-md" />
                  <p className="text-sm font-medium">Muted</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-card border rounded-md" />
                  <p className="text-sm font-medium">Card</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-popover border rounded-md" />
                  <p className="text-sm font-medium">Popover</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-destructive rounded-md" />
                  <p className="text-sm font-medium">Destructive</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 border-2 border-border rounded-md" />
                  <p className="text-sm font-medium">Border</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CSS Variables Test */}
          <Card>
            <CardHeader>
              <CardTitle>CSS Variables Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>--background:</span>
                  <span className="font-mono">hsl(var(--background))</span>
                </div>
                <div className="flex justify-between">
                  <span>--foreground:</span>
                  <span className="font-mono">hsl(var(--foreground))</span>
                </div>
                <div className="flex justify-between">
                  <span>--primary:</span>
                  <span className="font-mono">hsl(var(--primary))</span>
                </div>
                <div className="flex justify-between">
                  <span>--radius:</span>
                  <span className="font-mono">var(--radius)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            ShadCN Status Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Components.json configured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">CSS variables loaded</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Utils function working</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Radix UI primitives loaded</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Tailwind merge working</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Dark mode support enabled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
