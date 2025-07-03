import Supplier from "../models/supplierModel.js"
import ExcelJS from 'exceljs';
import generateSupplierPDF from '../utils/supplierPdfGenerator.js';
import generateAdminDashboardPDF from '../utils/adminDashboardPdfGenerator.js';
import RequestOrder from '../models/RequestOrders.js';


// Create new supplier
export const createSupplier = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail, // ✅ New field
      lastStockOrder,
      minOrderQuantity,
      phoneNumber,
      foodType,
      itemCategory,
    } = req.body;

    // Simple validation
    if (
      !companyName ||
      !companyEmail || // ✅ Validate email
      !lastStockOrder ||
      !minOrderQuantity ||
      !phoneNumber ||
      !foodType ||
      !itemCategory
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newSupplier = new Supplier({
      companyName,
      companyEmail, // ✅ Save email
      lastStockOrder,
      minOrderQuantity,
      phoneNumber,
      foodType,
      itemCategory,
    });

    await newSupplier.save();

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: newSupplier,
    });
  } catch (error) {
    console.error('Create Supplier Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};



// ✅ KEEP THIS ONE
export const getAllSuppliers = async (req, res) => {
  try {
    const foodType = req.query.foodType;

    console.log("🍽️ Incoming foodType:", foodType);

    if (foodType) {
      const suppliers = await Supplier.find({ foodType: foodType });
      console.log("✅ Suppliers returned:", suppliers.length); // 👈 Add this line
      return res.status(200).json(suppliers);
    }

    const allSuppliers = await Supplier.find();
    console.log("✅ All suppliers returned:", allSuppliers.length);
    return res.status(200).json(allSuppliers);
  } catch (error) {
    console.error('Get Suppliers Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};



export const updateSupplier = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const {
      companyName,
      companyEmail, // ✅ Added email
      lastStockOrder,
      minOrderQuantity,
      phoneNumber,
      foodType,
      itemCategory
    } = req.body;

    // ✅ Validate required fields
    if (
      !companyName ||
      !companyEmail ||
      !lastStockOrder ||
      !minOrderQuantity ||
      !phoneNumber ||
      !foodType ||
      !itemCategory
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      {
        companyName,
        companyEmail,
        lastStockOrder,
        minOrderQuantity,
        phoneNumber,
        foodType,
        itemCategory
      },
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error('Update Supplier Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};


// DELETE supplier by ID
export const deleteSupplier = async (req, res) => {
    try {
      const supplierId = req.params.id;
  
      const deletedSupplier = await Supplier.findByIdAndDelete(supplierId);
  
      if (!deletedSupplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
  
      res.status(200).json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Delete Supplier Error:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
};

// Download Supplier PDF
export const downloadSupplierExcel = async (req, res) => {
  try {
    const suppliers = await Supplier.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Suppliers');

    // Add Title Row
    worksheet.mergeCells('A1', 'F1');
    worksheet.getCell('A1').value = 'My Pending Supplier Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add Header Row
    worksheet.addRow([
      'Company Name',
      'Last Stock Order',
      'Min Order Qty',
      'Phone Number',
      'Food Type',
      'Item Category',
    ]).font = { bold: true };

    // Add Data Rows
    suppliers.forEach((supplier) => {
      worksheet.addRow([
        supplier.companyName,
        supplier.lastStockOrder,
        supplier.minOrderQuantity,
        supplier.phoneNumber,
        supplier.foodType,
        supplier.itemCategory,
      ]);
    });

    // Auto-width for all columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 10;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = maxLength < 20 ? 20 : maxLength;
    });

    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers.xlsx');

    // Write file to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Download Error:', error.message);
    res.status(500).json({ message: 'Error generating Excel file' });
  }
};

export const searchSuppliers = async (req, res) => {
  try {
    const query = req.query.query || '';
    const searchRegex = new RegExp(query, 'i');

    const suppliers = await Supplier.find({
      $or: [
        { companyName: { $regex: searchRegex } },
        { foodType: { $regex: searchRegex } },
        { itemCategory: { $regex: searchRegex } },
      ],
    });

    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Search Suppliers Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json(supplier); // ✅ return supplier directly
  } catch (error) {
    console.error('Get Supplier By ID Error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
 
export const downloadSupplierPDF = async (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const suppliers = await Supplier.find({
      $or: [
        { companyName: { $regex: search, $options: 'i' } },
        { foodType: { $regex: search, $options: 'i' } },
        { itemCategory: { $regex: search, $options: 'i' } },
      ]
    });

    generateSupplierPDF(suppliers, res);
  } catch (err) {
    console.error('PDF download error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

export const getSupplierCountByFoodType = async (req, res) => {
  try {
    const data = await Supplier.aggregate([
      {
        $group: {
          _id: "$foodType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          foodType: "$_id",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json(data);
  } catch (error) {
    console.error("Food Type Count Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const downloadAdminDashboardPDF = async (req, res) => {
  try {
    const suppliers = await Supplier.find();

    const foodTypeStats = await Supplier.aggregate([
      {
        $group: {
          _id: "$foodType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          foodType: "$_id",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]); 

    const requestStats = await RequestOrder.aggregate([
      {
        $group: {
          _id: "$foodType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          foodType: "$_id",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // ✅ Call the PDF generator with correct parameter order
    generateAdminDashboardPDF(suppliers, foodTypeStats, requestStats, res);
  } catch (error) {
    console.error('Admin PDF generation error:', error.message);
    res.status(500).json({ message: 'Failed to generate admin PDF' });
  }
};