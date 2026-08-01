import { useHome } from "../hooks/useHome";
import { Hero } from "../partials/home/Hero";
import { Categories } from "../partials/home/Categories";
import { FeaturedProducts } from "../partials/home/FeaturedProducts";
import { WhyChooseUs } from "../partials/home/WhyChooseUs";
import { Testimonial } from "../partials/home/Testimonial";
import { CTA } from "../partials/home/CTA";

const Home = () => {
  const { featuredProducts, loading } = useHome();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Categories Section */}
      <Categories />

      {/* Featured Products */}
      <FeaturedProducts loading={loading} featuredProducts={featuredProducts} />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Testimonials */}
      <Testimonial />

      {/* CTA Section */}
      <CTA />
    </div>
  );
};
export default Home;
