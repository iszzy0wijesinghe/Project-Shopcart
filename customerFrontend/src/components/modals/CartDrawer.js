import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  Tag, 
  Truck, 
  DollarSign, 
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  updateItemQuantity, 
  removeItem, 
  proceedToCheckout 
}) => {
  const [couponCode, setCouponCode] = useState('');
  
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    // Implement delivery fee calculation logic
    return 5.99;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    return subtotal + deliveryFee;
  };

  const renderCartItem = (item) => (
    <Card key={item.productId} className="mb-2">
      <CardContent className="p-3 flex items-center space-x-3">
        <img 
          src={item.image || '/placeholder-product.png'} 
          alt={item.name} 
          className="w-16 h-16 object-cover rounded-md"
        />
        <div className="flex-grow">
          <h3 className="text-sm font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.unit}</p>
          <p className="text-sm font-medium">${item.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{item.quantity}</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-500 hover:bg-red-50"
            onClick={() => removeItem(item.productId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[450px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center">
              <ShoppingCart className="mr-2 text-green-600" />
              Your Cart ({cartItems.length} items)
            </SheetTitle>
          </SheetHeader>

          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <ShoppingCart className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Your cart is empty</p>
                <p className="text-sm">Start adding items to your cart</p>
              </div>
            ) : (
              cartItems.map(renderCartItem)
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="p-4 border-t space-y-3">
              <div className="flex items-center">
                <Tag className="mr-2 text-purple-500" />
                <input 
                  type="text" 
                  placeholder="Coupon code" 
                  className="flex-grow border rounded-md px-2 py-1 text-sm"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button variant="outline" size="sm" className="ml-2">Apply</Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Truck className="mr-2 text-blue-500" />
                    <span>Delivery Fee</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="ml-1 text-gray-400" size={16} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delivery fees vary based on store and time of delivery</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span>${calculateDeliveryFee().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="flex items-center">
                    <DollarSign className="mr-1" size={16} />
                    {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                onClick={proceedToCheckout}
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;