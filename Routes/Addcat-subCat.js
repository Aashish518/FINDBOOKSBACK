const express = require("express");
const Category = require("../Schema/Category");
const Subcategory = require("../Schema/Subcategory");
const router = express.Router();

router.post("/Category", async (req, res) => {
  try {
    const { Category_Name } = req.body;

    // Validate input
    if (!Category_Name) {
      return res.status(400).json({ message: "Invalid Category_Name" });
    }

    const cat = await Category.findOne({ Category_Name }); // Add "await" here

    if (!cat) {
      const newCategory = new Category({ Category_Name });
      const savedCategory = await newCategory.save();

      res.status(201).json({
        message: "Category created successfully",
        category: savedCategory,
      });
    } else {
      return res.status(400).json({ message: "Category Already Exists" }); // Change status to 400 (Bad Request)
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
});


router.get("/Category", async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

router.post("/Subcategory", async (req, res) => {
  try {
    const { Subcategory_Name, Category_id } = req.body;

    // Validate input
    if (!Subcategory_Name) {
      return res.status(400).json({ message: "please enter Subcategory_Name" });
    } 

    if (!Category_id) {
      return res.status(400).json({ message: "please enter Category_id" });
    }

    // Ensure the referenced category exists
    const category = await Category.findById({_id : Category_id});
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCat = await Subcategory.findOne({
      Subcategory_Name: Subcategory_Name,
    });

    if (!subCat) {
      const newSubcategory = new Subcategory({
        Subcategory_Name,
        Category_id,
      });

      const savedSubcategory = await newSubcategory.save();
      res.status(201).json({
        message: "Subcategory created successfully",
        subcategory: savedSubcategory,
      });
    } else {
      return res.status(404).json({ message: "SubCategory Already Exists" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating subcategory", error: error.message });
  }
});

router.get("/:Category/Subcategory", async (req, res) => {
  try {
    // console.log("Fetching subcategories for category ID:", req.params.Category); // Log the category ID
    const subcategories = await Subcategory.find({
      Category_id: req.params.Category,
    });

    if (subcategories.length > 0) {
      res.json(subcategories);
    } else {
      res.status(404).json({ message: "No subcategories found" });
    }
  } catch (error) {
    console.error("Error fetching subcategories:", error); // Log the error
    res.status(500).json({ message: "Error fetching subcategories", error: error.message });
  }
});

module.exports = router;
