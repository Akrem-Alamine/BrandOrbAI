"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { getBMCOutput, parseBMCOutput } from "@/services/agents";
import dynamic from "next/dynamic";

// Dynamically import react-markdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

const noteColors = {
  yellow: "bg-yellow-200 text-yellow-900",
  purple: "bg-purple-200 text-purple-900",
  blue: "bg-blue-200 text-blue-900",
  pink: "bg-pink-200 text-pink-900",
  orange: "bg-orange-200 text-orange-900",
};

const bmcQuestions = {
  "Key Partners": "What are your key partners to get competitive advantage?",
  "Key Activities": "What are the key steps to move ahead to your customers?",
  "Key Resources": "What resources do you need to make your idea work?",
  "Value Propositions": "How will you make your customers' life happier?",
  "Customer Relationships": "How often will you interact with your customers?",
  "Channels": "How are you going to reach your customers?",
  "Customer Segments": "Who are your customers? Describe your target audience in a couple of words.",
  "Cost Structure": "How much are you planning to spend on the product development and marketing for a certain period?",
  "Revenue Streams": "How much are you planning to earn in a certain period? Compare your costs and revenues.",
};

export default function BMCPage() {
  const [bmcData, setBmcData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBMCData();
  }, []);

  const fetchBMCData = async () => {
    try {
      const output = await getBMCOutput();
      const parsed = parseBMCOutput(output);
      setBmcData(parsed);
    } catch (error) {
      console.error('Failed to fetch BMC data:', error);
      // Use empty data if fetch fails
      setBmcData({});
    } finally {
      setLoading(false);
    }
  };

  // Convert BMC data into blocks for rendering
  const bmcBlocks = Object.entries(bmcQuestions).map(([title, question], index) => ({
    title,
    question,
    content: bmcData[title] || "",
    color: Object.keys(noteColors)[index % Object.keys(noteColors).length] as keyof typeof noteColors,
  }));

  const topBlocks = bmcBlocks.slice(0, 7); // First 7 blocks for main grid
  const bottomBlocks = bmcBlocks.slice(7); // Last 2 blocks for bottom

  return (
    <div className="w-full min-h-screen bg-muted/50 flex flex-col items-center py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Business Model Canvas
      </h1>
      
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading Business Model Canvas...</div>
        </div>
      )}

      {!loading && (
        <div className="w-full px-4 mx-auto space-y-8">
          {/* Main BMC grid - 5 columns, 2 rows */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[600px]">
            {/* Key Partners - spans 2 rows */}
            <div className="md:row-span-2">
              <BMCBlock
                title="Key Partners"
                question={bmcQuestions["Key Partners"]}
                content={bmcData["Key Partners"] || ""}
                color="yellow"
                className="h-full"
                isGrid={true}
              />
            </div>

            {/* Key Activities - row 1 */}
            <div>
              <BMCBlock
                title="Key Activities"
                question={bmcQuestions["Key Activities"]}
                content={bmcData["Key Activities"] || ""}
                color="purple"
                className="h-full"
                isGrid={true}
              />
            </div>

            {/* Value Propositions - spans 2 rows */}
            <div className="md:row-span-2">
              <BMCBlock
                title="Value Propositions"
                question={bmcQuestions["Value Propositions"]}
                content={bmcData["Value Propositions"] || ""}
                color="blue"
                className="h-full"
                isGrid={true}
              />
            </div>

            {/* Customer Relationships - row 1 */}
            <div>
              <BMCBlock
                title="Customer Relationships"
                question={bmcQuestions["Customer Relationships"]}
                content={bmcData["Customer Relationships"] || ""}
                color="pink"
                className="h-full"
                isGrid={true}
              />
            </div>

            {/* Customer Segments - spans 2 rows */}
            <div className="md:row-span-2">
              <BMCBlock
                title="Customer Segments"
                question={bmcQuestions["Customer Segments"]}
                content={bmcData["Customer Segments"] || ""}
                color="orange"
                className="h-full"
                isGrid={true}
              />
            </div>

            {/* Key Resources - row 2 */}
            <div>
              <BMCBlock
                title="Key Resources"
                question={bmcQuestions["Key Resources"]}
                content={bmcData["Key Resources"] || ""}
                color="yellow"
                className="h-full"
                isGrid={true}
              />
            </div>

            {/* Channels - row 2 */}
            <div>
              <BMCBlock
                title="Channels"
                question={bmcQuestions["Channels"]}
                content={bmcData["Channels"] || ""}
                color="purple"
                className="h-full"
                isGrid={true}
              />
            </div>
          </div>

          {/* Cost Structure & Revenue Streams - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
            <BMCBlock
              title="Cost Structure"
              question={bmcQuestions["Cost Structure"]}
              content={bmcData["Cost Structure"] || ""}
              color="blue"
              className="h-full"
              isGrid={true}
            />
            <BMCBlock
              title="Revenue Streams"
              question={bmcQuestions["Revenue Streams"]}
              content={bmcData["Revenue Streams"] || ""}
              color="pink"
              className="h-full"
              isGrid={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type BMCBlockProps = {
  title?: string;
  question?: string;
  content?: string;
  color?: keyof typeof noteColors;
  className?: string;
  isGrid?: boolean;
};

function BMCBlock({
  title,
  question,
  content,
  color = "yellow",
  className,
  isGrid = false,
}: BMCBlockProps) {
  if (!title) {
    return (
      <Card className={clsx("rounded-xl shadow-sm", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Function to format content - split by commas and create list items
  const formatContent = (text: string) => {
    if (!text) return null;
    
    // Split by commas and clean up each item
    const items = text.split(',').map(item => item.trim()).filter(item => item.length > 0);
    
    // If there's only one item or it doesn't look like a list, return as is
    if (items.length <= 1 || text.length < 50) {
      return <ReactMarkdown>{text}</ReactMarkdown>;
    }
    
    // Return as a bulleted list
    return (
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="inline-block w-1.5 h-1.5 bg-current rounded-full mt-1.5 mr-2 flex-shrink-0 opacity-60"></span>
            <span className="flex-1 text-sm">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (isGrid) {
    return (
      <Card className={clsx("h-full rounded-xl shadow-sm border border-border bg-card", className)}>
        <div className="p-4 h-full flex flex-col">
          <h3 className="font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{question}</p>
          <div className="flex-1 overflow-y-auto">
            {content ? (
              <div className={`p-3 rounded-xl ${noteColors[color]} shadow-sm`}>
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                  {formatContent(content)}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted text-muted-foreground text-sm shadow-sm">
                No data available
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={clsx("rounded-xl shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-bold mb-2 text-foreground">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {question}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 min-h-[60px]">
        {content ? (
          <div className={`p-3 rounded-lg w-full ${noteColors[color]}`}>
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
              {formatContent(content)}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg w-full bg-gray-100 text-gray-500 text-sm">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
