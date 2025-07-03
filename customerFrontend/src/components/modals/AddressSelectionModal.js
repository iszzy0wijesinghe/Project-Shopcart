import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const AddressSelectionModal = ({ 
  isOpen, 
  onClose, 
  currentAddress, 
  savedAddresses, 
  onSelectAddress, 
  onAddNewAddress 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAddresses, setFilteredAddresses] = useState(savedAddresses);

  useEffect(() => {
    if (searchTerm) {
      const filtered = savedAddresses.filter(address => 
        address.line1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.zipCode.includes(searchTerm)
      );
      setFilteredAddresses(filtered);
    } else {
      setFilteredAddresses(savedAddresses);
    }
  }, [searchTerm, savedAddresses]);

  const renderAddressCard = (address, isActive) => (
    <div 
      key={address._id} 
      className={`
        flex items-center p-4 border rounded-lg mb-2 cursor-pointer transition-all 
        ${isActive 
          ? 'bg-green-50 border-green-300 hover:bg-green-100' 
          : 'bg-white hover:bg-gray-50 border-gray-200'}
      `}
      onClick={() => onSelectAddress(address)}
    >
      <MapPin className={`mr-3 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
      <div className="flex-grow">
        <h3 className={`text-sm font-semibold ${isActive ? 'text-green-800' : 'text-gray-800'}`}>
          {address.type || 'Address'}
        </h3>
        <p className="text-xs text-gray-600">
          {address.line1}, {address.city}, {address.state} {address.zipCode}
        </p>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-blue-600"
          onClick={(e) => {
            e.stopPropagation();
            // Handle edit address
          }}
        >
          <Edit2 size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            // Handle delete address
          }}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="mr-2 text-green-600" />
            Select Delivery Address
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search addresses" 
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full border-dashed border-2 text-green-600 hover:bg-green-50"
            onClick={onAddNewAddress}
          >
            <Plus className="mr-2" /> Add New Address
          </Button>

          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Saved Addresses</h4>
            {filteredAddresses.length > 0 ? (
              filteredAddresses.map(address => 
                renderAddressCard(address, address._id === currentAddress?._id)
              )
            ) : (
              <p className="text-center text-gray-500 py-4">No addresses found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddressSelectionModal;