import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Frame, Coffee, Gift, Smartphone, Clock, Award } from "lucide-react";

// Mapping from API category names to local icons and colors
const categoryMap = {
  "WALL DECORATIVES": {
    icon: Frame,
    color: "from-primary/20 to-primary/5",
  },
  "DESK DECORATIVES": {
    icon: Coffee,
    color: "from-secondary/20 to-secondary/5",
  },
  "PHOTO BOOKS": {
    icon: Gift,
    color: "from-green-500/20 to-green-500/5",
  },
  "HOME DECORATIVES": {
    icon: Award,
    color: "from-yellow-500/20 to-yellow-500/5",
  },
  "CAR DECORATIVES": {
    icon: Clock,
    color: "from-blue-500/20 to-blue-500/5",
  },
  "FASHION & ACCESSORIES": {
    icon: Smartphone,
    color: "from-purple-500/20 to-purple-500/5",
  },
  "MOBILE ACCESSORIES": {
    icon: Smartphone,
    color: "from-purple-500/20 to-purple-500/5",
  },
  "OFFICE STATIONERY": {
    icon: Coffee,
    color: "from-secondary/20 to-secondary/5",
  }
};

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          setError("Access token not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8080/api/v1/category", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // The API response returns "name" as a string with all caps.
        // The code now uses the `categoryMap` to dynamically assign the correct icon and color.
        const formattedCategories = data.data.map((category) => {
          const mappedInfo = categoryMap[category.name] || {
            icon: Award,
            color: "from-gray-500/20 to-gray-500/5",
          }; // Default if not found
          return {
            ...category,
            name: category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase(),
            description: category.description,
            href: `/category/${category.id}`, // Using id for routing
            icon: mappedInfo.icon,
            color: mappedInfo.color,
            count: "N/A", // This is not available in the API response, so it's a placeholder
          };
        });

        setCategories(formattedCategories);
      } catch (e) {
        setError("Failed to fetch categories: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-muted/30 text-center">
        <p>Loading categories...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-muted/30 text-center text-red-500">
        <p>{error}</p>
      </section>
    );
  }

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
          {categories.map((category) => {
            const IconComponent = category.icon;

            return (
              <Link
                key={category.id} // Use unique ID from API
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