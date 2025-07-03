import RequestOrder from '../models/RequestOrders.js';
import generateOrderPDF from '../utils/orderPdfGenerator.js';

export const createRequestOrder = async (req, res) => {
  try {
    console.log("📥 Incoming order body:", req.body);

    const {
      companyName,
      maxQuantity,
      minOrderQuantity, // This will be renamed
      phoneNumber,
      foodType,
      itemCategory,
      orderedQuantity // This will be renamed
    } = req.body;

    // ✅ Rename to match schema
    if (
      !companyName ||
      !maxQuantity ||
      !minOrderQuantity ||
      !phoneNumber ||
      !foodType ||
      !itemCategory || 
      !orderedQuantity
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newRequest = new RequestOrder({
      companyName,
      maxQuantity,
      minQuantity: minOrderQuantity,     // ✅ rename here
      phoneNumber,
      foodType,
      itemCategory,
      orderQuantity: orderedQuantity     // ✅ rename here
    });

    await newRequest.save();

    res.status(201).json({
      message: 'Request order created successfully',
      order: newRequest
    });
  } catch (error) {
    console.error('Create Request Order Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


export const getAllRequestOrders = async (req, res) => {
  try {
    const orders = await RequestOrder.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching request orders:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// DELETE request order by ID
export const deleteRequestOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await RequestOrder.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete Request Order Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// PUT: Update a request order by ID
export const updateRequestOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderedQuantity } = req.body;

    if (!orderedQuantity) {
      return res.status(400).json({ message: 'Ordered quantity is required' });
    }

    const updatedOrder = await RequestOrder.findByIdAndUpdate(
      id,
      { orderQuantity: orderedQuantity },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order quantity updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update Request Order Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET: Single request order by ID
export const getSingleRequestOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await RequestOrder.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order); // Send the full order object
  } catch (error) {
    console.error('Get Single Order Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET: Search orders
// controllers/createRequestOrder.js

export const searchRequestOrders = async (req, res) => {
  try {
    const { search } = req.query;
    console.log("🔍 Search query:", search);

    const query = {
      $or: [
        { companyName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { foodType: { $regex: search, $options: 'i' } },
        { itemCategory: { $regex: search, $options: 'i' } }
      ]
    };

    const results = await RequestOrder.find(query).sort({ createdAt: -1 });
    console.log("✅ Search Results:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error('❌ Search Request Orders Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// export const downloadRequestOrdersPDF = async (req, res) => {
//   try {
//     const orders = await RequestOrder.find().sort({ createdAt: -1 });
//     if (!orders.length) return res.status(404).json({ message: 'No orders found' });

//     generateOrderPDF(orders, res);
//   } catch (error) {
//     console.error('PDF Download Error:', error.message);
//     res.status(500).json({ message: 'Failed to generate PDF' });
//   }
// };

export const downloadRequestOrdersPDF = async (req, res) => {
  try {
    const { search } = req.query;
    let orders = [];

    if (search) {
      orders = await RequestOrder.find({
        $or: [
          { companyName: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { foodType: { $regex: search, $options: 'i' } },
          { itemCategory: { $regex: search, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      orders = await RequestOrder.find().sort({ createdAt: -1 });
    }

    generateOrderPDF(orders, res);

  } catch (error) {
    console.error('PDF Download Error:', error.message);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

export const getRequestOrderCountByFoodType = async (req, res) => {
  try {
    const data = await RequestOrder.aggregate([
      { $group: { _id: "$foodType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching order stats:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
