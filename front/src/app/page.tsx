import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Stats />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
