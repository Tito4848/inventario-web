import LandingNav from '../components/landing/LandingNav'
import HeroSection from '../components/landing/HeroSection'
import BenefitsSection from '../components/landing/BenefitsSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import StatsSection from '../components/landing/StatsSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import FAQSection from '../components/landing/FAQSection'
import FooterSection from '../components/landing/FooterSection'

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <FAQSection />
      <FooterSection />
    </div>
  )
}
