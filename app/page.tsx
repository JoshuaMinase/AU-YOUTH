import Landing from '../components/Landing';
import CommunitySection from '../components/CommunitySection';
import PhotoStackSection from '../components/PhotoStackSection';
import IdeasSection from '../components/IdeasSection';
import Footer from '../components/Footer';

export default function Page() {
  return (
    <>
      <Landing />
      <CommunitySection />
      <PhotoStackSection />

      {/*
        IdeasSection (z-10) + Footer (z-20) share one stacking context
        so the footer's negative margin pulls it up OVER the folder SVG.
      */}
      <div style={{ position: 'relative' }}>
        <IdeasSection />
        <Footer overlap />
      </div>
    </>
  );
}
