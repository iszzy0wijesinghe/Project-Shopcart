import ShopOwnerRequest from '../models/shopOwnerRequest.js';
import generateSupplierRequestsPDF from '../utils/supplierRequestPdf.js';
import Supplier from '../models/supplierModel.js';

// Create a new supplier request
export const createShopOwnerRequest = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      maxStock,
      minStock,
      phoneNumber,
      foodType,
      categoryType,
    } = req.body;

    if (
      !companyName || !companyEmail || !maxStock || !minStock ||
      !phoneNumber || !foodType || !categoryType
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newRequest = new ShopOwnerRequest({
      companyName,
      companyEmail,
      maxStock,
      minStock,
      phoneNumber,
      foodType,
      categoryType,
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('Error creating request:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all supplier requests
export const getAllShopOwnerRequests = async (req, res) => {
  try {
    const requests = await ShopOwnerRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update all fields of a shop owner request (except status)
export const updateShopOwnerRequest = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        companyName,
        companyEmail,
        maxStock,
        minStock,
        phoneNumber,
        foodType,
        categoryType,
      } = req.body;
  
      if (
        !companyName || !companyEmail || !maxStock || !minStock ||
        !phoneNumber || !foodType || !categoryType
      ) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const updated = await ShopOwnerRequest.findByIdAndUpdate(
        id,
        {
          companyName,
          companyEmail,
          maxStock,
          minStock,
          phoneNumber,
          foodType,
          categoryType,
        },
        { new: true } // return the updated document
      );
  
      if (!updated) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      res.status(200).json({
        message: 'Request updated successfully',
        request: updated
      });
    } catch (error) {
      console.error('Error updating request:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
// DELETE a shop owner supplier request
export const deleteShopOwnerRequest = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedRequest = await ShopOwnerRequest.findByIdAndDelete(id);
  
      if (!deletedRequest) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      res.status(200).json({ message: 'Request deleted successfully' });
    } catch (error) {
      console.error('Error deleting request:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Search shop owner requests by company name, email, food type, or category
  export const searchShopOwnerRequests = async (req, res) => {
    try {
      const { search } = req.query;
  
      const query = {
        $or: [
          { companyName: { $regex: search, $options: 'i' } },
          { companyEmail: { $regex: search, $options: 'i' } },
          { foodType: { $regex: search, $options: 'i' } },
          { categoryType: { $regex: search, $options: 'i' } }
        ]
      };
  
      const results = await ShopOwnerRequest.find(query).sort({ createdAt: -1 });
      res.status(200).json(results);
    } catch (error) {
      console.error('Error searching requests:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };


  export const downloadAllShopOwnerRequestsPDF = async (req, res) => {
    try {
      const { search } = req.query;
  
      let query = {};
      if (search) {
        query = {
          $or: [
            { companyName: { $regex: search, $options: 'i' } },
            { companyEmail: { $regex: search, $options: 'i' } },
            { categoryType: { $regex: search, $options: 'i' } }
          ]
        };
      }
  
      const requests = await ShopOwnerRequest.find(query).sort({ createdAt: -1 });
  
      if (!requests.length) {
        return res.status(404).json({ message: 'No requests found' });
      }
  
      generateSupplierRequestsPDF(requests, res);
    } catch (err) {
      console.error('PDF generation failed:', err.message);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  };
  

// Get single request by ID
export const getShopOwnerRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ShopOwnerRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.status(200).json(request);
  } catch (error) {
    console.error('Error fetching request:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const acceptSupplierRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await ShopOwnerRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const newSupplier = new Supplier({
      companyName: request.companyName,
      companyEmail: request.companyEmail,
      lastStockOrder: request.maxStock,
      minOrderQuantity: request.minStock,
      phoneNumber: request.phoneNumber,
      foodType: request.foodType,
      itemCategory: request.categoryType,
    });

    await newSupplier.save();
    await ShopOwnerRequest.findByIdAndDelete(requestId); // remove from pending

    res.status(200).json({ message: 'Supplier accepted and added' });
  } catch (error) {
    console.error('Accept Request Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const ignoreSupplierRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const deleted = await ShopOwnerRequest.findByIdAndDelete(requestId);

    if (!deleted) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({ message: 'Request ignored and deleted' });
  } catch (error) {
    console.error('Ignore Request Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


