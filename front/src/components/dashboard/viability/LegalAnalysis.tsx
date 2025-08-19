'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Gavel, Building, Target } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface LegalData {
  risks: string[];
  licenses: string[];
  compliance: string[];
  recommendations: string[];
}

interface LegalAnalysisProps {
  legalData: LegalData | null;
  rawLegal: string;
}

export default function LegalAnalysis({ legalData, rawLegal }: LegalAnalysisProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Legal Analysis & Compliance
          </CardTitle>
          <CardDescription>
            Comprehensive legal assessment including risks, licensing requirements, and compliance guidelines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Legal Summary Cards - Dynamic with real data and improved visuals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Legal Risks */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 bg-red-500/5 dark:bg-red-500/10 rounded-lg border border-red-500/20 dark:border-red-500/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500/10 dark:bg-red-500/20 rounded-lg">
                  <Scale className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {legalData?.risks?.length ? legalData.risks.length : 'N/A'}
                </div>
              </div>
              <h4 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Legal Risks</h4>
              <p className="text-sm text-red-500 dark:text-red-400">
                {!legalData?.risks ? 'No data available' :
                 legalData.risks.length === 0 ? 'No risks identified' : 
                 legalData.risks.length === 1 ? '1 risk identified' :
                 `${legalData.risks.length} risks identified`}
              </p>
              <div className="mt-2 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  !legalData?.risks ? 'bg-gray-500' :
                  legalData.risks.length > 5 ? 'bg-red-500' :
                  legalData.risks.length > 2 ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {!legalData?.risks ? 'Data unavailable' :
                   legalData.risks.length > 5 ? 'High risk level' :
                   legalData.risks.length > 2 ? 'Medium risk level' : 'Low risk level'}
                </span>
              </div>
            </motion.div>

            {/* Licenses Required */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg border border-blue-500/20 dark:border-blue-500/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                  <Gavel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {legalData?.licenses?.length ? legalData.licenses.length : 'N/A'}
                </div>
              </div>
              <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-400 mb-2">Licenses Required</h4>
              <p className="text-sm text-blue-500 dark:text-blue-400">
                {!legalData?.licenses ? 'No data available' :
                 legalData.licenses.length === 0 ? 'No licenses required' : 
                 legalData.licenses.length === 1 ? '1 license required' :
                 `${legalData.licenses.length} licenses required`}
              </p>
              <div className="mt-2 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  !legalData?.licenses ? 'bg-gray-500' :
                  legalData.licenses.length > 3 ? 'bg-orange-500' :
                  legalData.licenses.length > 1 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {!legalData?.licenses ? 'Data unavailable' :
                   legalData.licenses.length > 3 ? 'Complex licensing' :
                   legalData.licenses.length > 1 ? 'Moderate licensing' : 'Simple licensing'}
                </span>
              </div>
            </motion.div>

            {/* Compliance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 bg-orange-500/5 dark:bg-orange-500/10 rounded-lg border border-orange-500/20 dark:border-orange-500/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg">
                  <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {legalData?.compliance?.length ? legalData.compliance.length : 'N/A'}
                </div>
              </div>
              <h4 className="font-semibold text-lg text-orange-600 dark:text-orange-400 mb-2">Compliance</h4>
              <p className="text-sm text-orange-500 dark:text-orange-400">
                {!legalData?.compliance ? 'No data available' :
                 legalData.compliance.length === 0 ? 'No compliance requirements' : 
                 legalData.compliance.length === 1 ? '1 requirement' :
                 `${legalData.compliance.length} requirements`}
              </p>
              <div className="mt-2 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  !legalData?.compliance ? 'bg-gray-500' :
                  legalData.compliance.length > 4 ? 'bg-red-500' :
                  legalData.compliance.length > 2 ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {!legalData?.compliance ? 'Data unavailable' :
                   legalData.compliance.length > 4 ? 'High complexity' :
                   legalData.compliance.length > 2 ? 'Medium complexity' : 'Low complexity'}
                </span>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20 dark:border-emerald-500/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {legalData?.recommendations?.length ? legalData.recommendations.length : 'N/A'}
                </div>
              </div>
              <h4 className="font-semibold text-lg text-emerald-600 dark:text-emerald-400 mb-2">Recommendations</h4>
              <p className="text-sm text-emerald-500 dark:text-emerald-400">
                {!legalData?.recommendations ? 'No data available' :
                 legalData.recommendations.length === 0 ? 'No recommendations available' : 
                 legalData.recommendations.length === 1 ? '1 suggestion' :
                 `${legalData.recommendations.length} suggestions`}
              </p>
              <div className="mt-2 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  !legalData?.recommendations ? 'bg-gray-500' :
                  legalData.recommendations.length > 3 ? 'bg-emerald-500' :
                  legalData.recommendations.length > 1 ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {!legalData?.recommendations ? 'Data unavailable' :
                   legalData.recommendations.length > 3 ? 'Comprehensive guidance' :
                   legalData.recommendations.length > 1 ? 'Basic guidance' : 'Limited guidance'}
                </span>
              </div>
            </motion.div>
          </div>
          
          {/* Beautiful Markdown Rendering */}
          <div className="bg-muted/20 dark:bg-muted/10 rounded-lg border border-border p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-7 prose-li:text-muted-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-th:text-foreground prose-td:text-muted-foreground prose-hr:border-border prose-a:text-primary hover:prose-a:text-primary/80">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 pb-2 border-b border-border">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-foreground mb-3 mt-5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground leading-7 mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 ml-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-muted-foreground leading-6">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-muted-foreground">
                      {children}
                    </em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary bg-muted/30 pl-4 py-2 mb-4">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <hr className="border-border my-6" />
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border-collapse border border-border">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border px-4 py-2 bg-muted font-semibold text-foreground text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-4 py-2 text-muted-foreground">
                      {children}
                    </td>
                  ),
                }}
              >
                {rawLegal}
              </ReactMarkdown>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
