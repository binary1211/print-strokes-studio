// ponytail: Self-contained blog listing + full-width 2-column article detail view using static data.
// Ceiling: Static in-bundle posts. Upgrade path: Connect to headless CMS API when dynamic publishing is required.

import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Share2,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button-enhanced";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  image: string;
  highlights: string[];
  quote: string;
  sections: Array<{ heading: string; body: string }>;
  relatedCategoryLink: string;
  relatedProductTitle: string;
  relatedProductPrice: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "acrylic-photo-frames-vs-canvas-prints",
    title: "Acrylic Photo Cutouts vs. Traditional Canvas: Which is Best for Your Wall?",
    excerpt:
      "Discover why modern interior designers are switching to frameless 3mm HD acrylic prints for vibrant colors, glass-like depth, and effortless installation.",
    category: "Home Decor Guide",
    date: "Oct 10, 2026",
    readTime: "4 min read",
    author: "Aarav Mehta",
    authorRole: "Interior Styling Lead",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80",
    relatedCategoryLink: "/product/1",
    relatedProductTitle: "Custom Acrylic Photo Cutout (Wall Mount)",
    relatedProductPrice: "₹699",
    highlights: [
      "3mm & 5mm optical-grade cast acrylic delivers 3D glass-like depth.",
      "UV-cured ink resists sunlight fading and moisture for 10+ years.",
      "Zero-drill installation using industrial wall-mounting adhesive.",
    ],
    quote:
      "Frameless acrylic prints turn ordinary smartphone portraits into gallery-grade statement pieces that float effortlessly on your wall.",
    sections: [
      {
        heading: "1. Optical Clarity vs. Matte Texture",
        body: "When it comes to showcasing your favorite family portraits or travel photography, the material you print on makes all the difference. While traditional canvas has a textured weave that absorbs light and softens fine details, cast acrylic acts like a crystal-clear optical lens. High-definition UV ink is cured directly onto the back of the acrylic sheet, making colors look richer and blacks deeper.",
      },
      {
        heading: "2. Built for Indian Weather & Easy Cleaning",
        body: "Humidity and dust can warp wooden canvas stretchers over time. Acrylic photo cutouts are 100% waterproof, shatter-resistant, and weather-sealed. A quick wipe with a soft microfiber cloth restores the showroom gloss in seconds.",
      },
      {
        heading: "3. Hassle-Free 2-Minute Wall Mounting",
        body: "Forget hammers, nails, and wall damage. Every Print Strokes acrylic cutout comes pre-fitted with heavy-duty industrial adhesive strips, allowing you to arrange and mount a complete gallery wall in minutes.",
      },
    ],
  },
  {
    slug: "top-personalized-gift-ideas-for-anniversaries",
    title: "7 Thoughtful Personalized Gift Ideas for Anniversaries & Birthdays",
    excerpt:
      "Move beyond generic store-bought presents. From heat-sensitive magic mugs to LED backlit photo frames, here are custom gifts that leave a lasting impression.",
    category: "Gifting Inspiration",
    date: "Oct 6, 2026",
    readTime: "5 min read",
    author: "Priya Kapoor",
    authorRole: "Creative Gifting Curator",
    image: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=1200&auto=format&fit=crop&q=80",
    relatedCategoryLink: "/product/7",
    relatedProductTitle: "LED Ambient Backlit Acrylic Photo Frame",
    relatedProductPrice: "₹1,199",
    highlights: [
      "LED backlit frames double as warm bedroom night lamps.",
      "Heat-sensitive magic mugs reveal hidden photos with hot coffee.",
      "Live studio editor lets you add custom dates, names, and stickers.",
    ],
    quote:
      "The most memorable gifts aren't defined by their price tag—they're defined by the personal story they capture.",
    sections: [
      {
        heading: "1. LED Ambient Backlit Photo Frames",
        body: "Combine warm ambient lighting with a custom UV-printed portrait set on a solid beechwood base. Connected via USB, it casts a golden glow that turns a couple's favorite memory into a bedside centerpiece.",
      },
      {
        heading: "2. Heat-Sensitive Magic Photo Mugs",
        body: "At first glance, it looks like a sleek matte-black ceramic mug. Pour in hot chai or coffee, and the thermosensitive outer layer turns transparent—revealing your custom photo and anniversary message.",
      },
      {
        heading: "3. Silent Custom Acrylic Wall Clocks",
        body: "A functional piece of wall art featuring a sweep-motion silent quartz movement over a full-bleed wedding or family portrait. Personalize it in our Studio Editor with borders and text.",
      },
    ],
  },
  {
    slug: "how-to-choose-the-best-photo-for-custom-printing",
    title: "Pro Tips: How to Choose & Prepare Photos for Crystal-Clear Custom Prints",
    excerpt:
      "Learn quick lighting, resolution, and framing tips to make sure your smartphone photos look studio-sharp when printed on large acrylic frames or phone cases.",
    category: "Photography Tips",
    date: "Sep 28, 2026",
    readTime: "3 min read",
    author: "Rohan Desai",
    authorRole: "Print Production Specialist",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
    relatedCategoryLink: "/product/1/editor",
    relatedProductTitle: "Try the Live Photo Studio Editor",
    relatedProductPrice: "Free Preview",
    highlights: [
      "Always use original camera files instead of compressed chat forwards.",
      "Natural window light or golden hour photos yield the best skin tones.",
      "Leave margin around faces to fit decorative borders comfortably.",
    ],
    quote:
      "Today's smartphone cameras are more than powerful enough for 24-inch wall prints—as long as you keep the original uncompressed file.",
    sections: [
      {
        heading: "1. Avoid Compressed Messaging App Forwards",
        body: "When photos are sent over chat apps, they are often compressed down to a fraction of their original detail. Always ask for the original camera roll file or shared cloud link so your 16×16 or 20×20 inch print stays razor-sharp.",
      },
      {
        heading: "2. Look for Even, Natural Lighting",
        body: "Photos taken near a sunlit window or outdoors during golden hour have balanced highlights and shadows. This natural contrast translates remarkably well onto high-gloss acrylic and ceramic surfaces.",
      },
      {
        heading: "3. Frame with Borders & Stickers in Our Editor",
        body: "Leave a little breathing room around the edges of your subject. That extra space lets you add Royal Gold or Classic White Gallery borders, custom typography, and decorative badges inside the Print Strokes Studio Editor.",
      },
    ],
  },
  {
    slug: "custom-phone-cases-style-meets-protection",
    title: "Custom Phone Cases: How to Design a Cover That Protects & Stands Out",
    excerpt:
      "Your phone goes everywhere with you. See how dual-layer shockproof cases pair military-grade drop protection with scratch-resistant custom edge-to-edge art.",
    category: "Style & Tech",
    date: "Sep 19, 2026",
    readTime: "3 min read",
    author: "Sneha Nair",
    authorRole: "Product Designer",
    image: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=1200&auto=format&fit=crop&q=80",
    relatedCategoryLink: "/product/3",
    relatedProductTitle: "Personalized Tough Mobile Phone Case",
    relatedProductPrice: "₹399",
    highlights: [
      "Dual-layer polycarbonate shell + shock-absorbing TPU inner liner.",
      "Raised bezel edges protect both camera lenses and screen glass.",
      "Edge-to-edge UV matte finish prevents scratches and fingerprints.",
    ],
    quote:
      "We pick up our phones over a hundred times a day—making a custom case the most personal canvas you own.",
    sections: [
      {
        heading: "1. Engineered for Real-World Drops",
        body: "A great custom case shouldn't just look good—it needs to survive accidental drops. Our tough cases combine a flexible TPU bumper that absorbs corner impact with a rigid outer shell.",
      },
      {
        heading: "2. Designing a Clean Monogram or Pet Portrait",
        body: "Pet portraits, travel snapshots, and bold initials over a dark slate or blush backdrop are our most-loved phone case styles. Use the Studio Editor to position your subject below the camera cutout.",
      },
    ],
  },
  {
    slug: "workspace-makeover-with-custom-desk-decor",
    title: "Elevate Your Home Office with Personalized Wooden Nameplates & Desk Decor",
    excerpt:
      "Create an inspiring workspace with handcrafted pinewood nameplates, gold mirror acrylic lettering, and custom stationery tailored to your profession.",
    category: "Workspace & Office",
    date: "Sep 11, 2026",
    readTime: "4 min read",
    author: "Aarav Mehta",
    authorRole: "Interior Styling Lead",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80",
    relatedCategoryLink: "/product/6",
    relatedProductTitle: "Personalized Wooden Desk Nameplate",
    relatedProductPrice: "₹599",
    highlights: [
      "Handcrafted natural pinewood paired with mirror-gold 3D lettering.",
      "Ideal for executive cabins, doctor clinics, and study desks.",
      "Thoughtful congratulatory gift for promotions and new ventures.",
    ],
    quote:
      "A well-crafted desk nameplate anchors your workspace and signals craftsmanship the moment someone walks in.",
    sections: [
      {
        heading: "1. Natural Wood Meets Mirror Gold Acrylic",
        body: "Every desk block is cut from seasoned pinewood, hand-sanded to highlight the natural grain, and finished with laser-cut golden mirror acrylic lettering that catches the light.",
      },
      {
        heading: "2. The Ultimate Milestone Gift",
        body: "Looking for a meaningful gift for a colleague's promotion, a chartered accountant's new office, or a doctor's clinic? A custom nameplate is personal, practical, and built to last.",
      },
    ],
  },
  {
    slug: "creative-gallery-wall-layouts-for-living-room",
    title: "5 Creative Gallery Wall Layouts Using Multi-Size Acrylic Prints",
    excerpt:
      "Mix and match 12×12, 16×16, and 20×20 inch frames to turn a blank living room or staircase wall into a curated family storytelling space.",
    category: "Home Decor Guide",
    date: "Sep 2, 2026",
    readTime: "4 min read",
    author: "Priya Kapoor",
    authorRole: "Creative Gifting Curator",
    image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1200&auto=format&fit=crop&q=80",
    relatedCategoryLink: "/category/acrylic-cutouts",
    relatedProductTitle: "Explore Acrylic Wall Cutouts",
    relatedProductPrice: "From ₹699",
    highlights: [
      "Symmetrical 3×1 grids work best above sofas and beds.",
      "Staircase walls shine with stepped diagonal combinations.",
      "Consistent frame borders unify photos from different eras.",
    ],
    quote:
      "A blank wall is an open storytelling canvas—and modular square acrylic prints make layout planning effortless.",
    sections: [
      {
        heading: "1. The Classic Trio Above the Sofa",
        body: "Place three 16×16 inch square acrylic prints in a horizontal row centered above your sofa, leaving 3 inches between each frame. It creates instant visual balance without overwhelming the room.",
      },
      {
        heading: "2. Tying Diverse Photos Together with Borders",
        body: "When combining black-and-white vintage family photos with colorful holiday shots, apply the same Classic White Gallery or Sleek Matte Black border in our Studio Editor so the entire wall feels curated.",
      },
    ],
  },
];

export default function Blogs() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const activePost = slug ? BLOG_POSTS.find((post) => post.slug === slug) : null;
  const featuredPost = BLOG_POSTS[0];
  const categories = ["All", ...Array.from(new Set(BLOG_POSTS.map((p) => p.category)))];

  const filteredPosts =
    selectedCategory === "All"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === selectedCategory);

  // SINGLE BLOG DETAIL VIEW — Full container width matching ProductDetail / Checkout
  if (activePost) {
    const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== activePost.slug).slice(0, 3);

    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate("/blogs")} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Blogs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Article link copied!");
              }}
              className="rounded-xl text-xs font-semibold"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Article
            </Button>
          </div>

          {/* Article Header Banner — Full Container Width */}
          <div className="gradient-hero rounded-3xl border border-slate-200/80 p-6 sm:p-10 mb-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-primary text-white border-0 px-3 py-1 text-xs">
                {activePost.category}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {activePost.date}
              </span>
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {activePost.readTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 leading-tight mb-4 max-w-5xl">
              {activePost.title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-4xl mb-6">
              {activePost.excerpt}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary font-heading font-bold flex items-center justify-center text-sm">
                {activePost.author.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{activePost.author}</div>
                <div className="text-xs text-muted-foreground">{activePost.authorRole} • Print Strokes Studio</div>
              </div>
            </div>
          </div>

          {/* Main 12-Column Content Grid (Full Container Width like Checkout/ProductDetail) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Article Content */}
            <div className="lg:col-span-8 space-y-8">
              <div className="aspect-[16/9] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
                <img
                  src={activePost.image}
                  alt={activePost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Key Takeaways Box */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="w-4 h-4" /> Key Takeaways
                </div>
                <ul className="space-y-2">
                  {activePost.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Article Sections */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                {activePost.sections.map((sec, index) => (
                  <div key={index} className="space-y-2.5">
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-800">
                      {sec.heading}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      {sec.body}
                    </p>
                  </div>
                ))}

                {/* Pull Quote */}
                <blockquote className="my-6 border-l-4 border-primary bg-slate-50 rounded-r-2xl p-5 italic text-slate-800 font-medium text-base sm:text-lg">
                  “{activePost.quote}”
                </blockquote>
              </div>

              {/* Bottom CTA Banner */}
              <div className="gradient-hero rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Print Strokes Studio
                  </span>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">
                    Ready to personalize your own?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your photo, add borders, text & stickers in our live studio editor.
                  </p>
                </div>
                <Button variant="brand" size="lg" asChild className="flex-shrink-0">
                  <Link to={activePost.relatedCategoryLink}>
                    Customize Now <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right 4 Columns: Sticky Sidebar */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Featured Product Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Featured in Article
                  </span>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {activePost.relatedProductPrice}
                  </Badge>
                </div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={activePost.image}
                    alt={activePost.relatedProductTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-800">
                    {activePost.relatedProductTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    High-definition UV print with live customization preview.
                  </p>
                </div>
                <Button variant="brand" className="w-full rounded-xl font-bold" asChild>
                  <Link to={activePost.relatedCategoryLink}>
                    View & Personalize <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Related Blogs List */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-base text-slate-800 pb-2 border-b border-slate-100">
                  More Articles to Explore
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((item) => (
                    <div
                      key={item.slug}
                      onClick={() => navigate(`/blogs/${item.slug}`)}
                      className="group cursor-pointer flex gap-3 items-center"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-primary uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-muted-foreground">{item.readTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Layout>
    );
  }

  // BLOG LISTING VIEW — Rich 2-Column Hero matching Home Page + Full Container Grid
  return (
    <Layout>
      {/* Improved Hero Section */}
      <section className="gradient-hero py-14 lg:py-20 border-b border-slate-200/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left 7 Columns: Heading, Stats & Category Filter Pills */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                Print Strokes Journal
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight text-slate-900">
                Decor Ideas, Stories &
                <span className="text-gradient-brand block">Custom Gifting Guides</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Expert tips on choosing photos, designing gallery walls, and creating personalized acrylic, wooden, and ceramic keepsakes that tell your story.
              </p>

              {/* Quick Trust / Content Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-medium text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Interior Styling Guides
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Print Quality Tips
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Gifting Inspiration
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-white shadow-md scale-105"
                        : "bg-white/90 text-slate-700 border border-slate-200 hover:border-primary/40"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Featured Article Spotlight Card */}
            <div className="lg:col-span-5">
              <div
                onClick={() => navigate(`/blogs/${featuredPost.slug}`)}
                className="group cursor-pointer bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-elegant hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  <Badge className="absolute top-4 left-4 bg-primary text-white border-0 shadow-sm">
                    ★ Featured Story
                  </Badge>
                  <span className="absolute bottom-3 left-4 text-xs text-white/90 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime} • {featuredPost.date}
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                    {featuredPost.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-primary">
                    <span className="text-slate-600 font-semibold">By {featuredPost.author}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Featured Guide <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900">
              {selectedCategory === "All" ? "Latest Articles & Guides" : selectedCategory}
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              onClick={() => navigate(`/blogs/${post.slug}`)}
              className="group cursor-pointer bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <Badge className="absolute top-3 left-3 bg-white/95 text-slate-800 hover:bg-white shadow-sm">
                  {post.category}
                </Badge>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-xl font-heading font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> {post.author}
                  </span>
                  <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <BookOpen className="w-3.5 h-3.5" /> Read Article →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
