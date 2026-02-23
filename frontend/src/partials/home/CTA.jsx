import { Link } from "react-router-dom";
import Button from "@components/common/Button";
import { FiArrowRight } from "react-icons/fi";

export const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary-400 to-primary-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-4xl font-bold text-white mb-6">
          Prête à Transformer Vos Cheveux?
        </h2>
        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
          Rejoignez des centaines de femmes qui ont déjà transformé leurs
          cheveux avec nos produits premium
        </p>
        <Link to="/shop">
          <Button variant="secondary" size="lg" icon={<FiArrowRight />}>
            Commencer Maintenant
          </Button>
        </Link>
      </div>
    </section>
  );
};
