import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Extras from "@/components/Extras";
import Footer from "@/components/Footer";
import KoiFish from "@/components/KoiFish";

export default function Home() {
  return (
    <main>
      <KoiFish />
      <Nav />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 24px" }}>
        <Hero />
        <Experience />
        <Projects />
        <Skills />
        <Extras />
      </div>
      <Footer />
    </main>
  );
}
