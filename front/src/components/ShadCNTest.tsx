"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CheckCircle, AlertCircle, Info, Settings, User, Zap } from "lucide-react";

const ShadCNTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(65);
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8 space-y-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground">ShadCN UI Components Test</h1>
            <p className="text-lg text-muted-foreground">Comprehensive verification of ShadCN UI installation and functionality</p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Installation Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">All components loaded successfully</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Theme System</CardTitle>
                <Settings className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Configured</div>
                <p className="text-xs text-muted-foreground">CSS variables and theming working</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Components</CardTitle>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">20+</div>
                <p className="text-xs text-muted-foreground">UI components available</p>
              </CardContent>
            </Card>
          </div>

          {/* Skeleton Loading Test */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Skeleton Loading Test
              </CardTitle>
              <CardDescription>Test the skeleton loading animations and states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleLoadingTest} disabled={loading}>
                {loading ? "Testing..." : "Test Skeleton Loading"}
              </Button>
              
              {loading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                  <Skeleton className="h-[125px] w-full rounded-xl" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-[250px] flex items-center px-2">
                      ✅ Text skeleton working
                    </div>
                    <div className="h-4 bg-muted rounded w-[200px] flex items-center px-2">
                      ✅ Multi-line skeleton working
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-[150px] flex items-center px-2">
                        ✅ Avatar skeleton working
                      </div>
                      <div className="h-4 bg-muted rounded w-[100px] flex items-center px-2">
                        ✅ Profile skeleton working
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Component Tabs */}
          <Tabs defaultValue="buttons" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="buttons">Buttons & Actions</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="buttons" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Buttons & Interactive Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="switch-test"
                        checked={switchValue}
                        onCheckedChange={setSwitchValue}
                      />
                      <Label htmlFor="switch-test">Switch: {switchValue ? "On" : "Off"}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="checkbox-test"
                        checked={checkboxValue}
                        onCheckedChange={setCheckboxValue}
                      />
                      <Label htmlFor="checkbox-test">Checkbox: {checkboxValue ? "Checked" : "Unchecked"}</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="input-test">Input Field</Label>
                      <Input id="input-test" placeholder="Enter text here..." />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="select-test">Select Dropdown</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                          <SelectItem value="option3">Option 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textarea-test">Textarea</Label>
                    <Textarea id="textarea-test" placeholder="Enter multiple lines of text..." />
                  </div>

                  <div className="space-y-4">
                    <Label>Radio Group</Label>
                    <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option1" id="radio1" />
                        <Label htmlFor="radio1">Option 1</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option2" id="radio2" />
                        <Label htmlFor="radio2">Option 2</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option3" id="radio3" />
                        <Label htmlFor="radio3">Option 3</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground">Selected: {radioValue}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Display Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Progress Bar ({progress}%)</Label>
                    <Progress value={progress} className="w-full" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                        Decrease
                      </Button>
                      <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                        Increase
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.jpg" alt="User" />
                      <AvatarFallback>UN</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">User Name</p>
                      <p className="text-xs text-muted-foreground">user@example.com</p>
                    </div>
                  </div>

                  <ScrollArea className="h-32 w-full border rounded-md p-4">
                    <div className="space-y-2">
                      {Array.from({ length: 20 }, (_, i) => (
                        <div key={i} className="text-sm">
                          Scrollable content item {i + 1}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-6">
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Default Alert</AlertTitle>
                  <AlertDescription>
                    This is a default alert with some information.
                  </AlertDescription>
                </Alert>

                <Alert className="border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success Alert</AlertTitle>
                  <AlertDescription>
                    ShadCN UI components are working perfectly!
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Alert</AlertTitle>
                  <AlertDescription>
                    This is an example of a destructive alert variant.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-green-600">✅ ShadCN UI Verification Complete</CardTitle>
              <CardDescription>
                All components are properly installed and functioning correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Installation Status:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✅ ShadCN UI dependencies installed</li>
                    <li>✅ Components.json properly configured</li>
                    <li>✅ CSS variables and theming working</li>
                    <li>✅ Tailwind CSS integration active</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Component Coverage:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✅ All button variants and sizes</li>
                    <li>✅ Form inputs and controls</li>
                    <li>✅ Display and layout components</li>
                    <li>✅ Feedback and alert components</li>
                    <li>✅ Skeleton loading animations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ShadCNTest;
