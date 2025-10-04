import { Product } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = "grid" }) => {
  if (viewMode === "list") {
    return (
      <Link to={`/product/${product.id}`} className="block w-full">
        <Card className="group cursor-pointer border border-gray-200 shadow-none hover:shadow-md transition-all duration-300 w-full">
          <CardContent className="p-0 w-full">
            <div className="flex w-full min-h-[192px]">
              {/* Image Section */}
              <div className="w-48 h-48 flex-shrink-0 overflow-hidden bg-accent">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Content Section */}
              <div className="flex-1 p-6 flex flex-col justify-between min-w-0 w-full">
                <div className="w-full">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-medium text-xl text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    
                    {/* Price Section */}
                    <div className="text-right flex-shrink-0">
                      {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice}
                        </p>
                      )}
                      <p className="font-semibold text-xl text-foreground">
                        ${product.price}
                      </p>
                    </div>
                  </div>
                  
                  {/* Tags & Category */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.category}
                    </Badge>
                    {product.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant={tag === 'on-sale' ? 'destructive' : tag === 'new-arrival' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {tag === 'new-arrival' ? 'New' : tag === 'on-sale' ? 'Sale' : tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Sizes */}
                <div className="mt-4 w-full">
                  <p className="text-sm text-muted-foreground">
                    Available sizes: {product.sizes.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Grid view
  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group cursor-pointer border-0 shadow-none hover:shadow-lg transition-all duration-200">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-accent relative">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Tags overlay for grid view */}
            {product.tags.length > 0 && (
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant={tag === 'on-sale' ? 'destructive' : tag === 'new-arrival' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {tag === 'new-arrival' ? 'New' : tag === 'on-sale' ? 'Sale' : tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between mt-3">
              <div>
                {product.originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice}
                  </p>
                )}
                <p className="font-semibold text-lg">
                  ${product.price}
                </p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {product.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};