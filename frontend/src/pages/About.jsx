import { Header } from "../partials/about/Header";
import { Mission } from "../partials/about/Mission";
import { Values } from "../partials/about/Values";
import { CTA } from "../partials/about/CTA";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Header />

          {/* Hero Image */}
          {/* Mission & Vision */}
          <Mission />

          {/* Values */}
          <Values />

          {/* CTA */}
          <CTA />
        </div>
      </div>
    </div>
  );
};
export default About;
