"use client";

import Image from "next/image";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  description: string;
  category: "template" | "course" | "ebook" | "asset" | "service" | "hardware";
  price: number; // expressed in points
  thumbnail?: string;
}

const fallbackThumbnail = "/images/store/placeholder.svg";

const products: Product[] = [
  {
    id: "1",
    name: "Arduino Uno",
    description: "Original",
    category: "hardware",
    price: 1000,
    thumbnail:
      "https://store.arduino.cc/cdn/shop/files/A000066_03.front_934x700.jpg?v=1727098250",
  },
  {
    id: "2",
    name: "Raspberry Pi 4",
    description: "4GB kit",
    category: "hardware",
    price: 10000,
    thumbnail:
      "https://botland.store/img/art/inne/14645_3.jpg",
  },
  {
    id: "3",
    name: "LED Matrix",
    description: "8x8 RGB panel",
    category: "hardware",
    price: 3000,
    thumbnail:
      "https://fr.farnell.com/productimages/standard/en_US/78AC5396-40.jpg",
  },
  {
    id: "4",
    name: "Servo Motor",
    description: "MG996R",
    category: "hardware",
    price: 1000,
    thumbnail:
      "https://images.thingbits.net/eyJidWNrZXQiOiJ0aGluZ2JpdHMtbmV0Iiwia2V5IjoiajhndzI2YXI3NGFwOTBrNjV5ZDQyN3J2MjM2NSIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6NDgwLCJoZWlnaHQiOjM2MCwiZml0IjoiY292ZXIifX19",
  },
];

export default function StorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Point Shop</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <CompactCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function CompactCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={(event) => {
              const img = event.currentTarget as HTMLImageElement;
              img.onerror = null;
              img.src = fallbackThumbnail;
            }}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            <FileText className="h-5 w-5" />
          </div>
        )}
      </div>
      <CardContent className="p-3 flex gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold line-clamp-2">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0 capitalize">
              {product.category}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>{product.price} FP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
