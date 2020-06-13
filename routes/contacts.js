const express = require("express");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const config = require("config");
const User = require("../models/User");
const Contact = require("../models/Contact");
const router = express.Router();

//@route  GET api/contacts
//@desc   Get all user contacts
//@access Private

router.get("/", auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route  POST api/contacts
//@desc   Add new contact
//@access Private

router.post(
  "/",
  [auth, [check("name", "Name is required").not().isEmpty()]],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, phone, type } = req.body;
    try {
      const newContact = new Contact({
        name,
        email,
        phone,
        type,
        user: req.user.id,
      });
      const contact = await newContact.save();
      res.json(contact);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route  PUT api/contacts/:id
//@desc   Update contact given contact ID
//@access Private

router.put("/:id", auth, async (req, res) => {
  const { name, email, phone, type } = req.body;
  const contactFields = {};
  if (name) contactFields.name = name;
  if (email) contactFields.email = email;
  if (type) contactFields.type = type;
  if (phone) contactFields.phone = phone;
  try {
    let contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ msg: "Contact not found!" });
    }
    //Make sure user owns the contact
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized!" });
    }
    //Save to DB
    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: contactFields },
      { new: true }
    );
    //return the updated contact
    res.json(contact);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route  DELETE api/contacts/:id
//@desc   Delete contact
//@access Private

router.delete("/:id", auth, async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ msg: "Contact not found!" });
    }
    //Make sure user owns the contact
    if (contact.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized!" });
    }

    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: "Contact deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
