//jshint esversion:6
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const item = mongoose.model("item", itemsSchema);

const item1 = new item({
  name: "todo1",
});
const item2 = new item({
  name: "todo2",
});

const defaultItems = [item1, item2];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const list = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  const q = item.find({});
  q.exec()
    .then((documents) => {
      if (documents.length == 0) {
        item.insertMany(defaultItems);
      }
      // console.log('Documents:', documents);
      // documents.forEach(function (item) {
      //   console.log(item.name);
      // });
      res.render("list", { listTitle: "Today", newListItems: documents });

      // mongoose.connection.close();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const newList = new list({
    name: customListName,
    items: defaultItems,
  });

  list
    .findOne({ name: customListName })
    .then((document) => {
      if (document) {
        console.log("found");
        res.render("list", {
          listTitle: document.name,
          newListItems: document.items,
        });
      } else {
        console.log("nope");
        newList.save();
        res.redirect("/" + customListName);
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  // console.log(itemName);

  const listName = req.body.list;

  const newItem = new item({
    name: itemName,
  });

  if (listName == "today") {
    if (itemName.length == 0) {
      // alert("Enter a valid note with length");
      res.redirect("/");
    } else {
      item.insertMany(newItem);
      res.redirect("/");
    }
  } else {
    if (itemName.length == 0) {
      // alert("Enter a valid note with length");
      res.redirect("/" + listName);
    } else {
      list
        .findOne({ name: listName })
        .then((document) => {
          if (document) {
            console.log("found");
            document.items.push(newItem);
            document.save();
            res.redirect("/" + listName);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }
});

app.post("/delete", function (req, res) {
  // console.log(req.body.checkbox);
  const Itemid = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "today") {
    item
      .findByIdAndDelete(Itemid)
      .then((deletedDocument) => {
        console.log(`Deleted document: ${deletedDocument}`);
      })
      .catch((error) => {
        console.error(error);
      });
    res.redirect("/");
  } else {
    list
      .findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: Itemid } } }
      )
      .then(function (item) {
        // console.log(item)
      });
    res.redirect("/" + listName);
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
