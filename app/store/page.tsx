"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Star,
  Download,
  Eye,
  Heart,
  Search,
  Filter,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Award,
  Plus,
  BookOpen,
  Code,
  Palette,
  Video,
  Headphones,
  FileText,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  name: string;
  description: string;
  category: "template" | "course" | "ebook" | "asset" | "service";
  price: number;
  originalPrice?: number;
  type: "digital" | "service";
  rating: number;
  reviews: number;
  sales: number;
  downloads?: number;
  thumbnail: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  tags: string[];
  featured: boolean;
  isOwned?: boolean;
  releaseDate: string;
  lastUpdated: string;
  previewUrl?: string;
  demoUrl?: string;
}

interface Order {
  id: string;
  productName: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "refunded";
  downloadUrl?: string;
}

const products: Product[] = [
  {
    id: "1",
    name: "React Component Library",
    description:
      "Premium collection of 100+ React components with TypeScript support, Storybook documentation, and complete customization options.",
    category: "template",
    price: 49,
    originalPrice: 79,
    type: "digital",
    rating: 4.8,
    reviews: 127,
    sales: 1450,
    downloads: 3200,
    thumbnail: "/api/placeholder/300/200",
    author: {
      name: "Sarah Chen",
      avatar: "/api/placeholder/40/40",
      verified: true,
    },
    tags: ["React", "TypeScript", "Components", "UI Library"],
    featured: true,
    isOwned: false,
    releaseDate: "2024-10-15",
    lastUpdated: "2024-12-01",
    previewUrl: "https://preview-url.com",
    demoUrl: "https://demo-url.com",
  },
  {
    id: "2",
    name: "Full Stack Development Masterclass",
    description:
      "Complete course covering React, Node.js, MongoDB, and deployment. 40+ hours of content with hands-on projects.",
    category: "course",
    price: 129,
    originalPrice: 199,
    type: "digital",
    rating: 4.9,
    reviews: 234,
    sales: 890,
    thumbnail: "/api/placeholder/300/200",
    author: {
      name: "Mike Rodriguez",
      avatar: "/api/placeholder/40/40",
      verified: true,
    },
    tags: ["Full Stack", "React", "Node.js", "MongoDB"],
    featured: true,
    isOwned: true,
    releaseDate: "2024-08-20",
    lastUpdated: "2024-11-15",
  },
  {
    id: "3",
    name: "Dashboard Template Collection",
    description:
      "5 modern dashboard templates built with Tailwind CSS. Perfect for admin panels, analytics dashboards, and SaaS applications.",
    category: "template",
    price: 35,
    type: "digital",
    rating: 4.7,
    reviews: 89,
    sales: 567,
    downloads: 1200,
    thumbnail: "/api/placeholder/300/200",
    author: {
      name: "Alex Johnson",
      avatar: "/api/placeholder/40/40",
      verified: false,
    },
    tags: ["Dashboard", "Tailwind CSS", "Admin Panel", "Templates"],
    featured: false,
    isOwned: false,
    releaseDate: "2024-09-10",
    lastUpdated: "2024-10-22",
  },
  {
    id: "4",
    name: "JavaScript Interview Guide",
    description:
      "Comprehensive ebook covering 200+ JavaScript interview questions with detailed explanations and code examples.",
    category: "ebook",
    price: 19,
    type: "digital",
    rating: 4.6,
    reviews: 156,
    sales: 2100,
    downloads: 4500,
    thumbnail: "/api/placeholder/300/200",
    author: {
      name: "Emma Wilson",
      avatar: "/api/placeholder/40/40",
      verified: true,
    },
    tags: ["JavaScript", "Interview", "Career", "Guide"],
    featured: false,
    isOwned: true,
    releaseDate: "2024-07-05",
    lastUpdated: "2024-09-18",
  },
  {
    id: "5",
    name: "Code Review Service",
    description:
      "Professional code review service with detailed feedback, best practices recommendations, and performance optimization tips.",
    category: "service",
    price: 99,
    type: "service",
    rating: 4.9,
    reviews: 67,
    sales: 145,
    thumbnail: "/api/placeholder/300/200",
    author: {
      name: "David Lee",
      avatar: "/api/placeholder/40/40",
      verified: true,
    },
    tags: ["Code Review", "Consulting", "Best Practices", "Optimization"],
    featured: false,
    isOwned: false,
    releaseDate: "2024-11-01",
    lastUpdated: "2024-12-05",
  },
];

const orders: Order[] = [
  {
    id: "1",
    productName: "Full Stack Development Masterclass",
    amount: 129,
    date: "2024-11-15",
    status: "completed",
    downloadUrl: "https://download-url.com",
  },
  {
    id: "2",
    productName: "JavaScript Interview Guide",
    amount: 19,
    date: "2024-10-22",
    status: "completed",
    downloadUrl: "https://download-url.com",
  },
  {
    id: "3",
    productName: "React Hooks Course",
    amount: 79,
    date: "2024-09-08",
    status: "completed",
  },
];

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const { t } = useLanguage();

  const categories = Array.from(
    new Set(products.map((product) => product.category)),
  );
  const priceRanges = ["Under $25", "$25-$50", "$50-$100", "Over $100"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;

    let matchesPrice = true;
    if (priceRange) {
      switch (priceRange) {
        case "Under $25":
          matchesPrice = product.price < 25;
          break;
        case "$25-$50":
          matchesPrice = product.price >= 25 && product.price <= 50;
          break;
        case "$50-$100":
          matchesPrice = product.price > 50 && product.price <= 100;
          break;
        case "Over $100":
          matchesPrice = product.price > 100;
          break;
      }
    }

    if (activeTab === "browse")
      return matchesSearch && matchesCategory && matchesPrice;
    if (activeTab === "owned")
      return (
        matchesSearch && matchesCategory && matchesPrice && product.isOwned
      );
    if (activeTab === "featured")
      return (
        matchesSearch && matchesCategory && matchesPrice && product.featured
      );
    if (activeTab === "wishlist") return false; // Would implement wishlist logic

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const getCategoryIcon = (category: Product["category"]) => {
    switch (category) {
      case "template":
        return <Code className="h-4 w-4" />;
      case "course":
        return <Video className="h-4 w-4" />;
      case "ebook":
        return <BookOpen className="h-4 w-4" />;
      case "asset":
        return <Palette className="h-4 w-4" />;
      case "service":
        return <Users className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalOwned = products.filter((p) => p.isOwned).length;
  const totalSpent = orders
    .filter((o) => o.status === "completed")
    .reduce((acc, order) => acc + order.amount, 0);
  const totalDownloads = products
    .filter((p) => p.isOwned && p.downloads)
    .reduce((acc, p) => acc + (p.downloads || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("store.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("store.subtitle")}</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("store.sellProduct")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalOwned}</div>
                <p className="text-xs text-muted-foreground">
                  {t("store.productsOwned")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">${totalSpent}</div>
                <p className="text-xs text-muted-foreground">
                  {t("store.totalSpent")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {totalDownloads.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("store.downloads")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  {t("store.orders")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Products */}
      {products.some((p) => p.featured) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t("store.featuredProducts")}
            </CardTitle>
            <CardDescription>{t("store.handPicked")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products
                .filter((p) => p.featured)
                .slice(0, 2)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{product.name}</h4>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                          {product.rating}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm line-through text-muted-foreground">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <Button size="sm" disabled={product.isOwned}>
                          {product.isOwned
                            ? t("store.owned")
                            : t("store.buyNow")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("store.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">{t("store.allCategories")}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">{t("store.allPrices")}</option>
            {priceRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">{t("store.tabs.browse")}</TabsTrigger>
          <TabsTrigger value="owned">{t("store.tabs.myProducts")}</TabsTrigger>
          <TabsTrigger value="featured">{t("store.tabs.featured")}</TabsTrigger>
          <TabsTrigger value="orders">
            {t("store.tabs.orderHistory")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryIcon(product.category)}
                      <span className="ml-1">{product.category}</span>
                    </Badge>
                  </div>
                  {product.originalPrice && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="text-xs">
                        {Math.round(
                          ((product.originalPrice - product.price) /
                            product.originalPrice) *
                            100,
                        )}
                        {t("store.off")}
                      </Badge>
                    </div>
                  )}
                  {product.isOwned && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="default" className="text-xs">
                        {t("store.owned")}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-lg leading-tight">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={product.author.avatar}
                        alt={product.author.name}
                      />
                      <AvatarFallback>
                        {product.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">
                          {product.author.name}
                        </p>
                        {product.author.verified && (
                          <Badge variant="secondary" className="text-xs h-4">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      <span>{product.rating}</span>
                      <span>({product.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>{product.sales}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xl font-bold">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm line-through text-muted-foreground ml-2">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {product.previewUrl && (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" disabled={product.isOwned}>
                        {product.isOwned ? t("store.owned") : t("store.buy")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="owned" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => p.isOwned)
              .map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="default">{t("store.owned")}</Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm">{t("store.access")}</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => p.featured)
              .map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-full h-40 object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                      {t("store.featured")}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        ${product.price}
                      </span>
                      <Button size="sm" disabled={product.isOwned}>
                        {product.isOwned ? t("store.owned") : t("store.buyNow")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{order.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.date)} &middot;{" "}
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">${order.amount}</span>
                      {order.downloadUrl && (
                        <Button variant="outline" size="sm">
                          <a href={order.downloadUrl}></a>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
