import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-enhanced";

const SEARCH_HINTS = [
  "Acrylic wall clock",
  "Custom photo puzzle",
  "Name pencils for kids",
  "Personalized mobile case",
  "Canvas photo frame",
  "Metal name pen",
  "Photo mugs",
  "Custom keychains",
] as const;

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const navigate = useNavigate();


  // Auto-rotate search hints
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % SEARCH_HINTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) navigate(`/category/all?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchQuery ? "" : SEARCH_HINTS[currentHintIndex]}
            className="w-full pl-12 pr-32 py-4 text-lg rounded-2xl border-2 border-border hover:border-primary/50 focus:border-primary transition-colors"
          />
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            Search
          </Button>
        </div>

        {/* Hint Animation */}
        <p className="text-center text-sm text-muted-foreground mt-2 search-hints">
          Popular:
          <span className="ml-2 text-primary font-medium animate-fade-in">
            {SEARCH_HINTS[currentHintIndex]}
          </span>
        </p>
      </form>
    </div>
  );
};

export default SearchBar;
