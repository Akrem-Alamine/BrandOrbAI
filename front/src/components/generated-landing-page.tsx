'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Users, 
  Shield, 
  Zap, 
  Mail, 
  Phone, 
  MapPin,
  Globe,
  Award,
  TrendingUp,
  Heart,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from "lucide-react"

interface WebsiteAnalysis {
  company_name: string
  industry: string
  business_type: string
  target_audience: string
  unique_value_proposition: string
  key_services: string[]
  competitive_advantages: string[]
  brand_colors: string[]
  brand_personality: string
  website_sections: string[]
  call_to_action: string
  seo_keywords: string[]
  tone_of_voice: string
  business_model: string
  stage: string
  key_metrics: string[]
  social_proof_elements: string[]
}

interface GeneratedLandingPageProps {
  analysis: WebsiteAnalysis
  businessData?: {
    business_summary?: string
    financial_data?: string
    market_data?: string
    legal_data?: string
    brand_identity_data?: string
  }
}

export default function GeneratedLandingPage({ analysis, businessData }: GeneratedLandingPageProps) {
  const [contactForm, setContactForm] = React.useState({
    name: '',
    email: '',
    message: ''
  })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Contact form submitted:', contactForm)
    alert('Thank you for your message! We\'ll get back to you soon.')
    setContactForm({ name: '', email: '', message: '' })
  }

  const primaryColor = analysis.brand_colors?.[0] || 'hsl(var(--primary))'
  const secondaryColor = analysis.brand_colors?.[1] || 'hsl(var(--secondary))'
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">{analysis.company_name}</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</a>
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</a>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</a>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-surface to-surface-muted py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 bg-surface-muted text-surface-accent border-surface-accent/20">
              {analysis.industry} • {analysis.business_type}
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
              {analysis.unique_value_proposition || `Welcome to ${analysis.company_name}`}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We specialize in delivering exceptional {analysis.key_services?.slice(0, 2).join(' and ')} solutions 
              for {analysis.target_audience}. Experience the difference with our {analysis.brand_personality} approach.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                {analysis.call_to_action || 'Get Started Today'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-surface-accent text-surface-accent hover:bg-surface-accent hover:text-primary-foreground">
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
              {analysis.key_metrics?.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {index === 0 ? '500+' : index === 1 ? '99%' : index === 2 ? '24/7' : '5★'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{metric}</div>
                </div>
              )) || [
                { value: '500+', label: 'Happy Clients' },
                { value: '99%', label: 'Success Rate' },
                { value: '24/7', label: 'Support' },
                { value: '5★', label: 'Rating' }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-surface">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/20 text-primary">About Us</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose {analysis.company_name}?</h2>
              <p className="text-lg text-muted-foreground">
                We're dedicated to providing exceptional service in the {analysis.industry} industry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {analysis.competitive_advantages?.map((advantage, index) => (
                <Card key={index} className="border-border/50 bg-card shadow-card hover:shadow-gentle transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      {index === 0 ? <Star className="h-6 w-6 text-primary" /> :
                       index === 1 ? <Shield className="h-6 w-6 text-primary" /> :
                       <Zap className="h-6 w-6 text-primary" />}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{advantage}</h3>
                    <p className="text-sm text-muted-foreground">
                      Experience the benefits of our {advantage.toLowerCase()} in everything we do.
                    </p>
                  </CardContent>
                </Card>
              )) || [
                { icon: Star, title: 'Expert Team', description: 'Our experienced professionals deliver exceptional results.' },
                { icon: Shield, title: 'Trusted Service', description: 'Reliable and secure solutions you can count on.' },
                { icon: Zap, title: 'Fast Delivery', description: 'Quick turnaround times without compromising quality.' }
              ].map((item, index) => (
                <Card key={index} className="border-border/50 bg-card shadow-card hover:shadow-gentle transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/20 text-primary">Our Services</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">What We Offer</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive solutions tailored to your needs in {analysis.industry}.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {analysis.key_services?.map((service, index) => (
                <Card key={index} className="border-border/50 bg-card shadow-card hover:shadow-gentle transition-all hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      {index % 4 === 0 ? <Users className="h-6 w-6 text-primary" /> :
                       index % 4 === 1 ? <TrendingUp className="h-6 w-6 text-primary" /> :
                       index % 4 === 2 ? <Award className="h-6 w-6 text-primary" /> :
                       <Heart className="h-6 w-6 text-primary" />}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{service}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Professional {service.toLowerCase()} solutions designed to exceed your expectations.
                    </p>
                    <div className="flex items-center text-sm text-primary font-medium group-hover:text-primary/80">
                      Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              )) || [
                { icon: Users, title: 'Consulting', description: 'Expert consultation services.' },
                { icon: TrendingUp, title: 'Strategy', description: 'Strategic planning and execution.' },
                { icon: Award, title: 'Implementation', description: 'Professional implementation.' }
              ].map((item, index) => (
                <Card key={index} className="border-border/50 bg-card shadow-card hover:shadow-gentle transition-all hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <div className="flex items-center text-sm text-primary font-medium group-hover:text-primary/80">
                      Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {analysis.social_proof_elements?.includes('testimonials') && (
        <section className="py-20 bg-surface">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 border-primary/20 text-primary">Testimonials</Badge>
                <h2 className="text-3xl font-bold text-foreground mb-4">What Our Clients Say</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    name: "Sarah Johnson",
                    role: "CEO, TechStart",
                    content: `${analysis.company_name} exceeded our expectations. Their ${analysis.brand_personality} approach made all the difference.`,
                    rating: 5
                  },
                  {
                    name: "Michael Chen",
                    role: "Founder, GrowthCorp",
                    content: `Outstanding service and results. The team's expertise in ${analysis.industry} is impressive.`,
                    rating: 5
                  }
                ].map((testimonial, index) => (
                  <Card key={index} className="border-border/50 bg-card shadow-card">
                    <CardContent className="p-6">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-primary font-semibold">{testimonial.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-primary/20 text-primary">Contact Us</Badge>
              <h2 className="text-3xl font-bold text-foreground mb-4">Get In Touch</h2>
              <p className="text-lg text-muted-foreground">
                Ready to get started? Contact us today for a consultation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-primary mr-3" />
                    <span className="text-muted-foreground">hello@{analysis.company_name.toLowerCase().replace(/\s+/g, '')}.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-primary mr-3" />
                    <span className="text-muted-foreground">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-3" />
                    <span className="text-muted-foreground">123 Business Ave, Suite 100</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-foreground mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                      <Button key={index} size="sm" variant="outline" className="w-10 h-10 p-0 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground">
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">Name</label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="border-border focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="border-border focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">Message</label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      required
                      className="border-border focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                    Send Message
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">{analysis.company_name}</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                {analysis.unique_value_proposition || `Leading provider of ${analysis.key_services?.[0] || 'professional services'} in ${analysis.industry}.`}
              </p>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                  <Button key={index} size="sm" variant="ghost" className="w-8 h-8 p-0 text-muted-foreground hover:text-primary">
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Services</h3>
              <ul className="space-y-2">
                {analysis.key_services?.slice(0, 4).map((service, index) => (
                  <li key={index}>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      {service}
                    </a>
                  </li>
                )) || [
                  'Consulting',
                  'Strategy',
                  'Implementation',
                  'Support'
                ].map((service, index) => (
                  <li key={index}>
                    <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      {service}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors text-sm">About</a></li>
                <li><a href="#services" className="text-muted-foreground hover:text-primary transition-colors text-sm">Services</a></li>
                <li><a href="#contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2025 {analysis.company_name}. All rights reserved.
            </p>
            <p className="text-muted-foreground text-sm mt-2 sm:mt-0">
              Built with ❤️ by BrandOrbAI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
