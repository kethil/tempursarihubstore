import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { shopUtils } from "@/services/shopApi";

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  inStock?: boolean;
  layout?: "grid" | "list";
  onAddToCart?: () => void;
  onClick?: () => void;
  className?: string;
}

export const ProductCard = ({ 
  name, 
  price, 
  originalPrice,
  image, 
  rating,
  reviewCount,
  discount,
  inStock = true,
  layout = "grid",
  onAddToCart,
  onClick,
  className 
}: ProductCardProps) => {
  if (layout === "list") {
    return (
      <Card 
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-200",
          "hover:shadow-app-md hover:scale-[1.01]",
          "animate-fade-in",
          !inStock && "opacity-60",
          className
        )}
        onClick={onClick}
      >
        <div className="flex">
          <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden">
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            
            {discount && (
              <Badge 
                variant="destructive" 
                className="absolute top-1 left-1 text-xs font-medium"
              >
                -{discount}%
              </Badge>
            )}
            
            {!inStock && (
              <Badge 
                variant="secondary" 
                className="absolute bottom-1 left-1 text-xs"
              >
                Habis
              </Badge>
            )}
          </div>
          
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-2 leading-tight">
                {name}
              </h3>
              
              {rating && (
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">
                    {rating} {reviewCount && `(${reviewCount})`}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary text-sm">
                  {shopUtils.formatPrice(price)}
                </span>
                
                {originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {shopUtils.formatPrice(originalPrice)}
                  </span>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.();
              }}
              disabled={!inStock}
              className="w-full h-7 text-xs mt-2"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {inStock ? "Tambah" : "Habis"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200",
        "hover:shadow-app-md hover:scale-[1.02]",
        "animate-fade-in",
        !inStock && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        
        {discount && (
          <Badge 
            variant="destructive" 
            className="absolute top-2 left-2 text-xs font-medium"
          >
            -{discount}%
          </Badge>
        )}
        
        {!inStock && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-xs"
          >
            Habis
          </Badge>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-2 leading-tight">
          {name}
        </h3>
        
        {rating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {rating} {reviewCount && `(${reviewCount})`}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-primary text-sm">
            {shopUtils.formatPrice(price)}
          </span>
          
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {shopUtils.formatPrice(originalPrice)}
            </span>
          )}
        </div>
        
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.();
          }}
          disabled={!inStock}
          className="w-full h-8 text-xs"
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          {inStock ? "Tambah" : "Habis"}
        </Button>
      </div>
    </Card>
  );
};