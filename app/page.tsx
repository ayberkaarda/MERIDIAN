import Footer from '../components/sections/Footer';
import FinalHero from '../components/sections/FinalHero';
import Hero from '../components/sections/Hero';
import Interlude from '../components/sections/Interlude';
import Manifesto from '../components/sections/Manifesto';
import OrbitalSystem from '../components/sections/OrbitalSystem';
import Spacecraft from '../components/sections/Spacecraft';
import Stats from '../components/sections/Stats';
import Stories from '../components/sections/Stories';
import TechnologyIndex from '../components/sections/TechnologyIndex';
import Timeline from '../components/sections/Timeline';

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Manifesto />
        <OrbitalSystem />
        <Timeline />
        <TechnologyIndex />
        <Spacecraft />
        <Stats />
        <Stories />
        <Interlude />
        <FinalHero />
        <Footer />
      </main>
    </>
  );
}
