"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const faqData = [
  {
    question: "How does BrandOrb AI accelerate product development?",
    answer: "BrandOrb AI uses advanced machine learning algorithms to analyze market trends, validate concepts, and provide data-driven insights. Our AI agents guide you through a structured 10-stage development process, automating research, competitor analysis, and strategic planning to reduce development time by up to 40%."
  },
  {
    question: "What makes the process automated?",
    answer: "Our platform leverages AI agents that handle time-consuming tasks like market research, competitive analysis, financial modeling, and compliance checking. The system automatically generates actionable insights, creates development roadmaps, and provides real-time recommendations based on your specific industry and target market."
  },
  {
    question: "Is the platform scalable for different business sizes?",
    answer: "Yes, BrandOrb AI is designed to scale from individual entrepreneurs to large enterprises. Our flexible architecture adapts to your team size, project complexity, and industry requirements. Whether you're launching a startup or developing new products within an established company, our platform grows with your needs."
  },
  {
    question: "What industries does BrandOrb AI support?",
    answer: "BrandOrb AI supports a wide range of industries including technology, healthcare, consumer goods, fintech, e-commerce, and more. Our AI models are trained on diverse market data and can adapt to specific industry requirements, regulations, and market dynamics."
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI maintains an 88% accuracy rate in market analysis and trend prediction. This high accuracy is achieved through continuous learning from market data, user feedback, and real-world product outcomes. The system constantly improves its predictions and recommendations based on new data inputs."
  },
  {
    question: "Can I integrate BrandOrb AI with existing tools?",
    answer: "Yes, BrandOrb AI offers robust API integration capabilities and supports popular project management, CRM, and business intelligence tools. We provide seamless integration with platforms like Slack, Trello, Salesforce, and more to fit into your existing workflow."
  },
  {
    question: "What support is available for users?",
    answer: "We provide comprehensive support including 24/7 chat support, detailed documentation, video tutorials, and dedicated account managers for enterprise clients. Our community forum allows users to share insights and best practices with other innovators."
  },
  {
    question: "How do you ensure data security and privacy?",
    answer: "BrandOrb AI employs enterprise-grade security measures including end-to-end encryption, secure data storage, and compliance with GDPR, CCPA, and other privacy regulations. Your business ideas and data are protected with bank-level security protocols."
  }
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions about BrandOrb AI and how it can transform your product development process.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-surface">
                <AccordionTrigger className="text-left text-surface hover:text-surface-accent transition-colors duration-200">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-surface-muted leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-16 p-8 bg-surface-muted rounded-2xl border border-surface"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-surface mb-4">
            Ready to build your next product?
          </h3>
          <p className="text-lg text-surface-muted mb-6">
            Get AI guidance from concept to launch. Experience a smarter way to innovate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="px-8 py-3 font-medium">
              <span className="text-white">Get Started</span>
            </Button>
            <Button variant="outline" className=" bg-surface  px-8 py-3 font-medium">
              Schedule Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
