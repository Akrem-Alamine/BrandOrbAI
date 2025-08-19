"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";
import Image from "next/image";

const footerLinks = {
  Company: [
    { name: "About", href: "/about" },
    { name: "Team", href: "/team" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" }
  ],
  Platform: [
    { name: "How It Works", href: "/how-it-works" },
    { name: "API Docs", href: "/api-docs" },
    { name: "Security", href: "/security" },
    { name: "Integrations", href: "/integrations" }
  ],
  Resources: [
    { name: "Blog", href: "/blog" },
    { name: "Success Stories", href: "/success-stories" },
    { name: "Pricing", href: "/pricing" },
    { name: "Guides", href: "/guides" }
  ],
  Support: [
    { name: "FAQ", href: "/faq" },
    { name: "Help Center", href: "/help" },
    { name: "Community", href: "/community" },
    { name: "Legal", href: "/legal" }
  ]
};

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com/brandorb", icon: Twitter },
  { name: "LinkedIn", href: "https://linkedin.com/company/brandorb", icon: Linkedin },
  { name: "GitHub", href: "https://github.com/brandorb", icon: Github },
  { name: "Email", href: "mailto:hello@brandorb.ai", icon: Mail }
];

export default function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
                <Link href="/" className="flex items-center space-x-2 mb-5">
                <div className="relative h-12 w-auto">
                  <Image
                  src="/logo/white.svg"
                  alt="BrandOrb AI"
                  height={60}
                  width={210}
                  className="h-12 w-auto dark:hidden"
                  priority
                  />
                  <Image
                  src="/logo/dark.svg"
                  alt="BrandOrb AI"
                  height={60}
                  width={210}
                  className="h-12 w-auto hidden dark:block"
                  priority
                  />
                </div>
                </Link>
              <p className="text-gray-300 mb-6 max-w-sm">
                Transform your ideas into market-ready products with AI-powered guidance. 
                From concept to launch, we make innovation smarter.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200 text-gray-300 hover:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <motion.div
          className="mt-12 pt-8 border-t border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold text-white mb-2">Stay Updated</h4>
              <p className="text-gray-300">
                Get the latest product development insights and AI updates.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors duration-200"
              />
              <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-300 text-sm mb-4 md:mb-0">
            © 2025 BrandOrb AI. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-300 hover:text-white transition-colors duration-200">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-gray-300 hover:text-white transition-colors duration-200">
              Cookie Policy
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
