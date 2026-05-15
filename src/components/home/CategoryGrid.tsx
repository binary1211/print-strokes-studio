import React from "react";
import { Link } from "react-router-dom";
import { Frame, Coffee, Gift, Smartphone, Clock, Award } from "lucide-react";

const staticCategories = [
  {
    id: "1",
    name: "Wall Decoratives",
    description: "Premium wall art and canvas prints",
    href: "/category/1",
    icon: Frame,
    color: "from-primary/20 to-primary/5",
    count: "120+ Items",
  },
  {
    id: "2",
    name: "Desk Decoratives",
    description: "Personalized mugs, frames and more",
    href: "/category/2",
    icon: Coffee,
    color: "from-secondary/20 to-secondary/5",
    count: "85+ Items",
  },
  {
    id: "3",
    name: "Photo Books",
    description: "Custom photo albums and memory books",
    href: "/category/3",
    icon: Gift,
    color: "from-green-500/20 to-green-500/5",
    count: "45+ Items",
  },
  {
    id: "4",
    name: "Home Decoratives",
    description: "Personalized home accessories",
    href: "/category/4",
    icon: Award,
    color: "from-yellow-500/20 to-yellow-500/5",
    count: "150+ Items",
  },
  {
    id: "5",
    name: "Car Decoratives",
    description: "Custom car hanging and accessories",
    href: "/category/5",
    icon: Clock,
    color: "from-blue-500/20 to-blue-500/5",
    count: "30+ Items",
  },
  {
    id: "6",
    name: "Mobile Accessories",
    description: "Custom phone cases and covers",
    href: "/category/6",
    icon: Smartphone,
    color: "from-purple-500/20 to-purple-500/5",
    count: "200+ Items",
  },
];

const CategoryGrid = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
            Explore Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our wide range of personalization options across different product categories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staticCategories.map((category) => {
            const IconComponent = category.icon;

            return (
              <Link
                key={category.id} // Use unique ID
                to={category.href}
                className="group card-elegant hover:shadow-brand transition-all duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent className="h-8 w-8 text-foreground/80" />
                </div>

                <h3 className="font-heading font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>

                <p className="text-muted-foreground mb-3">
                  {category.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">
                    {category.count}
                  </span>
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Explore →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;