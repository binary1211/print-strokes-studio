import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import SearchBar from "@/components/home/SearchBar";
import ProductSection from "@/components/home/ProductSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import PresetGrid from "@/components/home/PresetGrid";

const Index = () => (
  <Layout>
    <HeroSection />
    <PresetGrid />
    <section className="py-8 bg-background">
      <div className="container mx-auto"><SearchBar /></div>
    </section>
    <ProductSection
      title="Our Products"
      subtitle="Choose an active product and start personalizing."
      limit={8}
      viewAllLink="/category/all"
    />
    <CategoryGrid />
  </Layout>
);

export default Index;
